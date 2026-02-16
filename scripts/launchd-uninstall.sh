#!/bin/bash
# Uninstall Claude review launchd agents

echo "Uninstalling Claude review launchd agents..."
echo ""

for plist in /Users/nullzero/Library/LaunchAgents/com.metacogna.claude.*.plist; do
    if [ -f "$plist" ]; then
        filename=$(basename "$plist")
        label=$(echo "$filename" | sed 's/.plist$//')

        echo "Unloading: $label"
        launchctl unload "$plist" 2>/dev/null || true

        echo "Removing: $plist"
        rm "$plist"
    fi
done

echo ""
echo "✓ Uninstallation complete"
echo ""
echo "To reinstall, run: /Users/nullzero/Metacogna/claude-obsidian-todoist-linear/scripts/setup-launchd.sh"
