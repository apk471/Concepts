---

# Setup top-gun (openclaw) on a new VM — clean start

## Context

Standing up a new agent called **top-gun** on a fresh VM, running on the openclaw platform. Clean start — no session history, no workspace, no media.
The personalities and PR-review plugin code live in the `ask-myfi/oc-personalities` GitHub repo, which gets cloned into the runtime dir and refreshed
hourly by `sync-owner-runes.sh`. Cloning the repo brings across all the `.md` agent/personality files used by 1000x. A new Slack app/bot account is
being created to replace the old `im-danager` account.

## Stepwise procedure

### Step 1 — VM prereqs

- Fresh Ubuntu/Debian VM, ≥20 GB free disk
- Install: `nodejs` (v22.x), `npm` (10.x), `git`, `python3.11+` with `venv`, `systemd`, `cron`, `openssh-client`
- Outbound network: Anthropic, Together (Kimi fallback), Slack, GitHub (SSH on port 22), Linear, Codemagic, GCP
- Time sync (`chrony` / `systemd-timesyncd`)  


### Step 2 — Create system user and group

```bash
sudo groupadd topgungrp
sudo useradd --gid topgungrp --home-dir /home/top-gun --create-home --shell /bin/bash top-gun
# Add operators who need group access
sudo usermod -aG topgungrp kiran
sudo usermod -aG topgungrp saravanan
sudo usermod -aG topgungrp gokul
```

(Use `/bin/bash` not `nologin` so `sudo -u top-gun git` works for the SSH clone in Step 5. Switch to nologin later if you want to harden.)

### Step 3 — Install openclaw globally

```bash
sudo npm install -g openclaw@2026.4.15
openclaw --version    # → OpenClaw 2026.4.15
```

### Step 4 — Initialise a clean runtime state dir

```bash
sudo -u top-gun mkdir -p /home/top-gun/.openclaw/{bin,plugins,repos,cron,mcp-servers}
sudo chmod 700 /home/top-gun/.openclaw
sudo chown -R top-gun:topgungrp /home/top-gun/.openclaw
```

### Step 5 — Bring across the personalities/PR-review content

All the `.md` files used by 1000x (`SOUL.md`, `IDENTITY.md`, `MEMORY.md`, `AGENTS.md`, `USER.md`, `TOOLS.md`, and the ~30 `*_PERSONALITY.md` files
like `MYFI_BOT_PERSONALITY.md`, `JERICHO_PERSONALITY.md`, `ZARA_PERSONALITY.md`, etc.) live in the `ask-myfi/oc-personalities` repo. Cloning it brings
them all automatically and the sync script keeps them current.

**5a. Generate a deploy key for top-gun and add it to the GitHub repo**

```bash
sudo -u top-gun ssh-keygen -t ed25519 -f /home/top-gun/.ssh/id_ed25519 -N "" -C "top-gun@<new-vm-host>"
sudo -u top-gun cat /home/top-gun/.ssh/id_ed25519.pub
```

Add the printed pubkey to `ask-myfi/oc-personalities` → Settings → Deploy keys (read-only is enough — the sync script only fetches, never pushes).

```bash
sudo -u top-gun ssh -o StrictHostKeyChecking=accept-new -T git@github.com   # confirms key works
```

**5b. Clone the repo**

```bash
sudo -u top-gun git clone git@github.com:ask-myfi/oc-personalities.git \
  /home/top-gun/.openclaw/repos/oc-personalities
```

**5c. Install + patch the sync script**

```bash
sudo scp user@old-vm:/home/1000x/.openclaw/bin/sync-owner-runes.sh \
  /home/top-gun/.openclaw/bin/sync-owner-runes.sh
sudo chown top-gun:topgungrp /home/top-gun/.openclaw/bin/sync-owner-runes.sh
sudo chmod 700 /home/top-gun/.openclaw/bin/sync-owner-runes.sh

# Patch paths and restart command
sudo sed -i 's|/home/1000x/|/home/top-gun/|g' /home/top-gun/.openclaw/bin/sync-owner-runes.sh
sudo sed -i 's|systemctl --user restart openclaw-gateway|sudo systemctl restart top-gun-gateway|' \
  /home/top-gun/.openclaw/bin/sync-owner-runes.sh
```

**5d. Allow top-gun to restart its own gateway without a password** (so the sync script can recycle after plugin updates):

```bash
echo 'top-gun ALL=(root) NOPASSWD: /bin/systemctl restart top-gun-gateway' \
  | sudo tee /etc/sudoers.d/top-gun-restart
sudo chmod 440 /etc/sudoers.d/top-gun-restart
```

**5e. First-run population**

```bash
sudo -u top-gun /home/top-gun/.openclaw/bin/sync-owner-runes.sh
# Verifies it can pull the repo, then deploys owner-runes.json + plugins/owner-runes/
```

After this you should see `/home/top-gun/.openclaw/owner-runes.json` and `/home/top-gun/.openclaw/plugins/owner-runes/{index.js, package.json,        
  openclaw.plugin.json}` — all chmod 400. All the .md files (SOUL, IDENTITY, MEMORY, AGENTS, USER, TOOLS, and every `*_PERSONALITY.md`) are now  
 available at `/home/top-gun/.openclaw/repos/oc-personalities/`.

### Step 6 — Config: `/home/top-gun/.openclaw/openclaw.json`

Generate via `sudo -u top-gun openclaw config init`, then set:

- Auth profiles: `anthropic` + `together`
- Models: primary `claude-sonnet-4-6`, fallbacks `claude-opus-4-7` and Kimi via Together
- Gateway port `41879`
- Bot display name: `top-gun`  


### Step 7 — Secrets: `/home/top-gun/.openclaw/.env`

Mode `600`, owned `top-gun:topgungrp`. Pull values from your secret store:

- `SLACK_BOT_TOKEN` — **new** token from the new top-gun Slack app (Step 10)
- `SLACK_APP_TOKEN` — **new** Socket Mode token
- `LINEAR_API_KEY`, `LINEAR_ACCESS_TOKEN`
- `GH_TOKEN` — repo access for ask-myfi repos
- `CODEMAGIC_API_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS` — path to GCP service-account JSON  


### Step 8 — MCP servers

Bootstrap fresh:

- **linear-mcp** — clone source (URL from old VM's `mcp-servers/linear-mcp/package.json`), `npm install`, `npm run build` into  
  `/home/top-gun/.openclaw/mcp-servers/linear-mcp/build/`
- **github-mcp** — installed on-demand via `npm exec @modelcontextprotocol/server-github`
- **codemagic-mcp-improved** — clone under `~/.openclaw/workspace/repos/codemagic-mcp-improved/`, create `.venv`, `pip install -e .`  


### Step 9 — Cron jobs (`/home/top-gun/.openclaw/cron/jobs.json`)

Only one:

- `sync-owner-runes-hourly` — every 60 min, runs `/home/top-gun/.openclaw/bin/sync-owner-runes.sh`. Keeps the personalities .md files + plugin in step
  with `oc-personalities/main`.

### Step 10 — New Slack app (replacing `im-danager`)

Create a **new** Slack app for top-gun. Do not reuse `im-danager` credentials.

1. api.slack.com → Create New App → name `top-gun` → workspace `askmyfi`
2. Enable **Socket Mode**, generate app-level token → `SLACK_APP_TOKEN`
3. Add **Bot Token Scopes**:
   - `chat:write`, `chat:write.public`
   - `channels:history`, `channels:read`, `channels:join`
   - `groups:history`, `groups:read`
   - `im:history`, `im:read`, `im:write`
   - `app_mentions:read`, `users:read`, `files:read`, `files:write`
4. Install app to workspace → bot token → `SLACK_BOT_TOKEN`
5. Event Subscriptions → enable: `app_mention`, `message.channels`, `message.groups`, `message.im`
6. Invite `@top-gun` to channels it needs to post in (create `#top-gun` or `#reach-out-top-gun` for cron deliveries)
7. Once verified working, deactivate the old `im-danager` app  


### Step 11 — systemd unit

Create `/etc/systemd/system/top-gun-gateway.service`:

```ini
[Unit]
Description=top-gun AI Agent Gateway
After=network-online.target
Wants=network-online.target

[Service]
User=top-gun
Group=topgungrp
ExecStart=/usr/bin/node /usr/lib/node_modules/openclaw/dist/index.js gateway --port 41879
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group
Environment=HOME=/home/top-gun
Environment=OPENCLAW_HOME=/home/top-gun
Environment=PATH=/usr/bin:/usr/local/bin:/bin
Environment=OPENCLAW_GATEWAY_PORT=41879
Environment=OPENCLAW_SYSTEMD_UNIT=top-gun-gateway.service
Environment=OPENCLAW_SERVICE_MARKER=top-gun
Environment=OPENCLAW_SERVICE_KIND=gateway
Environment=OPENCLAW_STATE_DIR=/home/top-gun/.openclaw
EnvironmentFile=/home/top-gun/.openclaw/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now top-gun-gateway
```

### Step 12 — Smoke test

```bash
sudo systemctl status top-gun-gateway
sudo journalctl -u top-gun-gateway -f
ss -tlnp | grep 41879
```

Functional checks:

- DM `@top-gun` in Slack → expect a reply (new app + scopes work)
- Open a test PR → mention `@top-gun` → review uses personalities from cloned repo
- `sudo -u top-gun /home/top-gun/.openclaw/bin/sync-owner-runes.sh` → exit 0, logs "No changes" on second run
- `ls /home/top-gun/.openclaw/repos/oc-personalities/personalities/` → all `*_PERSONALITY.md` files present
- `ls /home/top-gun/.openclaw/repos/oc-personalities/agent/` → `SOUL.md`, `IDENTITY.md`, `MEMORY.md`, `AGENTS.md`, `USER.md`, `TOOLS.md` present
- Wait one hour → `sync-owner-runes-hourly` cron tick lands cleanly in logs
- `ps -u top-gun` shows linear-mcp + github-mcp + codemagic-mcp child procs after first agent task  


## Critical files / paths

- `/usr/lib/node_modules/openclaw/` — package
- `/etc/systemd/system/top-gun-gateway.service` — unit file
- `/etc/sudoers.d/top-gun-restart` — lets the sync script restart the gateway
- `/home/top-gun/.openclaw/openclaw.json` — main config
- `/home/top-gun/.openclaw/.env` — secrets (new Slack tokens)
- `/home/top-gun/.openclaw/repos/oc-personalities/` — **cloned repo, source of all `.md` files**
- `/home/top-gun/.openclaw/owner-runes.json` — synced from the repo (chmod 400)
- `/home/top-gun/.openclaw/plugins/owner-runes/` — synced from the repo (chmod 400)
- `/home/top-gun/.openclaw/bin/sync-owner-runes.sh` — patched for top-gun paths
- `/home/top-gun/.ssh/id_ed25519` — deploy key for oc-personalities  


## Verification

End-to-end: gateway up, new Slack app handshake succeeds, `@top-gun` mention gets a reply, PR review uses personalities from  
 `repos/oc-personalities/`, sync script runs cleanly hourly. All `.md` files from 1000x are present under `repos/oc-personalities/` (refreshed  
 automatically from `main`). Disk usage at `~/.openclaw/` should sit <500 MB until session/workspace data accumulates.  

