# Webhook Configuration Guide

Configure Todoist and Linear to send real-time events to your webhook server.

**Prerequisites**: Cloudflare tunnel must be running and webhook endpoint accessible.

---

## Test Webhook Endpoint First

Before configuring external services, verify your webhook server is accessible:

```bash
# Test health endpoint
curl https://hooks.metacogna.ai/health

# Expected: {"status":"ok"} or similar
# If you get connection refused, ensure:
# 1. Webhook server is running (bun run dev webhooks --port 4100)
# 2. Cloudflare tunnel is running (./scripts/tunnel-start.sh)
```

---

## 1. Todoist Webhook Configuration

### Step-by-Step:

1. **Go to Todoist App Console**:
   - Visit: https://developer.todoist.com/appconsole.html
   - Log in with your Todoist account

2. **Select or Create App**:
   - If you have an app: Select it
   - If not: Click "Create a new app"
     - Name: "Claude Assistant"
     - Description: "Automated review system"

3. **Navigate to Webhooks Section**:
   - Click on your app name
   - Go to "Webhooks" tab

4. **Add Webhook**:
   - Click "Add webhook"
   - **Callback URL**: `https://hooks.metacogna.ai/webhooks/todoist`
   - **Events** (select all that apply):
     - ☑️ `item:added` - When a task is created
     - ☑️ `item:updated` - When a task is modified
     - ☑️ `item:completed` - When a task is completed
     - ☑️ `item:deleted` - When a task is deleted
     - ☑️ `item:uncompleted` - When a task is reopened (optional)
     - ☑️ `project:added` - When a project is created (optional)
     - ☑️ `project:updated` - When a project is modified (optional)

5. **Save Webhook**:
   - Click "Create" or "Save"
   - Todoist will test the endpoint

6. **Verify**:
   - Check webhook status shows "Active"
   - Make a test: Create a task in Todoist
   - Check webhook server logs:
     ```bash
     tail -f /tmp/claude-webhook-server.log
     ```

### Webhook Secret (Optional)

For security, Todoist can sign webhooks:
1. In app console, note the "Client Secret"
2. Add to `.env`:
   ```bash
   TODOIST_WEBHOOK_SECRET=your-client-secret
   ```

### Test Todoist Webhook:

```bash
# Create a test task via Todoist API
curl -X POST https://api.todoist.com/rest/v2/tasks \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test webhook integration"}'

# Check webhook server received it
tail -20 /tmp/claude-webhook-server.log
```

---

## 2. Linear Webhook Configuration

### Step-by-Step:

1. **Open Linear Workspace Settings**:
   - Go to: https://linear.app/[your-workspace]/settings
   - Or click workspace name (top-left) → "Settings"

2. **Navigate to API Section**:
   - In left sidebar: "API" → "Webhooks"

3. **Create Webhook**:
   - Click "New webhook"
   - **Label**: "Claude Assistant"
   - **URL**: `https://hooks.metacogna.ai/webhooks/linear`
   - **Enabled**: ☑️ Checked

4. **Select Events**:
   - **Issue Events**:
     - ☑️ `Issue created`
     - ☑️ `Issue updated`
     - ☑️ `Issue deleted`
     - ☑️ `Issue completed` (if available)
   - **Optional Events** (if needed):
     - ☑️ `Comment created`
     - ☑️ `Project updated`
     - ☑️ `Cycle created`

5. **Resource Types** (if shown):
   - ☑️ `Issue`
   - ☑️ `Comment` (optional)
   - ☑️ `Project` (optional)

6. **Save Webhook**:
   - Click "Create webhook"
   - Linear will display webhook secret

7. **Save Webhook Secret**:
   - Copy the secret key shown
   - Add to `.env`:
     ```bash
     LINEAR_WEBHOOK_SECRET=your-webhook-secret
     ```

8. **Verify**:
   - Webhook status should show "Active"
   - Create/update an issue in Linear
   - Check webhook logs:
     ```bash
     tail -f /tmp/claude-webhook-server.log
     ```

### Test Linear Webhook:

```bash
# Create a test issue via Linear API
curl -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { issueCreate(input: {title: \"Test webhook\", teamId: \"INTEL\"}) { success issue { id title } } }"
  }'

# Check webhook server received it
tail -20 /tmp/claude-webhook-server.log
```

---

## 3. Obsidian Automation (Optional)

Obsidian doesn't have built-in webhooks, but you can trigger them via automation:

### Option A: Using Hazel (macOS Automation)

1. **Install Hazel**: https://www.noodlesoft.com/
2. **Create Rule**:
   - Monitor folder: `/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary`
   - Pattern: "Any change"
   - Action: Run shell script
   ```bash
   #!/bin/bash
   FILE="$1"
   curl -X POST https://hooks.metacogna.ai/webhooks/obsidian \
     -H "Content-Type: application/json" \
     -d "{\"event\":\"file_changed\",\"path\":\"$FILE\"}"
   ```

### Option B: Using fswatch

```bash
# Install fswatch
brew install fswatch

# Create watcher script
cat > ~/watch-obsidian.sh <<'EOF'
#!/bin/bash
VAULT="/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary"

fswatch -0 "$VAULT" | while read -d "" event; do
    # Only trigger for markdown files
    if [[ "$event" == *.md ]]; then
        echo "Change detected: $event"
        curl -X POST https://hooks.metacogna.ai/webhooks/obsidian \
            -H "Content-Type: application/json" \
            -d "{\"event\":\"file_changed\",\"path\":\"$event\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
    fi
done
EOF

chmod +x ~/watch-obsidian.sh

# Run in background
nohup ~/watch-obsidian.sh > /tmp/obsidian-watcher.log 2>&1 &
```

### Option C: Manual Trigger

```bash
# Trigger manually after making changes
curl -X POST https://hooks.metacogna.ai/webhooks/obsidian \
  -H "Content-Type: application/json" \
  -d '{"event":"manual_sync","timestamp":"2026-02-16T13:00:00Z"}'
```

---

## Webhook Payload Examples

### Todoist Event (item:added):
```json
{
  "event_name": "item:added",
  "event_data": {
    "id": "123456",
    "content": "New task",
    "description": "Task details",
    "project_id": "789",
    "labels": ["ai", "urgent"],
    "priority": 4,
    "due": {
      "date": "2026-02-17"
    }
  },
  "user_id": "56677364"
}
```

### Linear Event (Issue Created):
```json
{
  "action": "create",
  "type": "Issue",
  "data": {
    "id": "abc-123",
    "title": "New issue",
    "description": "Issue details",
    "state": {
      "name": "Todo"
    },
    "team": {
      "id": "INTEL"
    },
    "assignee": {
      "id": "user-id",
      "name": "User Name"
    }
  },
  "createdAt": "2026-02-16T13:00:00.000Z"
}
```

---

## Monitoring Webhooks

### View Incoming Webhooks:

```bash
# Real-time webhook logs
tail -f /tmp/claude-webhook-server.log

# Filter for Todoist events
tail -f /tmp/claude-webhook-server.log | grep todoist

# Filter for Linear events
tail -f /tmp/claude-webhook-server.log | grep linear
```

### Debug Webhook Issues:

```bash
# Check if webhook server is running
lsof -i :4100

# Check tunnel status
./scripts/tunnel-status.sh

# Test endpoint directly
curl -v https://hooks.metacogna.ai/health

# Send test webhook
curl -X POST https://hooks.metacogna.ai/webhooks/todoist \
  -H "Content-Type: application/json" \
  -d '{"event_name":"test","event_data":{}}'
```

### Common Issues:

**Webhook fails validation**:
- Ensure webhook server is running
- Check Cloudflare tunnel is active
- Verify URL is accessible publicly

**Events not triggering**:
- Check event types are selected
- Verify webhook is "Active" in external service
- Check webhook server logs for errors

**Authentication errors**:
- Verify webhook secrets are correct in `.env`
- Check server is validating signatures correctly

---

## Security Best Practices

1. **Use Webhook Secrets**:
   - Always configure webhook secrets
   - Validate signatures on incoming requests

2. **HTTPS Only**:
   - Cloudflare Tunnel provides free SSL
   - Never use HTTP for webhooks

3. **Rate Limiting**:
   - Implement rate limits in webhook handler
   - Prevent abuse and DDoS

4. **IP Whitelisting** (optional):
   - Todoist IPs: Check documentation
   - Linear IPs: Check documentation
   - Configure in Cloudflare Access

---

## Summary

**Webhook Endpoints Configured**:
- ✅ Todoist: `https://hooks.metacogna.ai/webhooks/todoist`
- ✅ Linear: `https://hooks.metacogna.ai/webhooks/linear`
- ✅ Obsidian: `https://hooks.metacogna.ai/webhooks/obsidian` (optional)

**Next Steps**:
1. Start webhook server: `bun run dev webhooks --port 4100`
2. Start Cloudflare tunnel: `./scripts/tunnel-start.sh`
3. Configure webhooks in Todoist and Linear
4. Test with real events
5. Monitor logs for successful processing

---

**Documentation**: Complete
**Status**: Ready for configuration
**Last Updated**: 2026-02-16
