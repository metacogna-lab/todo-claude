# Automated Scheduling Setup Guide

## Overview

This guide covers setting up automated reviews with **retry capability** using macOS launchd and exposing webhooks via Cloudflare Tunnel.

## Two Workflows

### 1. Scheduled Reviews (launchd)
**Purpose**: Run reviews automatically at scheduled times
**Trigger**: Time-based (daily, weekly, monthly)
**Requires**: launchd configuration
**Internet**: Outbound API calls only

### 2. Webhook Server (Cloudflare Tunnel)
**Purpose**: Receive real-time events from external services
**Trigger**: Event-based (Todoist/Linear/Obsidian updates)
**Requires**: Cloudflare Tunnel
**Internet**: Inbound webhooks via HTTPS

---

## Part 1: launchd Setup (Retry-Capable Scheduling)

### Why launchd over cron?

| Feature | cron | launchd |
|---------|------|---------|
| Missed job retry | ❌ No | ✅ Yes |
| Power management | ⚠️ Poor | ✅ Excellent |
| macOS native | ⚠️ Deprecated | ✅ Recommended |
| System wake handling | ❌ No | ✅ Yes |
| Logging | Manual | Built-in |

### Quick Setup

```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear

# Run interactive setup
./scripts/setup-launchd.sh
```

This will:
1. ✅ Check for bun installation
2. ✅ Detect and offer to remove existing cron jobs
3. ✅ Install 4 launchd agents (daily, weekly, monthly, quarterly)
4. ✅ Create management scripts (status, test, uninstall)
5. ✅ Verify installation

### Schedule Details

**Daily Review**:
- **When**: Monday-Friday @ 9:00 AM
- **Agent**: `com.metacogna.claude.daily-review`
- **Command**: `bun run review:daily`
- **Log**: `/tmp/claude-daily-review.log`

**Weekly Review**:
- **When**: Friday @ 4:00 PM
- **Agent**: `com.metacogna.claude.weekly-review`
- **Command**: `bun run review:weekly`
- **Log**: `/tmp/claude-weekly-review.log`

**Monthly Product Review**:
- **When**: 1st of each month @ 10:00 AM
- **Agent**: `com.metacogna.claude.product-review`
- **Command**: `bun run review:product`
- **Log**: `/tmp/claude-product-review.log`

**Quarterly Product Review**:
- **When**: Jan/Apr/Jul/Oct 1st @ 10:00 AM
- **Agent**: `com.metacogna.claude.quarterly-review`
- **Command**: `bun run review:product:quarterly`
- **Log**: `/tmp/claude-quarterly-review.log`

### Management Commands

```bash
# Check agent status
./scripts/launchd-status.sh

# Test an agent manually
./scripts/launchd-test.sh daily
./scripts/launchd-test.sh weekly

# View real-time logs
tail -f /tmp/claude-daily-review.log
tail -f /tmp/claude-daily-review-error.log

# Uninstall all agents
./scripts/launchd-uninstall.sh
```

### Manual launchctl Commands

```bash
# List all Claude agents
launchctl list | grep com.metacogna.claude

# Start an agent manually (runs immediately)
launchctl start com.metacogna.claude.daily-review

# Stop an agent
launchctl stop com.metacogna.claude.daily-review

# Unload an agent
launchctl unload ~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist

# Reload an agent (after editing plist)
launchctl unload ~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist
launchctl load ~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist
```

### Customizing Schedule

Edit the plist files in `~/Library/LaunchAgents/`:

```xml
<!-- Change time -->
<key>StartCalendarInterval</key>
<dict>
    <key>Weekday</key>
    <integer>1</integer>  <!-- Monday -->
    <key>Hour</key>
    <integer>9</integer>  <!-- 9 AM -->
    <key>Minute</key>
    <integer>0</integer>
</dict>
```

Then reload:
```bash
launchctl unload ~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist
launchctl load ~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist
```

### Troubleshooting

**Agent not running**:
```bash
# Check if loaded
launchctl list | grep com.metacogna.claude.daily-review

# Check for errors
cat /tmp/claude-daily-review-error.log

# Verify bun path in plist
grep ProgramArguments ~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist -A 5
```

**Wrong bun path**:
```bash
# Find correct bun path
which bun

# Update all plists
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
./scripts/setup-launchd.sh  # Re-run setup
```

**Permissions issues**:
```bash
# Ensure scripts are executable
chmod +x /Users/nullzero/Metacogna/claude-obsidian-todoist-linear/scripts/*.ts
```

---

## Part 2: Cloudflare Tunnel Setup (Webhook Server)

### Prerequisites

1. **Cloudflare Account**: Free tier works
2. **Domain in Cloudflare**: Must be using Cloudflare DNS
3. **cloudflared CLI**: Install with `brew install cloudflare/cloudflare/cloudflared`

### Quick Setup

```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear

# Run interactive setup
./scripts/setup-cloudflare-tunnel.sh
```

This will:
1. ✅ Check for cloudflared installation
2. ✅ Authenticate with Cloudflare (browser login)
3. ✅ Create tunnel: `claude-hooks`
4. ✅ Configure DNS: `hooks.metacogna.ai`
5. ✅ Setup launchd service for auto-start
6. ✅ Create management scripts

### Manual Steps (if needed)

```bash
# 1. Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# 2. Authenticate
cloudflared tunnel login

# 3. Create tunnel
cloudflared tunnel create claude-hooks

# 4. Configure DNS
cloudflared tunnel route dns claude-hooks hooks.metacogna.ai

# 5. Run tunnel
cloudflared tunnel --config ~/.cloudflared/config.yml run claude-hooks
```

### Running the Webhook Server

**Option 1: Manual (Development)**
```bash
# Terminal 1: Start webhook server
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
bun run dev webhooks --port 4100

# Terminal 2: Start tunnel
./scripts/tunnel-start.sh
```

**Option 2: As a Service (Production)**
```bash
# Start tunnel service
launchctl load ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist
launchctl start com.cloudflare.cloudflared

# Start webhook server (add your own launchd plist or use docker-compose)
```

### Testing the Connection

```bash
# Check tunnel status
./scripts/tunnel-status.sh

# Test health endpoint
curl https://hooks.metacogna.ai/health

# Check tunnel logs
tail -f /tmp/cloudflared.log
```

### Configuring External Services

Once the tunnel is running, configure these webhook URLs:

**Todoist**:
1. Go to: https://developer.todoist.com/appconsole.html
2. Create webhook
3. URL: `https://hooks.metacogna.ai/webhooks/todoist`
4. Events: `item:added`, `item:updated`, `item:completed`

**Linear**:
1. Workspace Settings → Webhooks
2. Create webhook
3. URL: `https://hooks.metacogna.ai/webhooks/linear`
4. Events: Issue created, updated, completed

**Obsidian** (requires custom automation):
```bash
# Example: Trigger webhook on vault changes
fswatch ~/path/to/vault | xargs -I {} curl -X POST https://hooks.metacogna.ai/webhooks/obsidian
```

### Management Commands

```bash
# Start tunnel manually
./scripts/tunnel-start.sh

# Check status
./scripts/tunnel-status.sh

# Stop tunnel service
./scripts/tunnel-stop.sh

# View logs
tail -f /tmp/cloudflared.log
tail -f /tmp/cloudflared-error.log
```

### Troubleshooting

**Tunnel won't start**:
```bash
# Check if cloudflared is installed
which cloudflared

# Check authentication
ls -la ~/.cloudflared/cert.pem

# Re-authenticate
cloudflared tunnel login
```

**DNS not resolving**:
```bash
# Check DNS route
cloudflared tunnel route dns list | grep hooks.metacogna.ai

# Wait for DNS propagation (can take 5-10 minutes)
dig hooks.metacogna.ai

# Test with explicit DNS server
dig @1.1.1.1 hooks.metacogna.ai
```

**Connection refused**:
```bash
# Ensure webhook server is running
lsof -i :4100

# If not running, start it:
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
bun run dev webhooks --port 4100
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     SCHEDULED REVIEWS                        │
│                     (launchd agents)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Time-based triggers
                              ▼
         ┌────────────────────────────────────────┐
         │  Daily Review   (Mon-Fri 9AM)          │
         │  Weekly Review  (Fri 4PM)              │
         │  Product Review (1st of month)         │
         └────────────────────────────────────────┘
                              │
                              │ Outbound API calls
                              ▼
         ┌────────────────────────────────────────┐
         │  Todoist API  (REST v1)                │
         │  Linear API   (GraphQL)                │
         │  Obsidian     (Local filesystem)       │
         │  Claude SDK   (Anthropic API)          │
         └────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                     WEBHOOK WORKFLOW                         │
│                  (Real-time event processing)                │
└─────────────────────────────────────────────────────────────┘
                              │
     External Services        │ HTTPS webhooks
  ┌──────────────────────┐   │
  │ Todoist              │───┤
  │ Linear               │───┤
  │ Obsidian (automation)│───┘
  └──────────────────────┘   │
                              ▼
         ┌────────────────────────────────────────┐
         │  Cloudflare Tunnel                     │
         │  hooks.metacogna.ai                    │
         └────────────────────────────────────────┘
                              │
                              │ Routes to localhost
                              ▼
         ┌────────────────────────────────────────┐
         │  Webhook Server (port 4100)            │
         │  POST /webhooks/todoist                │
         │  POST /webhooks/linear                 │
         │  POST /webhooks/obsidian               │
         └────────────────────────────────────────┘
                              │
                              │ Triggers
                              ▼
         ┌────────────────────────────────────────┐
         │  Capture Workflow                      │
         │  - Process event                       │
         │  - Create tasks/issues                 │
         │  - Update Obsidian                     │
         └────────────────────────────────────────┘
```

---

## Summary

### What's Installed

**launchd Agents** (Automatic retry on wake):
- ✅ `com.metacogna.claude.daily-review`
- ✅ `com.metacogna.claude.weekly-review`
- ✅ `com.metacogna.claude.product-review`
- ✅ `com.metacogna.claude.quarterly-review`

**Cloudflare Tunnel**:
- ✅ Tunnel name: `claude-hooks`
- ✅ Hostname: `hooks.metacogna.ai`
- ✅ Local port: `4100`
- ✅ Service: Auto-start via launchd

### Quick Reference

```bash
# Setup (one-time)
./scripts/setup-launchd.sh
./scripts/setup-cloudflare-tunnel.sh

# Daily operations
./scripts/launchd-status.sh        # Check review agents
./scripts/tunnel-status.sh         # Check webhook tunnel

# Manual testing
./scripts/launchd-test.sh daily    # Test a review
./scripts/tunnel-start.sh          # Start tunnel manually

# Logs
tail -f /tmp/claude-daily-review.log
tail -f /tmp/cloudflared.log
```

### Benefits

**launchd vs cron**:
- ✅ Automatic retry when Mac wakes from sleep
- ✅ Better power management
- ✅ Native macOS integration
- ✅ Persistent across reboots

**Cloudflare Tunnel vs Port Forwarding**:
- ✅ No router configuration needed
- ✅ Free HTTPS/SSL certificates
- ✅ DDoS protection
- ✅ Easy to manage and monitor

---

**Documentation**: Complete
**Status**: Ready for deployment
**Last Updated**: 2026-02-16
