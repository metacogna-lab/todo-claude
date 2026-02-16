# Deployment Checklist

Complete setup and testing guide for Claude Review System.

---

## ✅ Phase 1: launchd Agents (COMPLETE)

- [x] Created 4 launchd plist files
- [x] Installed agents to ~/Library/LaunchAgents/
- [x] Verified agents are loaded
- [x] Added review scripts to package.json
- [x] Tested daily review retrieves context (17 tasks, 50 issues)

**Status**: ✅ Agents installed and running

**Next**: Reviews will run automatically at scheduled times

---

## 📋 Phase 2: Cloudflare Tunnel (READY TO CONFIGURE)

### Prerequisites ✅

- [x] cloudflared installed (`/opt/homebrew/bin/cloudflared`)
- [x] Tunnel configuration created
- [x] Setup script ready
- [ ] Cloudflare account logged in
- [ ] Domain (`metacogna.ai`) in Cloudflare

### Steps to Complete:

```bash
# 1. Run setup script
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
./scripts/setup-cloudflare-tunnel.sh

# Follow prompts:
# - Authenticate with Cloudflare (browser opens)
# - Confirm tunnel creation
# - DNS route configuration

# 2. Start services
# Terminal 1:
bun run dev webhooks --port 4100

# Terminal 2:
./scripts/tunnel-start.sh

# 3. Test connection
curl https://hooks.metacogna.ai/health
```

**Reference**: See [[CLOUDFLARE_SETUP_STEPS.md]]

---

## 🔗 Phase 3: Webhook Configuration (READY TO CONFIGURE)

### Todoist Webhook

**URL**: `https://hooks.metacogna.ai/webhooks/todoist`

**Steps**:
1. Go to https://developer.todoist.com/appconsole.html
2. Select/create app
3. Add webhook with URL above
4. Select events: item:added, item:updated, item:completed
5. Save and verify "Active" status

**Reference**: See [[WEBHOOK_CONFIGURATION.md]] Section 1

---

### Linear Webhook

**URL**: `https://hooks.metacogna.ai/webhooks/linear`

**Steps**:
1. Go to https://linear.app/[workspace]/settings
2. Navigate to API → Webhooks
3. Create webhook with URL above
4. Select events: Issue created, updated, deleted
5. Copy webhook secret to `.env`

**Reference**: See [[WEBHOOK_CONFIGURATION.md]] Section 2

---

## 🧪 Phase 4: Testing & Verification

### Test Scheduled Reviews

```bash
# Test daily review manually
./scripts/launchd-test.sh daily

# Check logs
tail -f /tmp/claude-daily-review.log

# Verify context retrieval
# Should show: 17 Todoist tasks, 50 Linear issues
```

**Expected**: ✅ Context retrieved successfully

---

### Test Webhook Server

```bash
# 1. Start webhook server
bun run dev webhooks --port 4100

# 2. Test health endpoint
curl https://hooks.metacogna.ai/health
# Expected: {"status":"ok"}

# 3. Send test webhook
curl -X POST https://hooks.metacogna.ai/webhooks/todoist \
  -H "Content-Type: application/json" \
  -d '{"event_name":"test","event_data":{}}'

# 4. Check logs
tail -f /tmp/claude-webhook-server.log
```

**Expected**: ✅ Webhook received and logged

---

### Test External Service Integration

**Todoist**:
```bash
# Create a task via API
curl -X POST https://api.todoist.com/rest/v2/tasks \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test webhook - please delete"}'

# Check webhook received
tail -20 /tmp/claude-webhook-server.log | grep todoist
```

**Linear**:
```bash
# Create an issue
# (Go to Linear UI and create a test issue)

# Check webhook received
tail -20 /tmp/claude-webhook-server.log | grep linear
```

**Expected**: ✅ Webhooks received from both services

---

## 📊 Monitoring Setup

### Daily Checks

```bash
# Check review agent status
./scripts/launchd-status.sh

# Check tunnel status
./scripts/tunnel-status.sh

# View today's logs
tail -f /tmp/claude-daily-review.log
```

### Weekly Checks

```bash
# Check for failed reviews
grep ERROR /tmp/claude-*-review.log

# Check webhook delivery
tail -100 /tmp/claude-webhook-server.log | grep -c "200"

# Verify disk space
du -sh /tmp/claude-*.log
```

---

## 🚨 Troubleshooting Quick Reference

### launchd Issues

**Agent not running**:
```bash
launchctl list | grep com.metacogna.claude.daily-review
# If not listed, reload:
launchctl load ~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist
```

**Review fails**:
```bash
# Check error log
cat /tmp/claude-daily-review-error.log

# Test manually
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
bun run review:daily
```

---

### Tunnel Issues

**Connection refused**:
```bash
# Check if tunnel is running
./scripts/tunnel-status.sh

# Restart tunnel
./scripts/tunnel-stop.sh
./scripts/tunnel-start.sh
```

**DNS not resolving**:
```bash
# Check DNS
dig hooks.metacogna.ai

# May take 5-10 minutes after setup
# If fails after 10 min, re-run DNS route:
cloudflared tunnel route dns claude-hooks hooks.metacogna.ai
```

---

### Webhook Issues

**Webhooks not arriving**:
```bash
# 1. Check webhook server is running
lsof -i :4100

# 2. Check tunnel is active
curl https://hooks.metacogna.ai/health

# 3. Check external service webhook status
# - Todoist: Check app console for delivery failures
# - Linear: Check workspace settings for webhook status

# 4. Check logs for errors
tail -f /tmp/claude-webhook-server.log
```

---

## 📈 Success Criteria

### Minimum Viable Setup

- [x] launchd agents installed
- [x] Scripts added to package.json
- [ ] Cloudflare tunnel configured
- [ ] Todoist webhook configured
- [ ] Linear webhook configured
- [ ] Test review runs successfully
- [ ] Test webhook received from Todoist
- [ ] Test webhook received from Linear

### Full Production Setup

- [ ] All minimum criteria met
- [ ] Agents running automatically for 1 week
- [ ] Zero failed reviews in logs
- [ ] Webhook delivery >95% success rate
- [ ] Documentation updated with lessons learned
- [ ] Monitoring dashboard created (optional)

---

## 🎯 Current Status

**Completed**:
- ✅ launchd agents installed and loaded
- ✅ Context retrieval working (17 tasks, 50 issues)
- ✅ cloudflared installed
- ✅ Configuration files created
- ✅ Documentation complete

**In Progress**:
- ⏳ Cloudflare tunnel setup (requires user action)
- ⏳ Webhook configuration (requires user action)

**Blocked**:
- ⚠️ captureWorkflow SDK errors (need to investigate)

**Next Actions**:
1. **You**: Run `./scripts/setup-cloudflare-tunnel.sh`
2. **You**: Configure Todoist webhook
3. **You**: Configure Linear webhook
4. **Together**: Test end-to-end workflow

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| [[INSTALLATION_GUIDE.md]] | Quick start guide |
| [[SCHEDULING_SETUP.md]] | Comprehensive setup docs |
| [[CLOUDFLARE_SETUP_STEPS.md]] | Tunnel setup walkthrough |
| [[WEBHOOK_CONFIGURATION.md]] | External service config |
| [[DEPLOYMENT_CHECKLIST.md]] | This document |
| [[docs/CRON_RETRY_OPTIONS.md]] | Retry mechanism comparison |

---

**Last Updated**: 2026-02-16
**Status**: Ready for Phase 2 & 3 (User Action Required)
**Estimated Time**: 30 minutes total
