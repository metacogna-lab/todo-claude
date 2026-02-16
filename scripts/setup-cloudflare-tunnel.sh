#!/bin/bash
# Setup Cloudflare Tunnel for webhook server
# Exposes localhost:4100 as https://hooks.metacogna.ai

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TUNNEL_NAME="claude-hooks"
HOSTNAME="hooks.metacogna.ai"

echo "🌐 Cloudflare Tunnel Setup - Claude Webhook Server"
echo "===================================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared not found"
    echo ""
    echo "Install cloudflared:"
    echo ""
    echo "  macOS:"
    echo "    brew install cloudflare/cloudflare/cloudflared"
    echo ""
    echo "  Linux:"
    echo "    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
    echo "    sudo dpkg -i cloudflared-linux-amd64.deb"
    echo ""
    echo "  Or visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation"
    exit 1
fi

echo "✓ cloudflared found: $(cloudflared --version | head -1)"
echo ""

# Check if already authenticated
if [ ! -f "$HOME/.cloudflared/cert.pem" ]; then
    echo "🔐 Cloudflare Authentication Required"
    echo ""
    echo "This will open your browser to authenticate with Cloudflare."
    echo "You need a Cloudflare account with a domain configured."
    echo ""
    read -p "Continue? (y/n): " AUTH_CONTINUE

    if [ "$AUTH_CONTINUE" != "y" ] && [ "$AUTH_CONTINUE" != "Y" ]; then
        echo "Setup cancelled."
        exit 0
    fi

    echo ""
    echo "Authenticating..."
    cloudflared tunnel login

    if [ $? -ne 0 ]; then
        echo "❌ Authentication failed"
        exit 1
    fi

    echo "✓ Authentication successful"
else
    echo "✓ Already authenticated with Cloudflare"
fi
echo ""

# Check if tunnel already exists
TUNNEL_EXISTS=$(cloudflared tunnel list 2>/dev/null | grep -c "$TUNNEL_NAME" || true)

if [ "$TUNNEL_EXISTS" -gt 0 ]; then
    echo "⚠️  Tunnel '$TUNNEL_NAME' already exists"
    echo ""
    read -p "Delete and recreate? (y/n): " RECREATE

    if [ "$RECREATE" = "y" ] || [ "$RECREATE" = "Y" ]; then
        echo "Deleting existing tunnel..."
        cloudflared tunnel delete "$TUNNEL_NAME" 2>/dev/null || true
        TUNNEL_EXISTS=0
    else
        echo "Using existing tunnel."
    fi
    echo ""
fi

# Create tunnel if needed
if [ "$TUNNEL_EXISTS" -eq 0 ]; then
    echo "Creating tunnel: $TUNNEL_NAME"
    cloudflared tunnel create "$TUNNEL_NAME"

    if [ $? -ne 0 ]; then
        echo "❌ Failed to create tunnel"
        exit 1
    fi

    echo "✓ Tunnel created"
else
    echo "✓ Using existing tunnel: $TUNNEL_NAME"
fi
echo ""

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}')

if [ -z "$TUNNEL_ID" ]; then
    echo "❌ Could not find tunnel ID"
    exit 1
fi

echo "✓ Tunnel ID: $TUNNEL_ID"
echo ""

# Configure DNS
echo "📍 DNS Configuration"
echo ""
echo "Setting up DNS route: $HOSTNAME → $TUNNEL_NAME"
echo ""

# Check if route already exists
ROUTE_EXISTS=$(cloudflared tunnel route dns "$TUNNEL_NAME" "$HOSTNAME" 2>&1 | grep -c "already exists" || true)

if [ "$ROUTE_EXISTS" -eq 0 ]; then
    cloudflared tunnel route dns "$TUNNEL_NAME" "$HOSTNAME"
    echo "✓ DNS route created"
else
    echo "✓ DNS route already exists"
fi
echo ""

# Copy tunnel configuration
echo "Copying tunnel configuration..."
CONFIG_SOURCE="$PROJECT_DIR/cloudflare/tunnel-config.yml"
CONFIG_TARGET="$HOME/.cloudflared/config.yml"

if [ -f "$CONFIG_TARGET" ]; then
    echo "⚠️  Existing config found at $CONFIG_TARGET"
    cp "$CONFIG_TARGET" "$CONFIG_TARGET.backup.$(date +%Y%m%d-%H%M%S)"
    echo "  Backup created: $CONFIG_TARGET.backup.*"
fi

# Update config with actual tunnel ID and paths
sed "s|tunnel: claude-hooks|tunnel: $TUNNEL_ID|g" "$CONFIG_SOURCE" | \
sed "s|credentials-file: /Users/nullzero/.cloudflared/claude-hooks.json|credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json|g" > "$CONFIG_TARGET"

echo "✓ Configuration updated: $CONFIG_TARGET"
echo ""

# Create systemd service (Linux) or launchd plist (macOS)
if [ "$(uname)" = "Darwin" ]; then
    echo "Creating launchd service for macOS..."

    PLIST_PATH="$HOME/Library/LaunchAgents/com.cloudflare.cloudflared.plist"

    cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.cloudflared</string>

    <key>ProgramArguments</key>
    <array>
        <string>$(which cloudflared)</string>
        <string>tunnel</string>
        <string>--config</string>
        <string>$HOME/.cloudflared/config.yml</string>
        <string>run</string>
        <string>$TUNNEL_ID</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>/tmp/cloudflared.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/cloudflared-error.log</string>
</dict>
</plist>
EOF

    echo "✓ launchd service created: $PLIST_PATH"
    echo ""
    echo "To start tunnel automatically:"
    echo "  launchctl load $PLIST_PATH"
    echo "  launchctl start com.cloudflare.cloudflared"
    echo ""

else
    echo "Creating systemd service for Linux..."

    sudo tee /etc/systemd/system/cloudflared.service > /dev/null <<EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=$(which cloudflared) tunnel --config $HOME/.cloudflared/config.yml run $TUNNEL_ID
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

    echo "✓ systemd service created"
    echo ""
    echo "To start tunnel automatically:"
    echo "  sudo systemctl enable cloudflared"
    echo "  sudo systemctl start cloudflared"
    echo ""
fi

# Create helper scripts
echo "Creating management scripts..."

# Start script
cat > "$SCRIPT_DIR/tunnel-start.sh" <<EOF
#!/bin/bash
# Start Cloudflare tunnel manually (foreground)

echo "Starting Cloudflare tunnel: $TUNNEL_NAME"
echo "Exposing: http://localhost:4100 → https://$HOSTNAME"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cloudflared tunnel --config $HOME/.cloudflared/config.yml run $TUNNEL_ID
EOF

chmod +x "$SCRIPT_DIR/tunnel-start.sh"

# Status script
cat > "$SCRIPT_DIR/tunnel-status.sh" <<EOF
#!/bin/bash
# Check Cloudflare tunnel status

echo "Cloudflare Tunnel Status"
echo "========================"
echo ""

echo "Tunnel Info:"
cloudflared tunnel info $TUNNEL_ID 2>/dev/null || echo "Tunnel not found"

echo ""
echo "Active Tunnels:"
cloudflared tunnel list | grep "$TUNNEL_NAME" || echo "Not running"

echo ""
echo "DNS Routes:"
cloudflared tunnel route dns list 2>/dev/null | grep "$HOSTNAME" || echo "No routes found"

echo ""
echo "Test webhook endpoint:"
echo "  curl https://$HOSTNAME/health"
EOF

chmod +x "$SCRIPT_DIR/tunnel-status.sh"

# Stop script
cat > "$SCRIPT_DIR/tunnel-stop.sh" <<EOF
#!/bin/bash
# Stop Cloudflare tunnel

if [ "\$(uname)" = "Darwin" ]; then
    echo "Stopping launchd service..."
    launchctl stop com.cloudflare.cloudflared
    launchctl unload $PLIST_PATH
else
    echo "Stopping systemd service..."
    sudo systemctl stop cloudflared
fi

echo "✓ Tunnel stopped"
EOF

chmod +x "$SCRIPT_DIR/tunnel-stop.sh"

echo "✓ Management scripts created:"
echo "  - tunnel-start.sh (start tunnel manually)"
echo "  - tunnel-status.sh (check tunnel status)"
echo "  - tunnel-stop.sh (stop tunnel service)"
echo ""

# Display configuration instructions
echo "✅ Cloudflare Tunnel Setup Complete!"
echo ""
echo "📋 Next Steps"
echo "============="
echo ""
echo "1. Start the webhook server:"
echo "   cd $PROJECT_DIR"
echo "   bun run dev webhooks --port 4100"
echo ""
echo "2. Start the tunnel (in another terminal):"
echo "   $SCRIPT_DIR/tunnel-start.sh"
echo ""
echo "   OR run as a service:"
if [ "\$(uname)" = "Darwin" ]; then
    echo "   launchctl load $PLIST_PATH"
    echo "   launchctl start com.cloudflare.cloudflared"
else
    echo "   sudo systemctl enable cloudflared"
    echo "   sudo systemctl start cloudflared"
fi
echo ""
echo "3. Test the connection:"
echo "   curl https://$HOSTNAME/health"
echo ""
echo "4. Configure external services with these webhook URLs:"
echo ""
echo "   Todoist Webhooks:"
echo "   → https://$HOSTNAME/webhooks/todoist"
echo ""
echo "   Linear Webhooks:"
echo "   → https://$HOSTNAME/webhooks/linear"
echo ""
echo "   Obsidian Automation:"
echo "   → https://$HOSTNAME/webhooks/obsidian"
echo ""
echo "5. Check tunnel status:"
echo "   $SCRIPT_DIR/tunnel-status.sh"
echo ""
echo "6. View tunnel logs:"
echo "   tail -f /tmp/cloudflared.log"
echo ""
echo "🔗 Webhook endpoint: https://$HOSTNAME"
echo ""
