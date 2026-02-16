# Installation Guide - Automated Reviews & Webhooks

## ✅ Implementation Complete

Both launchd scheduling and Cloudflare tunnel infrastructure have been implemented and are ready for installation.

---

## Part 1: Install launchd Agents (Retry-Capable Scheduling)

### What You Get

- ✅ **Automatic retries** when your Mac wakes from sleep
- ✅ **4 scheduled reviews**: Daily, Weekly, Monthly, Quarterly
- ✅ **Better than cron**: Native macOS integration with power management
- ✅ **Management tools**: Status, testing, and uninstall scripts

### Installation

```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear

# Run interactive setup
./scripts/setup-launchd.sh
```

**The script will**:
1. Check for bun installation
2. Detect existing cron jobs and offer to migrate
3. Install 4 launchd agents
4. Create management scripts
5. Verify installation

**Answer prompts**:
- Replace existing cron jobs? → `y` (if you have any)
- Add weekly log rotation? → `y` (recommended)

### Verify Installation

```bash
# Check agent status
./scripts/launchd-status.sh

# Test daily review manually
./scripts/launchd-test.sh daily

# View what will run
launchctl list | grep com.metacogna.claude
```

### Schedule Reference

| Review | When | Agent Name |
|--------|------|------------|
| Daily | Mon-Fri 9:00 AM | `com.metacogna.claude.daily-review` |
| Weekly | Friday 4:00 PM | `com.metacogna.claude.weekly-review` |
| Monthly | 1st @ 10:00 AM | `com.metacogna.claude.product-review` |
| Quarterly | Jan/Apr/Jul/Oct 1st @ 10:00 AM | `com.metacogna.claude.quarterly-review` |

---

## Part 2: Setup Cloudflare Tunnel (Webhook Server)

### What You Get

- ✅ **Real-time webhooks** from Todoist, Linear, Obsidian
- ✅ **Free HTTPS** via Cloudflare
- ✅ **No port forwarding** or router configuration
- ✅ **Auto-start service** via launchd

### Prerequisites

1. **Cloudflare account** (free tier works)
2. **Domain in Cloudflare** using Cloudflare DNS
3. **Install cloudflared**:

```bash
brew install cloudflare/cloudflare/cloudflared
```

### Installation

```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear

# Run interactive setup
./scripts/setup-cloudflare-tunnel.sh
```

**The script will**:
1. Check for cloudflared installation
2. Open browser for Cloudflare authentication
3. Create tunnel named `claude-hooks`
4. Configure DNS: `hooks.metacogna.ai`
5. Setup auto-start service
6. Create management scripts

**Follow prompts**:
- Authenticate with Cloudflare? → `y`
- Delete existing tunnel? → `n` (on first run)

### Start the Services

**Option 1: Manual (for testing)**
```bash
# Terminal 1: Start webhook server
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
bun run dev webhooks --port 4100

# Terminal 2: Start tunnel
./scripts/tunnel-start.sh
```

**Option 2: Auto-start (for production)**
```bash
# Load and start tunnel service
launchctl load ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist
launchctl start com.cloudflare.cloudflared

# Webhook server needs separate service or use docker-compose
```

### Test the Connection

```bash
# Check tunnel status
./scripts/tunnel-status.sh

# Test health endpoint (after services are running)
curl https://hooks.metacogna.ai/health

# Should return: {"status":"ok"}
```

---

## Part 3: Configure External Services

### Todoist Webhooks

1. Visit: https://developer.todoist.com/appconsole.html
2. Select your app or create one
3. Go to "Webhooks" section
4. Add webhook:
   - **URL**: `https://hooks.metacogna.ai/webhooks/todoist`
   - **Events**: Select:
     - `item:added`
     - `item:updated`
     - `item:completed`
     - `item:deleted`
5. Save

### Linear Webhooks

1. Open Linear workspace settings
2. Go to "API" → "Webhooks"
3. Create webhook:
   - **URL**: `https://hooks.metacogna.ai/webhooks/linear`
   - **Events**: Select:
     - Issue created
     - Issue updated
     - Issue status changed
     - Issue completed
4. Save

### Obsidian Automation (Optional)

**Using fswatch** (monitors vault changes):
```bash
# Install fswatch
brew install fswatch

# Create watcher script
cat > ~/watch-obsidian.sh <<'EOF'
#!/bin/bash
VAULT_PATH="/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary"

fswatch -0 "$VAULT_PATH" | while read -d "" event; do
    echo "Vault change detected: $event"
    curl -X POST https://hooks.metacogna.ai/webhooks/obsidian \
        -H "Content-Type: application/json" \
        -d "{\"event\":\"file_changed\",\"path\":\"$event\"}"
done
EOF

chmod +x ~/watch-obsidian.sh

# Run in background
nohup ~/watch-obsidian.sh > /tmp/obsidian-watcher.log 2>&1 &
```

---

## Monitoring & Maintenance

### Check Status

```bash
# Review agents
./scripts/launchd-status.sh

# Cloudflare tunnel
./scripts/tunnel-status.sh
```

### View Logs

```bash
# Review logs
tail -f /tmp/claude-daily-review.log
tail -f /tmp/claude-weekly-review.log
tail -f /tmp/claude-product-review.log

# Tunnel logs
tail -f /tmp/cloudflared.log

# Errors
tail -f /tmp/claude-daily-review-error.log
tail -f /tmp/cloudflared-error.log
```

### Manual Testing

```bash
# Test a review manually
./scripts/launchd-test.sh daily
./scripts/launchd-test.sh weekly

# Test webhook endpoint
curl -X POST https://hooks.metacogna.ai/webhooks/todoist \
    -H "Content-Type: application/json" \
    -d '{"event_name":"item:added","event_data":{}}'
```

---

## Troubleshooting

### launchd Issues

**Agent not running**:
```bash
# Check if loaded
launchctl list | grep com.metacogna.claude.daily-review

# View errors
cat /tmp/claude-daily-review-error.log

# Reload agent
launchctl unload ~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist
launchctl load ~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist
```

**Wrong bun path**:
```bash
# Check current path in plist
grep ProgramArguments ~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist -A 5

# Re-run setup to update
./scripts/setup-launchd.sh
```

### Tunnel Issues

**Tunnel won't start**:
```bash
# Check installation
which cloudflared

# Check authentication
ls -la ~/.cloudflared/cert.pem

# Re-authenticate
cloudflared tunnel login
```

**DNS not resolving**:
```bash
# Check route
cloudflared tunnel route dns list | grep hooks.metacogna.ai

# Test DNS (may take 5-10 min to propagate)
dig hooks.metacogna.ai
```

**Connection refused**:
```bash
# Check if webhook server is running
lsof -i :4100

# Start webhook server
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
bun run dev webhooks --port 4100
```

---

## Uninstallation

### Remove launchd Agents

```bash
./scripts/launchd-uninstall.sh
```

### Remove Cloudflare Tunnel

```bash
# Stop service
./scripts/tunnel-stop.sh

# Delete tunnel
cloudflared tunnel delete claude-hooks

# Remove DNS route
cloudflared tunnel route dns delete hooks.metacogna.ai

# Remove service
rm ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist
launchctl remove com.cloudflare.cloudflared
```

---

## Architecture Summary

```
┌──────────────────────────────────────────────────────────┐
│                  SCHEDULED REVIEWS                        │
│                  (Works immediately)                      │
└──────────────────────────────────────────────────────────┘
                          │
    launchd agents        │ Time-based triggers
         ↓                │
  Daily (Mon-Fri 9AM)     │ Outbound API calls only
  Weekly (Fri 4PM)        │ No tunnel needed
  Monthly (1st 10AM)      │
  Quarterly (1,4,7,10)    │
                          ↓
              Todoist + Linear + Obsidian


┌──────────────────────────────────────────────────────────┐
│                  WEBHOOK WORKFLOW                         │
│               (Requires tunnel setup)                     │
└──────────────────────────────────────────────────────────┘
                          │
  External Services       │ HTTPS webhooks
      ↓                   │
  Todoist                 │
  Linear                  │ Inbound via tunnel
  Obsidian                │
      ↓                   │
  Cloudflare Tunnel       │
  (hooks.metacogna.ai)    │
      ↓                   │
  Webhook Server          │
  (localhost:4100)        │
```

---

## Quick Reference

```bash
# One-time setup
./scripts/setup-launchd.sh
./scripts/setup-cloudflare-tunnel.sh

# Daily operations
./scripts/launchd-status.sh
./scripts/tunnel-status.sh

# Manual testing
./scripts/launchd-test.sh daily
curl https://hooks.metacogna.ai/health

# Logs
tail -f /tmp/claude-daily-review.log
tail -f /tmp/cloudflared.log
```

---

## Next Steps

1. ✅ **Install launchd agents**: `./scripts/setup-launchd.sh`
2. ✅ **Setup Cloudflare tunnel**: `./scripts/setup-cloudflare-tunnel.sh`
3. ✅ **Configure webhooks**: Add URLs to Todoist/Linear
4. ✅ **Monitor first run**: Check logs after scheduled time
5. ✅ **Test webhook**: Send test event from external service

---

**Status**: Ready for deployment
**Documentation**: [[SCHEDULING_SETUP]] for detailed guide
**Last Updated**: 2026-02-16
