# Cloudflare Tunnel Setup Steps

## Prerequisites Check

1. **Install cloudflared** (if not already installed):
```bash
brew install cloudflare/cloudflare/cloudflared
```

2. **Verify installation**:
```bash
cloudflared --version
```

## Interactive Setup

Run this command and follow the prompts:

```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
./scripts/setup-cloudflare-tunnel.sh
```

### What Will Happen:

1. **Browser Authentication**:
   - Script will open your browser
   - Log into your Cloudflare account
   - Authorize cloudflared to access your account

2. **Tunnel Creation**:
   - Creates tunnel named: `claude-hooks`
   - Generates credentials in `~/.cloudflared/`

3. **DNS Configuration**:
   - Adds DNS record: `hooks.metacogna.ai`
   - Routes traffic to your local port 4100

4. **Service Setup**:
   - Creates launchd service for auto-start
   - Configures logging

### After Setup Complete:

**Start the webhook server** (Terminal 1):
```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
bun run dev webhooks --port 4100
```

**Start the tunnel** (Terminal 2):
```bash
./scripts/tunnel-start.sh
```

**Test the connection**:
```bash
curl https://hooks.metacogna.ai/health
```

Expected response: `{"status":"ok"}` or similar

---

**Note**: If you don't have a Cloudflare account or `metacogna.ai` domain in Cloudflare, you'll need to:
1. Create a Cloudflare account (free)
2. Add your domain to Cloudflare
3. Update nameservers at your domain registrar

**Alternative**: Use a different hostname by editing `cloudflare/tunnel-config.yml` before running setup.
