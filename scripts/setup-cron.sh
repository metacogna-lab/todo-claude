#!/bin/bash
# Setup cron jobs for automated reviews

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Setting up automated review cron jobs..."
echo "Project directory: $PROJECT_DIR"

# Create cron job entries
CRON_JOBS=$(cat <<EOF
# Claude Review System - Automated Reviews

# Daily Review - Every weekday at 9:00 AM
0 9 * * 1-5 cd $PROJECT_DIR && /usr/local/bin/bun run review:daily >> /tmp/claude-daily-review.log 2>&1

# Daily Review - Alternative end-of-day run at 5:00 PM
# 0 17 * * 1-5 cd $PROJECT_DIR && /usr/local/bin/bun run review:daily >> /tmp/claude-daily-review.log 2>&1

# Weekly Review - Every Friday at 4:00 PM
0 16 * * 5 cd $PROJECT_DIR && /usr/local/bin/bun run review:weekly >> /tmp/claude-weekly-review.log 2>&1

# Monthly Product Review - First day of each month at 10:00 AM
0 10 1 * * cd $PROJECT_DIR && /usr/local/bin/bun run review:product >> /tmp/claude-product-review.log 2>&1

# Quarterly Product Review - First day of each quarter (Jan, Apr, Jul, Oct) at 10:00 AM
0 10 1 1,4,7,10 * cd $PROJECT_DIR && /usr/local/bin/bun run review:product:quarterly >> /tmp/claude-quarterly-review.log 2>&1

EOF
)

# Backup existing crontab
echo "Backing up existing crontab..."
crontab -l > /tmp/crontab-backup-$(date +%Y%m%d-%H%M%S).txt 2>/dev/null || true

# Ask user for confirmation
echo ""
echo "The following cron jobs will be added:"
echo "========================================"
echo "$CRON_JOBS"
echo "========================================"
echo ""
echo "Options:"
echo "1. Add to existing crontab (recommended)"
echo "2. Show manual installation instructions"
echo "3. Cancel"
echo ""
read -p "Select option (1-3): " choice

case $choice in
  1)
    # Add to crontab
    (crontab -l 2>/dev/null; echo ""; echo "$CRON_JOBS") | crontab -
    echo "✓ Cron jobs added successfully!"
    echo ""
    echo "Verify with: crontab -l"
    echo "View logs in: /tmp/claude-*-review.log"
    ;;
  2)
    echo ""
    echo "Manual Installation Instructions:"
    echo "=================================="
    echo "1. Run: crontab -e"
    echo "2. Add the following lines to your crontab:"
    echo ""
    echo "$CRON_JOBS"
    echo ""
    echo "3. Save and exit"
    ;;
  3)
    echo "Installation cancelled."
    exit 0
    ;;
  *)
    echo "Invalid option. Installation cancelled."
    exit 1
    ;;
esac

# Create log rotation script
LOG_ROTATION_SCRIPT="$SCRIPT_DIR/rotate-logs.sh"
cat > "$LOG_ROTATION_SCRIPT" <<'EOF'
#!/bin/bash
# Rotate review logs to prevent excessive disk usage

LOG_DIR="/tmp"
ARCHIVE_DIR="$HOME/.claude-review-logs"
MAX_AGE_DAYS=90

mkdir -p "$ARCHIVE_DIR"

# Archive old logs
for log in $LOG_DIR/claude-*-review.log; do
  if [ -f "$log" ]; then
    # Get file age in days
    if [ "$(uname)" = "Darwin" ]; then
      # macOS
      age_seconds=$(( $(date +%s) - $(stat -f %m "$log") ))
    else
      # Linux
      age_seconds=$(( $(date +%s) - $(stat -c %Y "$log") ))
    fi
    age_days=$(( age_seconds / 86400 ))

    if [ $age_days -gt 7 ]; then
      # Archive logs older than 7 days
      mv "$log" "$ARCHIVE_DIR/$(basename $log).$(date +%Y%m%d)"
    fi
  fi
done

# Delete archived logs older than MAX_AGE_DAYS
find "$ARCHIVE_DIR" -type f -mtime +$MAX_AGE_DAYS -delete

echo "Log rotation completed: $(date)"
EOF

chmod +x "$LOG_ROTATION_SCRIPT"

# Add log rotation to crontab (runs weekly on Sunday at 3 AM)
LOG_ROTATION_CRON="0 3 * * 0 $LOG_ROTATION_SCRIPT >> /tmp/claude-log-rotation.log 2>&1"

echo ""
read -p "Add weekly log rotation? (y/n): " add_rotation

if [ "$add_rotation" = "y" ] || [ "$add_rotation" = "Y" ]; then
  (crontab -l 2>/dev/null; echo "$LOG_ROTATION_CRON") | crontab -
  echo "✓ Log rotation added to crontab"
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Test daily review: cd $PROJECT_DIR && bun run review:daily"
echo "2. Test weekly review: cd $PROJECT_DIR && bun run review:weekly"
echo "3. Test product review: cd $PROJECT_DIR && bun run review:product"
echo "4. Check cron jobs: crontab -l"
echo "5. Monitor logs: tail -f /tmp/claude-daily-review.log"
