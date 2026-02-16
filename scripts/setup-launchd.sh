#!/bin/bash
# Setup launchd agents for automated reviews with retry capability
# macOS only - provides better scheduling than cron with automatic retry on wake

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LAUNCHD_DIR="$PROJECT_DIR/launchd"
TARGET_DIR="$HOME/Library/LaunchAgents"

echo "🚀 Claude Review System - launchd Setup"
echo "========================================"
echo ""
echo "This will install launchd agents for:"
echo "  - Daily Review (Mon-Fri @ 9:00 AM)"
echo "  - Weekly Review (Fridays @ 4:00 PM)"
echo "  - Monthly Product Review (1st @ 10:00 AM)"
echo "  - Quarterly Product Review (Jan/Apr/Jul/Oct 1st @ 10:00 AM)"
echo ""
echo "Advantages over cron:"
echo "  ✓ Runs missed jobs when Mac wakes from sleep"
echo "  ✓ Better power management integration"
echo "  ✓ More reliable on macOS"
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun not found"
    echo "   Install with: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

BUN_PATH=$(which bun)
echo "✓ Found bun at: $BUN_PATH"
echo ""

# Verify project directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "❌ Error: package.json not found in $PROJECT_DIR"
    exit 1
fi

echo "✓ Project directory: $PROJECT_DIR"
echo ""

# Update plist files with actual bun path
echo "Updating plist files with bun path..."
for plist in "$LAUNCHD_DIR"/*.plist; do
    if [ -f "$plist" ]; then
        # Create temporary file with updated path
        sed "s|/usr/local/bin/bun|$BUN_PATH|g" "$plist" > "$plist.tmp"
        mv "$plist.tmp" "$plist"
    fi
done

echo "✓ Plist files updated"
echo ""

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Check for existing cron jobs
CRON_JOBS=$(crontab -l 2>/dev/null | grep -c "claude.*review" || true)
if [ "$CRON_JOBS" -gt 0 ]; then
    echo "⚠️  Warning: Found $CRON_JOBS existing cron job(s) for Claude reviews"
    echo ""
    read -p "Remove cron jobs and replace with launchd? (y/n): " REMOVE_CRON

    if [ "$REMOVE_CRON" = "y" ] || [ "$REMOVE_CRON" = "Y" ]; then
        echo "Backing up crontab..."
        crontab -l > "$HOME/crontab-backup-$(date +%Y%m%d-%H%M%S).txt"

        echo "Removing Claude review cron jobs..."
        crontab -l | grep -v "claude.*review" | crontab -
        echo "✓ Cron jobs removed"
    fi
    echo ""
fi

# Install plist files
echo "Installing launchd agents..."
INSTALLED_COUNT=0

for plist in "$LAUNCHD_DIR"/*.plist; do
    if [ -f "$plist" ]; then
        filename=$(basename "$plist")
        label=$(echo "$filename" | sed 's/.plist$//')

        # Unload if already loaded
        if launchctl list | grep -q "$label"; then
            echo "  Unloading existing: $label"
            launchctl unload "$TARGET_DIR/$filename" 2>/dev/null || true
        fi

        # Copy plist
        cp "$plist" "$TARGET_DIR/$filename"

        # Load the agent
        echo "  Loading: $label"
        launchctl load "$TARGET_DIR/$filename"

        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    fi
done

echo ""
echo "✅ Successfully installed $INSTALLED_COUNT launchd agents"
echo ""

# Display status
echo "Agent Status:"
echo "============="
launchctl list | grep "com.metacogna.claude" || echo "No agents found (may take a moment to register)"
echo ""

# Create helper scripts
echo "Creating management scripts..."

# Status script
cat > "$SCRIPT_DIR/launchd-status.sh" <<'EOF'
#!/bin/bash
# Check status of Claude review launchd agents

echo "Claude Review Agents Status"
echo "==========================="
echo ""

for label in \
    com.metacogna.claude.daily-review \
    com.metacogna.claude.weekly-review \
    com.metacogna.claude.product-review \
    com.metacogna.claude.quarterly-review
do
    if launchctl list | grep -q "$label"; then
        echo "✓ $label - LOADED"
    else
        echo "✗ $label - NOT LOADED"
    fi
done

echo ""
echo "Recent runs (check logs):"
echo "========================="
echo "Daily:     tail -20 /tmp/claude-daily-review.log"
echo "Weekly:    tail -20 /tmp/claude-weekly-review.log"
echo "Product:   tail -20 /tmp/claude-product-review.log"
echo "Quarterly: tail -20 /tmp/claude-quarterly-review.log"
echo ""
echo "Errors:"
echo "======="
echo "Daily:     tail -20 /tmp/claude-daily-review-error.log"
echo "Weekly:    tail -20 /tmp/claude-weekly-review-error.log"
EOF

chmod +x "$SCRIPT_DIR/launchd-status.sh"

# Uninstall script
cat > "$SCRIPT_DIR/launchd-uninstall.sh" <<EOF
#!/bin/bash
# Uninstall Claude review launchd agents

echo "Uninstalling Claude review launchd agents..."
echo ""

for plist in $TARGET_DIR/com.metacogna.claude.*.plist; do
    if [ -f "\$plist" ]; then
        filename=\$(basename "\$plist")
        label=\$(echo "\$filename" | sed 's/.plist$//')

        echo "Unloading: \$label"
        launchctl unload "\$plist" 2>/dev/null || true

        echo "Removing: \$plist"
        rm "\$plist"
    fi
done

echo ""
echo "✓ Uninstallation complete"
echo ""
echo "To reinstall, run: $SCRIPT_DIR/setup-launchd.sh"
EOF

chmod +x "$SCRIPT_DIR/launchd-uninstall.sh"

# Test script
cat > "$SCRIPT_DIR/launchd-test.sh" <<EOF
#!/bin/bash
# Test a Claude review agent manually

LABEL=\$1

if [ -z "\$LABEL" ]; then
    echo "Usage: \$0 <agent-name>"
    echo ""
    echo "Available agents:"
    echo "  daily       - Daily review"
    echo "  weekly      - Weekly review"
    echo "  product     - Monthly product review"
    echo "  quarterly   - Quarterly product review"
    exit 1
fi

FULL_LABEL="com.metacogna.claude.\${LABEL}-review"

echo "Testing: \$FULL_LABEL"
echo ""

if ! launchctl list | grep -q "\$FULL_LABEL"; then
    echo "❌ Error: \$FULL_LABEL is not loaded"
    exit 1
fi

echo "Starting agent..."
launchctl start "\$FULL_LABEL"

echo ""
echo "Waiting for completion..."
sleep 2

echo ""
echo "Recent log output:"
echo "=================="
tail -30 "/tmp/claude-\${LABEL}-review.log"

if [ -f "/tmp/claude-\${LABEL}-review-error.log" ]; then
    echo ""
    echo "Errors (if any):"
    echo "================"
    tail -30 "/tmp/claude-\${LABEL}-review-error.log"
fi
EOF

chmod +x "$SCRIPT_DIR/launchd-test.sh"

echo "✓ Management scripts created:"
echo "  - launchd-status.sh (check agent status)"
echo "  - launchd-uninstall.sh (remove all agents)"
echo "  - launchd-test.sh (manually test an agent)"
echo ""

# Final instructions
echo "📝 Next Steps"
echo "============="
echo ""
echo "1. Check agent status:"
echo "   $SCRIPT_DIR/launchd-status.sh"
echo ""
echo "2. Test an agent manually:"
echo "   $SCRIPT_DIR/launchd-test.sh daily"
echo ""
echo "3. Monitor logs:"
echo "   tail -f /tmp/claude-daily-review.log"
echo ""
echo "4. View errors:"
echo "   tail -f /tmp/claude-daily-review-error.log"
echo ""
echo "The agents will now run automatically at their scheduled times."
echo "Unlike cron, launchd will run missed jobs when your Mac wakes from sleep."
echo ""
echo "✅ Setup complete!"
