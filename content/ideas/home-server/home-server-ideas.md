# Home Server Expansion Ideas

This is a companion to `home-server-plan.md`. The main plan gets the base server online with Tailscale, Vaultwarden, Ollama, and Open WebUI. This file is for the next layer: NAS, backups, private cloud, monitoring, automation, and useful self-hosted apps.

---

## Priority 1: NAS and File Storage

### Simple NAS with Samba

Best first step if you want a normal network drive on macOS, Windows, and Linux.

What it gives you:

- A shared folder visible from Finder on your Mac
- Easy drag-and-drop storage
- Good place for documents, exports, photos, project archives, and backups
- Works over LAN and over Tailscale

Suggested shares:

```text
/srv/storage/documents
/srv/storage/media
/srv/storage/backups
/srv/storage/projects
/srv/storage/inbox
```

Good folder pattern:

```text
storage/
  documents/
  media/
  backups/
    macbook/
    vaultwarden/
    phone/
  projects/
  inbox/
```

Use `inbox/` as a temporary drop zone. Anything that lands there gets sorted later.

### Better NAS UI with Cockpit

Cockpit gives you a browser UI for the server.

Useful for:

- Checking disk usage
- Managing services
- Looking at logs
- Seeing CPU/RAM/network stats
- Basic storage visibility

It is not a full NAS OS like TrueNAS, but it is lightweight and fits your laptop-server setup better.

### External Drive Strategy

Since the Mi Notebook has only a 512GB NVMe, treat the internal SSD as system + apps, not bulk storage.

Recommended setup:

- Internal SSD: Ubuntu, Docker apps, Ollama models, small active files
- External SSD/HDD: NAS data, media, backups, photos
- Separate backup drive: periodic offline copy of critical data

If you buy one drive first, get an external SSD or HDD dedicated to `/srv/storage`.

### Filesystem Notes

Simple path:

- Use `ext4` for the external drive
- Mount it at `/srv/storage`
- Keep backups of anything important

More advanced path:

- Use Btrfs if you want snapshots
- Use Snapper for snapshot management
- Still keep real backups, because snapshots are not backups

For a single laptop server, avoid a complicated RAID setup at the start. RAID is useful for uptime, but it does not replace backup.

---

## Priority 2: Password Storage Hardening

You already planned Vaultwarden. Since password storage is high-value, make this part boring and careful.

### Vaultwarden Checklist

- Disable public signups after creating your account
- Use a long master password that is written down offline
- Enable 2FA for your Vaultwarden account
- Store the admin token somewhere safe, not inside random notes
- Back up Vaultwarden data weekly
- Test restore at least once

### Backup Rule for Vaultwarden

Use the 3-2-1 rule:

- 3 copies of the data
- 2 different storage locations/devices
- 1 copy offline or offsite

Minimum practical setup:

- Live Vaultwarden data on the server
- Weekly encrypted backup on the NAS drive
- Monthly encrypted copy on your Mac or cloud storage

### Emergency Access Kit

Create a small offline recovery document and print it or store it on an encrypted USB.

Include:

- Vaultwarden URL
- Tailscale account email
- Server username
- Where backups live
- How to restore Vaultwarden
- Master password hint, not the password itself unless you store it physically in a safe place

---

## Private Cloud Ideas

### Nextcloud

Use if you want a Google Drive/iCloud-like experience.

Good for:

- File sync
- Calendar and contacts
- Notes
- WebDAV
- Sharing files between devices

Tradeoff:

- Heavier than Samba
- Needs more maintenance
- Can feel slow on low-power hardware if overloaded

Recommendation: start with Samba first. Add Nextcloud only if you really want sync and web UI features.

### Syncthing

Use this for simple device-to-device sync.

Good for:

- Syncing Obsidian vaults
- Syncing project folders
- Syncing phone camera folders
- Keeping selected folders mirrored between Mac and server

Why it fits:

- No central cloud account needed
- Works well over Tailscale
- Lighter than Nextcloud

---

## Media and Personal Archive

### Jellyfin

Self-hosted media server for movies, shows, music, and recorded videos.

Good for:

- Streaming your media library
- Watching from TV/mobile/laptop
- Keeping media local

Laptop note:

- CPU transcoding may be slow
- Prefer media formats your devices can direct-play

### Audiobookshelf

Great if you collect audiobooks, podcasts, lectures, or long-form audio.

Good for:

- Audiobooks
- Podcast backups
- Course audio
- Listening progress sync

### Paperless-ngx

One of the most useful home-server apps.

Good for:

- Scanning documents
- OCR/search over PDFs
- Invoices, receipts, certificates, bank docs
- Tagging and archiving important paperwork

This pairs very well with a NAS. Drop scanned PDFs into an import folder and let Paperless process them.

---

## Photos and Phone Backups

### Immich

Google Photos-like self-hosted photo backup.

Good for:

- Phone photo backup
- Timeline view
- Albums
- Face/object search

Tradeoff:

- More resource-heavy than simple file sync
- Needs reliable backups, because photos are high-value

### Low-Maintenance Alternative

Use Syncthing or SMB to copy phone photos into:

```text
/srv/storage/media/photos/phone/YYYY/MM
```

Then periodically back up that folder elsewhere.

---

## Developer and AI Workflow

### Private Git Server

Options:

- Gitea: lightweight GitHub-like server
- Forgejo: community fork of Gitea

Good for:

- Private repos
- Homelab config versioning
- Git mirrors
- Experiment projects

### Code Search

Run a local code search tool for your notes and projects.

Ideas:

- Sourcegraph if you want a full system
- Simple `ripgrep` over mounted folders if you want lightweight search

### AI Knowledge Base

You already planned Open WebUI and RAG. Extend it with folders like:

```text
/srv/storage/knowledge/resume
/srv/storage/knowledge/fintech
/srv/storage/knowledge/papers
/srv/storage/knowledge/docs
```

Then use Open WebUI document upload, AnythingLLM, or a custom RAG pipeline to query your own material.

### Local API Gateway for LLMs

LiteLLM can expose an OpenAI-compatible API backed by Ollama.

Good for:

- Local agent experiments
- LangChain/LangGraph projects
- Apps that expect OpenAI-style endpoints
- Testing prompts privately before using paid APIs

---

## Automation Ideas

### n8n

Personal automation dashboard.

Useful workflows:

- Weekly personal report from notes/files
- Daily digest of RSS feeds
- Backup completion alerts
- GitHub/Linear/Slack experiments
- Expense CSV cleanup
- Reminder when disk usage crosses 80%

### Home Assistant

Only add this if you have smart devices or want sensors.

Good for:

- Smart lights
- Power monitoring
- Temperature sensors
- Presence detection
- Automations around charging, power, and alerts

### Uptime Kuma

Simple status page for your own services.

Monitor:

- Vaultwarden
- Open WebUI
- Samba
- Tailscale reachability
- Disk space via push scripts
- Backup job success

---

## Network and Access

### Tailscale Naming

Use stable names for services:

```text
homelab
vault
nas
ai
photos
docs
```

You can keep everything private to the tailnet and avoid exposing ports to the internet.

### Reverse Proxy

Later, add Caddy or Traefik if you want clean local URLs.

Example:

```text
https://vault.homelab.ts.net
https://ai.homelab.ts.net
https://photos.homelab.ts.net
```

Keep it simple at first. Tailscale Serve is enough for Vaultwarden.

---

## Security Ideas

### Separate Admin and Daily Users

Create:

- One admin Linux user with sudo
- One regular user for day-to-day file access
- Service accounts only when needed

### Firewall Policy

Good default:

- Allow SSH only over LAN/Tailscale
- Allow app ports only on Tailscale where possible
- Avoid router port forwarding

### Secrets Handling

Use a `.env` file for Docker Compose secrets, and keep it out of Git.

Example:

```text
stack/
  docker-compose.yml
  .env
```

Store important secrets in Vaultwarden after Vaultwarden is running.

---

## Backup and Disaster Recovery Projects

### Restic Backups

Restic is a strong backup tool with encryption, deduplication, and snapshots.

Good backup targets:

- External USB drive
- Your Mac over SSH
- Backblaze B2
- S3-compatible storage

Back up:

- `~/stack`
- `/srv/storage/documents`
- `/srv/storage/projects`
- Vaultwarden data
- Paperless data
- Important config files

### Backup Dashboard

Make a simple markdown or web dashboard:

```text
Last Vaultwarden backup: OK
Last NAS backup: OK
Disk usage: 62%
Server temp: 54 C
Containers running: 8/8
```

This can start as a cron job that writes a text file.

---

## Suggested Roadmap

### Weekend 1: Core Server

- Ubuntu Server
- Tailscale
- Docker
- Vaultwarden
- Open WebUI/Ollama

### Weekend 2: NAS

- External drive
- `/srv/storage`
- Samba share
- Basic user permissions
- Mac Finder access
- First manual backup

### Weekend 3: Backups and Monitoring

- Restic or tar backups
- Uptime Kuma
- Disk usage alerts
- Vaultwarden restore test

### Weekend 4: Personal Cloud

Pick one:

- Syncthing for folder sync
- Paperless-ngx for documents
- Immich for photos
- Jellyfin for media

### Weekend 5: AI and Automation

- LiteLLM
- n8n
- RAG knowledge folders
- Personal dashboards

---

## Best First Additions

If you want the highest value without turning the server into a maintenance burden, do these in order:

1. Samba NAS share
2. Vaultwarden backup and restore test
3. Uptime Kuma
4. Syncthing
5. Paperless-ngx
6. Restic encrypted backups
7. Immich or Jellyfin, depending on whether photos or media matter more
8. n8n automation
9. LiteLLM API proxy
10. Gitea/Forgejo private Git

