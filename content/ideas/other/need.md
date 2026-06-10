Here's everything else you'll need lined up before you start. Roughly in order of "blocks setup if missing":

Must-have to start

1. VM access

- sudo on the new VM (you'll need it for every install/systemd step)
- Outbound internet to: api.anthropic.com, api.together.xyz, slack.com, github.com (SSH:22 and HTTPS:443), api.linear.app, api.codemagic.io, googleapis.com  


2. GitHub — beyond just "having access"

- Admin/maintainer rights on ask-myfi/oc-personalities to add the new VM's SSH deploy key (Step 5a). If you're not a maintainer, find someone who is (Kiran/Saravanan likely)
- Personal Access Token with repo scope → goes into GH_TOKEN for the github-mcp server. Generate at github.com/settings/tokens
- Optional but helpful: SSH key from your Gmail-linked GitHub account added to your local machine, so you can scp files between VMs  


3. Slack — admin on askmyfi.slack.com

- You (or someone) needs workspace admin or app-config rights to:
  - Create the new top-gun Slack app
  - Approve its OAuth scopes
  - Install it to the workspace
  - Deactivate the old im-danager app once top-gun is verified
- If you're not a Slack admin, loop in whoever is — this is a hard blocker

4. Anthropic API key

- For the primary Claude model. Either:
  - Reuse the existing 1000x key (check current VM's .env), or
  - Issue a new one from console.anthropic.com (recommended — clean separation, easier to revoke if needed)
- Check billing has credits — the "Rate limited" error we hit before was actually billing

5. Together AI API key

- For the Kimi fallback model. From together.ai → Settings → API keys
- Reuse existing or create new  


Service integrations (needed if you want full parity)

6. Linear

- Personal API key from linear.app → Settings → Account → API → Personal API keys
- Goes into both LINEAR_API_KEY and LINEAR_ACCESS_TOKEN

7. Codemagic

- API key from codemagic.io → Account settings → API tokens → CODEMAGIC_API_KEY  


8. Google Cloud (only if gcp-secret-resolver is used)

- A service-account JSON file with whatever Secret Manager / IAM perms your secrets need
- Goes at the path pointed to by GOOGLE_APPLICATION_CREDENTIALS
- Get it from console.cloud.google.com → IAM & Admin → Service accounts

Stuff you don't need yet

- A second SSH key for the VM (we'll generate one on the VM itself in Step 5a — that's a deploy key, not your personal one)
- A new Linear/Codemagic/GCP account — reuse existing org accounts
- Anything to install locally on your laptop beyond an SSH client (everything else runs on the VM)  


Quick triage

If you want the minimum to get top-gun replying in Slack and doing PR reviews: VM sudo + GitHub admin on oc-personalities + Slack admin + Anthropic key. The rest (Together/Linear/Codemagic/GCP) can be filled in after the gateway is up — features that need them will just be disabled until the env vars exist.

Want me to write a pre-flight checklist script that probes the VM for prereqs (node version, network reachability, sudo, etc.) so you can run it before kicking off Step 1?

✻ Sautéed for 29s

Going through each:

#3 Slack — careful, that's not enough  
 Making a channel and adding the bot is the last step. Before that, you still need to create the Slack app itself at api.slack.com/apps → New App → name top-gun, add scopes, install to workspace, get the tokens. Adding @top-gun to a channel only works after the app exists and is installed.

If you don't have workspace admin rights on askmyfi.slack.com, you'll be able to create the app but the install/scope approval will queue a request to a workspace admin. That admin needs to approve it before tokens become usable. Worth checking now whether you have install rights — if not, line up the admin  
 in advance.

#4 Anthropic — depends which "Claude" you mean  
 Two different products, only one matches:

- claude.ai (the chat UI) — doesn't give you what you need. Won't work for the bot.
- console.anthropic.com (the API console) — this is what you need. If the topgun Gmail has access here, you can generate an API key (sk-ant-...) and you're set.  


Quick check: log in at console.anthropic.com with the topgun gmail → if you see "API Keys" in the sidebar and can create one, you're good. Also confirm billing/credits are set up on that account (or it shares an org with one that is) — otherwise the bot will fail on first request with the misleading "Rate  
 limited" error.

#5 Together — not blocking  
 You can launch top-gun without it. The fallback chain in openclaw.json just won't have Kimi as an option — only Anthropic (primary + Opus fallback). Add it later when you receive access; openclaw reloads .env on restart.

#6–8 Other secrets — yes, copying from your current VM works
For Linear / Codemagic / GH_TOKEN / GCP service-account JSON: if they're already in env files / on disk on your existing VM and you can sudo cat them, you can copy them across. Just two things:

- Use scp over SSH (don't paste through Slack/anywhere logged) — sudo scp user@old-vm:/path/to/secret /home/top-gun/.openclaw/.env and friends
- Consider whether you want to rotate them while you're at it — fresh VM is a natural rotation point. Optional, but if any of these keys are old or have been on the existing VM during incidents, now's a good time  


TL;DR — what's blocking vs not

┌─────────────────────────────────────────────────────┬───────────────────────────────────────────┬──────────────────────────────────────┐  
 │ Item │ Status │ Blocking? │
├─────────────────────────────────────────────────────┼───────────────────────────────────────────┼──────────────────────────────────────┤  
 │ #1 VM access d │ — │ │ ✅ done │ — │ — │ │ e
├─────────────────────────────────────────────────────┼───────────────────────────────────────────┼──────────────────────────────────────┤
│ #2 GitHub d │ — │ │ ✅ done │ — │ — │ │
├─────────────────────────────────────────────────────┼───────────────────────────────────────────┼──────────────────────────────────────┤  
 │ #3 Slack app created + installed (not just channel) │ ⚠️ partial │ Yes — Step 10 needs the app + tokens │
├─────────────────────────────────────────────────────┼───────────────────────────────────────────┼──────────────────────────────────────┤  
 │ #4 Anthropic Console access on topgun gmail │ ❓ verify it's the Console, not claude.ai │ Yes — Step 7 needs the API key │  
 ├─────────────────────────────────────────────────────┼───────────────────────────────────────────┼──────────────────────────────────────┤  
 │ #5 Together API │ ⏳ waiting │ No — proceed without, add later │  
 ├─────────────────────────────────────────────────────┼───────────────────────────────────────────┼──────────────────────────────────────┤  
 │ #6–8 Other secrets via old VM │ ✅ should work via scp │ — │  
 └─────────────────────────────────────────────────────┴───────────────────────────────────────────┴──────────────────────────────────────┘

You can kick off Steps 1–4 (VM prereqs, user, install, runtime dir) right now without waiting on anything. The blockers (Slack app, Anthropic key verified) only bite at Steps 7 and 10. Want to start?

✻ Crunched for
