# Loop Engineering

Loop engineering is the practice of designing the feedback cycle an AI coding agent runs through to ship real work. The model is one piece — the loop around it (skills, worktrees, MCP servers, verification steps) is what turns a prompt into a merged PR.

This note covers the building blocks I use day to day with Claude Code: skills for repeatable workflows, worktrees for isolated parallel work, the RPIT loop as a structural pattern, and the MCP servers that let the agent see and touch the outside world.

---

## Brief

A "good loop" has four properties:

- **Isolated** — work happens in a sandbox the agent can't accidentally trash (a worktree, a branch, a container).
- **Observable** — the agent can read its own output (logs, screenshots, test results) and correct course.
- **Repeatable** — the same input produces the same steps. Encoded as a skill or workflow, not improvised every run.
- **Reversible** — anything destructive needs an explicit confirmation step or a clean undo (delete the worktree, drop the branch).

Skip any one of these and the loop turns into a coin flip. Loop engineering is mostly removing the coin flips.

---

## The RPIT Loop

RPIT stands for **Read → Plan → Implement → Test**. It's the default shape for any non-trivial coding task and maps directly to how Claude Code operates.

```text
   ┌─────────┐
   │  Read   │  gather context: files, git log, configs, related code
   └────┬────┘
        ↓
   ┌─────────┐
   │  Plan   │  outline steps; surface trade-offs before writing code
   └────┬────┘
        ↓
   ┌─────────┐
   │Implement│  edits in small, reviewable diffs
   └────┬────┘
        ↓
   ┌─────────┐
   │  Test   │  build, run, browser-check, type-check — feed errors back
   └────┬────┘
        │
        └────── loop back to Read on failure
```

| Phase | Goal | Common tools |
| --- | --- | --- |
| Read | Build a mental model | `Read`, `Grep`, `Explore` subagent |
| Plan | Surface decisions before code | Plan mode, `TaskCreate` |
| Implement | Apply minimal diffs | `Edit`, `Write` |
| Test | Verify in the real environment | `npm run build`, Playwright MCP, `verify` skill |

Why it matters: skipping **Read** leads to confident-but-wrong edits; skipping **Plan** leads to scope creep; skipping **Test** lets type errors and runtime crashes ship.

---

## Skills

A skill is a named, reusable instruction set the agent invokes with a slash command (`/skill-name`). Skills compose the loop: each one encodes a workflow you'd otherwise re-explain in every prompt.

Three skills I rely on most:

### 1. Create Issue Skill

Turns a free-form request into a well-structured GitHub issue and files it on the right repo.

What the skill does:

- Reads the current repo context (`gh repo view`, `git remote`)
- Drafts a title (≤70 chars) and a body with **Problem / Proposal / Acceptance criteria**
- Adds labels and assignees from defaults
- Confirms with the user before creating
- Calls `gh issue create` with the assembled payload

Why use a skill instead of writing the issue yourself:

- Title and body shape stay consistent across the repo
- Labels never get forgotten
- The agent already has the diff context — it can link to related commits
- One slash command vs. five back-and-forth messages

Example invocation:

```text
/create-issue The TTS button stutters on Safari when switching voices mid-playback
```

### 2. Update Docs Skill

Keeps `CLAUDE.md` / `README.md` / inline docs honest after a code change. Documentation drift is the silent killer of long-lived repos.

What the skill does:

- Diffs current branch against `main`
- Identifies docs that reference changed files, commands, or paths
- Edits the docs in-place
- Flags ambiguous cases ("this command name changed — keep old as alias?") for the user

Run it as the last step of the RPIT loop, before opening the PR.

### 3. Cleanup Worktree Skill

After spawning worktrees for parallel work, you end up with a forest of `~/.worktrees/feat-*` directories. The cleanup skill:

- Lists all worktrees (`git worktree list`)
- For each: checks if the branch is merged, the PR is closed, or the tree is dirty
- Prunes safe ones, prompts for ambiguous ones, never touches dirty ones without confirmation
- Runs `git worktree prune` to clean stale metadata

Without this, you eventually `cd` into a worktree that doesn't exist anymore or run out of disk.

---

## Worktrees

`git worktree` lets one repo have multiple working directories checked out to different branches at the same time. They share `.git/objects` so they're cheap on disk.

```bash
# Create an isolated working dir on a new branch
git worktree add ../worktrees/feat-payment-flow -b feat/payment-flow

# List them
git worktree list

# Remove when done (after the branch is merged/deleted)
git worktree remove ../worktrees/feat-payment-flow
git worktree prune                            # clean stale metadata
```

### Why worktrees matter for agent loops

| Problem without worktrees | What worktrees give you |
| --- | --- |
| Two agents editing the same file race each other | Each agent gets its own directory |
| Stashing/unstashing to swap tasks | Just `cd` between trees |
| Long-running test from task A blocks task B | Trees are independent — parallel `npm test` is fine |
| Mistakes contaminate `main` | Mistakes stay inside the worktree |

Claude Code's `Agent` tool supports `isolation: "worktree"` as an option — the subagent gets a fresh worktree, works there, and the parent gets the branch + path back. Use it when subagents will write files that could conflict.

### Worktree hygiene

- Keep them under a single parent directory (`~/worktrees/` or `../worktrees/`).
- Name them after the branch — `feat-payment-flow`, not `tmp1`.
- Always remove via `git worktree remove`, never `rm -rf`. The latter leaves stale entries in `.git/worktrees/`.
- Pair every `worktree add` with a planned `worktree remove`. The cleanup skill enforces this.

---

## Playwright MCP

MCP (Model Context Protocol) is the standard for letting agents call external tools. Playwright MCP exposes a real browser to the agent — it can navigate, click, type, screenshot, and read the DOM.

What you get:

| Capability | Use |
| --- | --- |
| `browser_navigate` | Open a URL in a real Chromium |
| `browser_snapshot` | Get the accessibility tree of the current page |
| `browser_click` | Click an element by ref |
| `browser_type` | Fill an input |
| `browser_take_screenshot` | Capture image for inspection |
| `browser_console_messages` | Read JS console errors |
| `browser_network_requests` | Inspect XHR/fetch traffic |

### Why it matters for the loop

The **Test** step of RPIT used to mean "run the test suite." For UI work, that's not enough — a test suite can pass while the page renders broken. Playwright MCP closes the loop:

```text
Implement edit → start dev server → playwright opens http://localhost:3000
        → snapshot → check the DOM matches intent → screenshot on failure → fix
```

This is the difference between "the build passes" and "the feature works."

### Pattern: agent-driven manual QA

1. Make the change in code.
2. Start the dev server (`npm run dev`) in the background.
3. Use Playwright MCP to navigate to the affected page.
4. Take a snapshot, verify the elements you expected are present.
5. Click through the user flow — agent observes each step.
6. If the snapshot shows the wrong state, go back to Implement.

Pair this with the `verify` skill, which packages the dev-server-+-Playwright dance into one slash command.

---

## Subagents and Parallelism

A single conversation has one context window. Long research, broad searches, or fan-out edits will blow past it. Subagents solve this:

- **`Explore`** — read-only search agent. Use for "where is X defined?" or "find all callers of Y." Doesn't pollute the main context with grep output.
- **`Plan`** — design an implementation plan without touching files.
- **`general-purpose`** — open-ended multi-step research.
- **Custom typed agents** — defined per-project (e.g. `code-reviewer`, `claude-code-guide`).

Run them in **parallel** when independent:

```text
Agent(Explore, "find every place we call the TTS API")
Agent(Explore, "find the audio player component hierarchy")
Agent(Explore, "find any existing voice-switching tests")
```

The parent gets three summaries back instead of three context-bloating tool result dumps.

---

## Hooks

Hooks are shell commands the harness runs around tool calls — they're the layer that lets you enforce things the model can't be trusted to remember every time.

Use cases:

- Auto-format files after `Edit` / `Write` (`prettier --write`)
- Block commits that touch `.env`
- Re-run type-check after writes
- Send a desktop notification when the agent finishes
- Audit log every Bash command

Configured in `~/.claude/settings.json`. Hooks fire deterministically; memory and preferences do not. Use hooks when you need *every* matching tool call to do X.

---

## Memory

Persistent file-based notes that survive across conversations. Four types:

| Type | Holds |
| --- | --- |
| `user` | Who you are, your role, preferences |
| `feedback` | Corrections and validations — "don't do X, do Y" |
| `project` | In-flight work, deadlines, decisions, motivations |
| `reference` | Pointers to external systems (Linear, Grafana, Slack) |

Memory exists so the agent doesn't make you repeat yourself across sessions. It's not for code patterns or file paths — those are recoverable from the repo. It's for the *why* behind decisions and the *who* you're working with.

---

## Workflows

When a task fans out — review every file changed, audit N modules, find bugs across a codebase — a one-shot agent isn't enough. Workflows are scripted multi-agent orchestrations:

```text
phase('Find')      → N parallel finders, each with a different lens
phase('Verify')    → adversarial verifiers refute the findings
phase('Synthesize')→ one agent merges survivors into a report
```

Key patterns:

- **Pipeline** — items flow through stages independently (no barrier between stages).
- **Parallel** — fan out, then synchronize (barrier).
- **Loop-until-dry** — keep finding new issues until K consecutive rounds return nothing new.
- **Adversarial verify** — every finding faces N independent skeptics; only survivors ship.

The mental shift: stop asking "what should the agent do?" and start asking "what's the *shape* of the work?" That shape is the workflow.

---

## Putting It Together

A realistic loop for shipping a small feature with Claude Code:

```text
1. /create-issue describing the change
2. git worktree add ~/wt/feat-x -b feat/x  (or Agent isolation: worktree)
3. RPIT loop in the worktree:
     Read → Plan → Implement → Test
     Test = npm run build + Playwright MCP visit to localhost
4. /update-docs   (touch CLAUDE.md, README if affected)
5. /code-review   (independent agent reviews the diff)
6. Commit, push, gh pr create
7. /cleanup-worktrees  (after PR merges)
```

Every step is a piece of the loop. Each piece is small, observable, and reversible — together they replace "vibe-coding" with a system that lands work consistently.

---

## Anti-Patterns

Things that quietly destroy your loop quality:

- **One mega-prompt for the whole feature.** Break into RPIT phases.
- **Skipping verification because the build passed.** A passing build is necessary, not sufficient.
- **Letting worktrees pile up.** They share git objects but use disk for `node_modules`.
- **Running agents serially when they could be parallel.** A 3-way parallel search finishes in the time of the slowest one, not the sum.
- **Putting code patterns into memory.** They go stale the moment the code changes. Memory is for *non-derivable* context.
- **Trusting the agent's summary over the diff.** "Trust but verify" — always read the change.

---

## Further Topics Worth Exploring

- Plan mode (`EnterPlanMode`) for design discussions that shouldn't write code yet
- Long-running background tasks and the harness notification model
- Tool deferral / `ToolSearch` for keeping the active toolset small
- Custom agent definitions in `.claude/agents/`
- Slash-command vs. skill vs. workflow — when to pick each
- Cost shaping: token budgets and the prompt cache TTL (5 min)
