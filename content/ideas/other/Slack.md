Step 1 — Create the app

1. Go to https://api.slack.com/apps
2. Click Create New App → From scratch
3. Fill in:
   - App Name: e.g. top-gun (or whatever you're calling the new bot)
   - Pick a workspace: askmyfi (askmyfi.slack.com)

4. Click Create App

You'll land on the app's "Basic Information" page.

Step 2 — Enable Socket Mode (no public webhook needed)

1. Left sidebar → Socket Mode → toggle Enable Socket Mode ON
2. It'll prompt to generate an App-Level Token — name it something like socket-token, grant scope connections:write → Generate

xapp-1-***REDACTED*** --> SLACK_APP_TOKEN

3. Copy the token (xapp-...) and save it somewhere safe — this is your SLACK_APP_TOKEN. It's only shown once.

Step 3 — Add Bot Token Scopes

Left sidebar → OAuth & Permissions → scroll to Scopes → Bot Token Scopes → click Add an OAuth Scope for each:

Required for sending messages:

- chat:write — post in channels the bot is a member of
- chat:write.public — post in public channels without being invited (avoids the not_in_channel error that's currently breaking 1001x cron deliveries —
  see the relevant memory)

Required for receiving / responding:

- app_mentions:read — see when @bot is mentioned
- im:history — read DM history
- im:read — see DM conversations
- im:write — send DMs

Required for channel awareness:

- channels:history — read public channel history
- channels:read — list public channels
- channels:join — let the bot join channels itself
- groups:history — read private channel history
- groups:read — list private channels (avoids the channel-directory warning we see in current 1001x logs)

Required for user lookups and files:

- users:read — resolve user IDs ↔ names (needed for owner-runes hook to recognise Kiran/Kumar/Narayan/Saravanan)
- files:read — read files shared in messages
- files:write — upload files (e.g., diagrams, logs)

That's 14 scopes total. Same list applies for both top-gun and any new 1001x app.

Step 4 — Subscribe to events

Left sidebar → Event Subscriptions → toggle Enable Events ON.

Under Subscribe to bot events, add:

- app_mention — fires on @bot mentions
- message.channels — public-channel messages
- message.groups — private-channel messages
- message.im — DMs to the bot

(No request URL needed — Socket Mode handles delivery.)

Click Save Changes at the bottom.

Step 5 — Install to workspace + grab the bot token

1. Left sidebar → Install App → Install to Workspace → Allow
2. If you're not a workspace admin, this submits a request to the workspace admin and you'll have to wait for approval before the token appears.
3. Once approved, you'll see a Bot User OAuth Token (xoxb-...) — copy it. This is your SLACK_BOT_TOKEN.

xoxp-***REDACTED*** -- SLACK_BOT_TOKEN
xoxb-***REDACTED*** -- Bot User OAuth Token

xoxb-***REDACTED*** -- bot user 

Step 6 — Optional: set the bot's display name/profile

Left sidebar → App Home → under App Display Name, set:

- Display Name: e.g. top-gun
- Default username: e.g. top-gun

Also tick Always Show My Bot as Online.

Step 7 — Drop tokens into .env on the new VM

sudo -u <bot-user> tee -a /home/<bot-user>/.openclaw/.env > /dev/null <<EOF  
 SLACK_BOT_TOKEN=xoxb-...your-bot-token...  
 SLACK_APP_TOKEN=xapp-...your-app-token...  
 EOF  
 sudo chmod 600 /home/<bot-user>/.openclaw/.env

Step 8 — Invite the bot to channels

In Slack, in each channel you want it to reply in:  
 /invite @top-gun  
 For top-gun, at minimum invite it to whichever channel you create for cron deliveries (e.g., #top-gun or #reach-out-top-gun). The chat:write.public
scope means it can post to public channels without being invited, but for private channels (groups:\*) it still needs an invite.

Step 9 — Start the gateway + verify

After sudo systemctl start <bot>-gateway, check the logs:  
 sudo journalctl -u <bot>-gateway -f | grep -i slack
You're looking for [slack] socket mode connected (or similar). Then DM @top-gun — it should respond.

Common gotchas

- missing_scope error in cron logs — you forgot one of the scopes. Add it in OAuth & Permissions, then Reinstall to Workspace (button reappears at top
  of OAuth page after scope changes). New scopes don't take effect until reinstall.
- not_in_channel — you skipped chat:write.public and the bot isn't a member of the target channel. Either add the scope or /invite @bot to the  
  channel.
- is_archived — the channel ID in config points to an archived channel. Verify with slack_search_channels MCP tool or in the Slack UI.
- Token leaked into git/logs — Slack auto-rotates if it detects the token in a public repo, but rotate proactively if you suspect exposure. Settings →
  OAuth & Permissions → revoke and reinstall.

Once you have the two tokens (xoxb-... bot token + xapp-... app token), that's the Slack piece done — the new bot will pair with whatever VM/account  
 setup you've already got going.

✻ Worked for 52s
