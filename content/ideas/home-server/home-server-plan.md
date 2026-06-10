# Home AI Server Setup Plan

**Hardware:** Mi Notebook Pro 14 — i5-11300H, 16GB DDR4, 512GB NVMe SSD
**Goal:** Self-hosted Vaultwarden + Ollama (local LLMs) accessed from a Mac via Tailscale
**Estimated time:** ~5 hours of active work, spread across a weekend

---

## What you're building

```
Your Mac ──────► Tailscale VPN ──────► Mi Notebook (Ubuntu Server)
                                       │
                                       ├─ Ollama (host) ────► LLM models
                                       │
                                       └─ Docker
                                          ├─ Vaultwarden ──► Password manager
                                          └─ Open WebUI ──► Chat interface for Ollama
```

**Key decisions baked in:**

- Ubuntu Server 24.04 LTS (no GUI, saves RAM)
- Ollama installed on host (better perf than containerized)
- Vaultwarden + Open WebUI in Docker
- Tailscale for secure remote access (no port forwarding, no exposed IPs)
- Tailscale Serve for HTTPS (free `*.ts.net` URL, works with Bitwarden apps)

---

## Pre-flight checklist

Before you start, gather:

- [ ] The Mi Notebook with charger
- [ ] An 8GB+ USB drive (will be wiped)
- [ ] Ethernet (optional but recommended for stability)
- [ ] Your Mac (for downloading Ubuntu, making the USB, and running everything afterward)
- [ ] A Tailscale account (free — sign up at tailscale.com, use Google/GitHub login)
- [ ] Router admin access (to set a DHCP reservation later)
- [ ] **Backup anything important from the Windows install** — the disk gets wiped

---

# Phase 1: Install Ubuntu Server (~1 hour)

## Step 1.1: Download Ubuntu Server 24.04 LTS

On your Mac:

```bash
# Download the ISO (~3GB)
# Go to: https://ubuntu.com/download/server
# Pick "Ubuntu Server 24.04 LTS"
```

## Step 1.2: Make a bootable USB

Install balenaEtcher on your Mac (easier than `dd`):

```bash
brew install --cask balenaetcher
```

Open balenaEtcher → Select the Ubuntu ISO → Select your USB → Flash.

## Step 1.3: Boot the Mi Notebook from USB

1. Plug USB into the laptop
2. Power on, repeatedly press **F2** or **F12** (Mi laptops vary — try both)
3. Select the USB drive from the boot menu
4. If you don't see UEFI boot options, go into BIOS and:
   - Disable Secure Boot (sometimes required for Ubuntu)
   - Set USB as first boot device

## Step 1.4: Install Ubuntu

Walk through the installer:

| Screen            | What to choose                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Language          | English                                                                                              |
| Keyboard          | English (US) or whatever matches yours                                                               |
| Installation type | **Ubuntu Server** (NOT minimized)                                                                    |
| Network           | Connect to WiFi or use Ethernet (Ethernet preferred)                                                 |
| Proxy             | Leave blank                                                                                          |
| Mirror            | Use default                                                                                          |
| Storage           | **Use entire disk** — this wipes Windows                                                             |
| Profile           | Name: your name, Server name: `homelab` (or whatever), Username: `arjun` (or yours), strong password |
| SSH               | **Install OpenSSH server — YES** (critical, don't skip)                                              |
| Featured snaps    | Skip everything                                                                                      |

Let it install (~15-20 min). Reboot when prompted, remove the USB.

## Step 1.5: First login + basic security

Log in directly on the laptop with your username/password. Then:

```bash
# Update everything
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl git ufw fail2ban htop btop thermald tlp net-tools

# Enable thermal + power management (critical for a laptop running 24/7)
sudo systemctl enable --now thermald tlp

# Set up firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw enable

# Get your IP — note this down
ip addr show | grep inet
```

## Step 1.6: Disable sleep when lid closes

Critical — otherwise your "server" naps every time you close the laptop.

```bash
sudo nano /etc/systemd/logind.conf
```

Find and uncomment/change these lines:

```
HandleLidSwitch=ignore
HandleLidSwitchExternalPower=ignore
HandleLidSwitchDocked=ignore
```

Save (Ctrl+O, Enter, Ctrl+X), then:

```bash
sudo systemctl restart systemd-logind
```

## Step 1.7: Add a swap file (safety net)

```bash
sudo fallocate -l 16G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

## Step 1.8: Set a DHCP reservation on your router

1. Note the laptop's MAC address: `ip link show | grep ether`
2. Log into your router (usually `192.168.1.1` or `192.168.0.1`)
3. Find DHCP settings → Address Reservation
4. Reserve a static IP for the laptop's MAC (e.g., `192.168.1.50`)
5. Reboot the laptop, verify it gets that IP

---

# Phase 2: Tailscale (~15 minutes)

Once Tailscale is running, you'll never need to physically touch the laptop again.

## Step 2.1: Install Tailscale on the laptop

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Click the auth URL it prints, log into Tailscale in your browser, authorize the device.

```bash
# Check your Tailscale hostname/IP
tailscale ip -4
tailscale status
```

Note the hostname (something like `homelab.<your-tailnet>.ts.net`).

## Step 2.2: Install Tailscale on your Mac

```bash
brew install --cask tailscale
```

Open the Tailscale app, sign in with the same account. You'll see your laptop in the device list.

## Step 2.3: Test SSH from Mac

```bash
ssh arjun@homelab   # use your actual username and hostname
# or
ssh arjun@<tailscale-ip>
```

**Should work from anywhere — coffee shop, office, anywhere your Mac has internet.**

## Step 2.4: Optional but recommended — SSH keys

From your Mac:

```bash
ssh-copy-id arjun@homelab
```

Then disable password SSH on the laptop:

```bash
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart ssh
```

**Milestone:** You can now close the lid, move the laptop to a ventilated corner, and do everything else from your Mac via SSH.

---

# Phase 3: Docker + Vaultwarden (~45 minutes)

SSH in from your Mac for the rest of this guide.

## Step 3.1: Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Log out and back in for group change
exit
# SSH back in
```

Verify:

```bash
docker run hello-world
```

## Step 3.2: Set up directory structure

```bash
mkdir -p ~/stack/vaultwarden ~/stack/openwebui
cd ~/stack
```

## Step 3.3: Generate Vaultwarden admin token

```bash
openssl rand -base64 48
```

Copy the output — you'll paste it into the compose file next.

## Step 3.4: Create the compose file

```bash
nano ~/stack/docker-compose.yml
```

Paste this, **replacing the two placeholders**:

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    restart: unless-stopped
    environment:
      - DOMAIN=https://homelab.YOUR-TAILNET.ts.net
      - SIGNUPS_ALLOWED=true
      - ADMIN_TOKEN=PASTE_YOUR_GENERATED_TOKEN_HERE
      - WEBSOCKET_ENABLED=true
    volumes:
      - ./vaultwarden:/data
    ports:
      - "8080:80"

  openwebui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: openwebui
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
      - WEBUI_AUTH=true
    volumes:
      - ./openwebui:/app/backend/data
    ports:
      - "3000:8080"
```

To find your Tailnet name: run `tailscale status` — top line shows it, or check the Tailscale admin console.

## Step 3.5: Start the stack

```bash
cd ~/stack
docker compose up -d

# Verify both are running
docker ps
```

## Step 3.6: Expose Vaultwarden over HTTPS via Tailscale Serve

This is the magic that makes Bitwarden apps work (they require HTTPS):

```bash
sudo tailscale serve --bg --https=443 http://localhost:8080
sudo tailscale serve status
```

Now `https://homelab.YOUR-TAILNET.ts.net` serves Vaultwarden with a valid TLS cert.

## Step 3.7: Create your Bitwarden account

1. From your Mac browser, go to `https://homelab.YOUR-TAILNET.ts.net`
2. Click "Create Account"
3. Use a strong master password — **write it down somewhere physical**, you cannot recover it
4. Log in

## Step 3.8: Lock down signups

Once your account is created:

```bash
nano ~/stack/docker-compose.yml
# Change: SIGNUPS_ALLOWED=true → SIGNUPS_ALLOWED=false
docker compose up -d  # recreates with new env
```

## Step 3.9: Set up Bitwarden clients

**On your Mac:**

```bash
brew install --cask bitwarden
```

Open Bitwarden → before logging in, click the **gear icon** → Server URL: `https://homelab.YOUR-TAILNET.ts.net` → Save → log in.

**On your phone:**
Install Bitwarden app → on login screen, tap region selector → Self-hosted → enter the same URL.

**Browser extensions:**
Install the Bitwarden extension on Chrome/Safari/Firefox → settings → server URL same as above.

**Import passwords** from wherever you have them now (browser, 1Password, LastPass export, etc.) via Tools → Import.

**Milestone:** You now have a fully self-hosted password manager.

---

# Phase 4: Ollama + Models (~45 minutes)

## Step 4.1: Install Ollama on the laptop

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## Step 4.2: Make Ollama listen on all interfaces

So Docker (Open WebUI) and your Mac can both reach it:

```bash
sudo systemctl edit ollama.service
```

This opens an empty override file. Add:

```
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_KEEP_ALIVE=5m"
```

Save and exit. Then:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

## Step 4.3: Allow Ollama port through firewall (Tailscale only)

```bash
# Only allow from Tailscale interface, not the public internet
sudo ufw allow in on tailscale0 to any port 11434
```

## Step 4.4: Pull your starter models

```bash
# Daily drivers
ollama pull llama3.2:3b              # ~2GB, fast, great for quick tasks
ollama pull qwen2.5:7b-instruct      # ~4.7GB, main chat model
ollama pull qwen2.5-coder:7b         # ~4.7GB, coding tasks

# For RAG / embeddings (small, always keep these)
ollama pull nomic-embed-text         # ~280MB

# Optional: heavier model for harder problems
ollama pull qwen2.5:14b              # ~9GB, slower but smarter
```

Test it:

```bash
ollama run llama3.2:3b "Write a haiku about home servers"
```

## Step 4.5: Connect Open WebUI

1. From your Mac browser: `http://homelab:3000` (Tailscale resolves the hostname)
2. Click "Sign up" — the first account is admin
3. After login, go to **Settings → Connections** — Ollama should already be detected
4. Go to chat, model dropdown at top — pick `qwen2.5:7b-instruct`, send a message

## Step 4.6: Use Ollama from your Mac directly

```bash
brew install ollama  # CLI only, don't start the service
```

Add to your `~/.zshrc` (or `~/.bashrc`):

```bash
export OLLAMA_HOST=http://homelab:11434
```

Reload:

```bash
source ~/.zshrc
```

Now from your Mac:

```bash
ollama list                          # shows models on the server
ollama run qwen2.5-coder:7b          # chat with server's model
```

Any Mac tool that uses Ollama (Zed editor, VS Code Continue extension, Raycast AI extensions, Obsidian plugins) will now hit your server.

**Milestone:** You have local LLMs accessible from your Mac via a private VPN, with a web UI.

---

# Phase 5: Optional add-ons

Pick any of these once the core stack is solid. Each goes into the same `docker-compose.yml` as a new service.

## 5.1 LiteLLM proxy (OpenAI-compatible API for Ollama)

Useful because most LLM tooling (LangChain, agent frameworks, etc.) expects OpenAI's API format. LiteLLM wraps Ollama to make it look like OpenAI.

Add to `docker-compose.yml`:

```yaml
litellm:
  image: ghcr.io/berriai/litellm:main-latest
  container_name: litellm
  restart: unless-stopped
  extra_hosts:
    - "host.docker.internal:host-gateway"
  ports:
    - "4000:4000"
  command: --model ollama/qwen2.5:7b-instruct --api_base http://host.docker.internal:11434
```

## 5.2 Document RAG (built into Open WebUI)

No new container needed. In Open WebUI:

1. Settings → Documents → set embedding model to `nomic-embed-text`
2. In any chat, click the `+` → Upload PDF/markdown/text
3. Ask questions about the document

For a more serious RAG setup, look at **AnythingLLM** or **LlamaIndex** later.

## 5.3 n8n (automation workflows)

```yaml
n8n:
  image: n8nio/n8n
  container_name: n8n
  restart: unless-stopped
  environment:
    - N8N_HOST=homelab
    - N8N_PORT=5678
    - GENERIC_TIMEZONE=Asia/Kolkata
  volumes:
    - ./n8n:/home/node/.n8n
  ports:
    - "5678:5678"
```

Great for: daily news digests via local LLM, monitoring fintech APIs, automating personal stuff.

## 5.4 Langfuse (LLM observability)

Production-grade LLM tracing. Worth doing because this skill transfers directly to fintech work. Run their docker-compose from github.com/langfuse/langfuse — it needs Postgres so it's a multi-container setup.

## 5.5 Immich (Google Photos replacement)

If you want to reclaim photo storage costs. See immich.app for docker-compose.

---

# Phase 6: Ongoing maintenance

## Updates

Weekly or so:

```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Docker container updates
cd ~/stack
docker compose pull
docker compose up -d

# Ollama updates
curl -fsSL https://ollama.com/install.sh | sh
```

## Backups

**Vaultwarden data** — most critical. Set up a weekly backup:

```bash
mkdir -p ~/backups
cat > ~/backup-vaultwarden.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
docker compose -f ~/stack/docker-compose.yml stop vaultwarden
tar czf ~/backups/vaultwarden-$DATE.tar.gz -C ~/stack vaultwarden
docker compose -f ~/stack/docker-compose.yml start vaultwarden
# Keep last 4 backups
ls -1t ~/backups/vaultwarden-*.tar.gz | tail -n +5 | xargs -r rm
EOF
chmod +x ~/backup-vaultwarden.sh

# Add to crontab — runs every Sunday at 3am
(crontab -l 2>/dev/null; echo "0 3 * * 0 ~/backup-vaultwarden.sh") | crontab -
```

For real safety, periodically copy `~/backups/` to your Mac or cloud storage.

## Monitoring

Quick checks via SSH:

```bash
btop                    # live system stats
docker ps               # which containers are running
docker logs vaultwarden # see container logs
journalctl -u ollama -f # ollama logs
df -h                   # disk usage (watch for model bloat)
```

## Thermal sanity check

After running for a few days under real use:

```bash
sensors  # may need: sudo apt install lm-sensors && sudo sensors-detect
```

If you see sustained temps above 85°C, prop the laptop up better or add a small USB fan underneath.

---

# Troubleshooting

| Problem                              | Fix                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Can't SSH after closing lid          | Lid suspend config (Step 1.6) wasn't applied — boot directly and rerun                                                 |
| Bitwarden mobile app won't connect   | Make sure Tailscale is on the phone and you're using the `https://` URL                                                |
| Ollama "connection refused" from Mac | `OLLAMA_HOST` env var not set, or Ollama isn't listening on `0.0.0.0` (Step 4.2)                                       |
| Open WebUI shows no models           | Restart container: `docker compose restart openwebui`                                                                  |
| 14B model is super slow              | Expected on CPU — stick to 7B for interactive use                                                                      |
| Laptop running hot                   | Prop up for airflow, set CPU governor to powersave when not actively using: `sudo cpupower frequency-set -g powersave` |
| Vaultwarden won't load over HTTPS    | `sudo tailscale serve status` — make sure it's still running; re-run Step 3.6                                          |

---

# Summary timeline

| Day                | Time                    | What you'll have                                     |
| ------------------ | ----------------------- | ---------------------------------------------------- |
| Sat morning (2h)   | Phases 1 + 2            | Ubuntu server reachable over Tailscale from Mac      |
| Sat afternoon (1h) | Phase 3                 | Self-hosted Bitwarden working on all your devices    |
| Sun morning (1.5h) | Phase 4                 | Local LLMs running, accessible from Mac CLI + web UI |
| Sun afternoon      | Phase 5 (pick & choose) | Whatever bonus stack you want                        |

After this you have:

- A real Linux server you control
- Free unlimited password management
- Local LLMs (no API costs, full privacy)
- Skills directly relevant to fintech AI work (Docker, observability, RAG, model serving)
- Foundation to add anything else later (Immich, Jellyfin, k8s, etc.)
