# Cron Retry Mechanisms - Implementation Options

## Problem

Standard cron jobs **do not retry** if missed. If your machine is off/asleep at the scheduled time, the review simply doesn't run until the next scheduled occurrence.

## Solution Options

### Option 1: macOS launchd (Recommended for macOS)

**Advantages**:
- Native to macOS
- Better power management awareness
- Can catch up missed runs
- More reliable than cron on macOS

**Implementation**:

Create `~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.metacogna.claude.daily-review</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/bun</string>
        <string>run</string>
        <string>review:daily</string>
    </array>

    <key>WorkingDirectory</key>
    <string>/Users/nullzero/Metacogna/claude-obsidian-todoist-linear</string>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>1</integer> <!-- Monday -->
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <!-- Repeat for Tue-Fri -->

    <key>StandardOutPath</key>
    <string>/tmp/claude-daily-review.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/claude-daily-review-error.log</string>

    <!-- Run immediately if missed -->
    <key>LaunchOnlyOnce</key>
    <false/>

    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
```

**Enable**:
```bash
launchctl load ~/Library/LaunchAgents/com.metacogna.claude.daily-review.plist
launchctl start com.metacogna.claude.daily-review
```

### Option 2: anacron (Linux Alternative)

**Advantages**:
- Specifically designed for intermittent systems
- Runs missed jobs when system comes back online
- Simple configuration

**Implementation**:

Install anacron:
```bash
# Ubuntu/Debian
sudo apt install anacron

# macOS (via Homebrew)
brew install anacron
```

Edit `/etc/anacrontab`:
```bash
# period  delay  job-id  command
1  5  claude.daily  cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear && /usr/local/bin/bun run review:daily
7  10  claude.weekly  cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear && /usr/local/bin/bun run review:weekly
@monthly  15  claude.product  cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear && /usr/local/bin/bun run review:product
```

### Option 3: Systemd Timers (Linux Only)

**Advantages**:
- Built-in retry and restart policies
- Better logging via journalctl
- Can specify retry intervals

**Implementation**:

Create `/etc/systemd/system/claude-daily-review.service`:
```ini
[Unit]
Description=Claude Daily Review
After=network.target

[Service]
Type=oneshot
User=nullzero
WorkingDirectory=/Users/nullzero/Metacogna/claude-obsidian-todoist-linear
ExecStart=/usr/local/bin/bun run review:daily
StandardOutput=append:/tmp/claude-daily-review.log
StandardError=append:/tmp/claude-daily-review-error.log

# Retry configuration
Restart=on-failure
RestartSec=300
StartLimitInterval=3600
StartLimitBurst=3
```

Create `/etc/systemd/system/claude-daily-review.timer`:
```ini
[Unit]
Description=Claude Daily Review Timer
Requires=claude-daily-review.service

[Timer]
OnCalendar=Mon-Fri 09:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

**Enable**:
```bash
sudo systemctl enable claude-daily-review.timer
sudo systemctl start claude-daily-review.timer
sudo systemctl status claude-daily-review.timer
```

### Option 4: Custom Retry Script (Works Everywhere)

**Advantages**:
- Works with existing cron setup
- Cross-platform compatible
- Customizable retry logic

**Implementation**:

Create `scripts/run-with-retry.sh`:
```bash
#!/bin/bash
# Run review with retry logic

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMMAND="$1"
MAX_RETRIES=3
RETRY_DELAY=300  # 5 minutes

retry_count=0

while [ $retry_count -lt $MAX_RETRIES ]; do
    echo "$(date): Attempt $((retry_count + 1)) of $MAX_RETRIES" >> /tmp/claude-retry.log

    cd "$PROJECT_DIR" || exit 1

    if /usr/local/bin/bun run "$COMMAND"; then
        echo "$(date): Success on attempt $((retry_count + 1))" >> /tmp/claude-retry.log
        exit 0
    else
        retry_count=$((retry_count + 1))
        echo "$(date): Failed attempt $retry_count, waiting ${RETRY_DELAY}s" >> /tmp/claude-retry.log

        if [ $retry_count -lt $MAX_RETRIES ]; then
            sleep $RETRY_DELAY
        fi
    fi
done

echo "$(date): All $MAX_RETRIES attempts failed" >> /tmp/claude-retry.log
exit 1
```

**Update crontab**:
```bash
# Daily Review with retry
0 9 * * 1-5 /Users/nullzero/Metacogna/claude-obsidian-todoist-linear/scripts/run-with-retry.sh review:daily >> /tmp/claude-daily-review.log 2>&1

# Weekly Review with retry
0 16 * * 5 /Users/nullzero/Metacogna/claude-obsidian-todoist-linear/scripts/run-with-retry.sh review:weekly >> /tmp/claude-weekly-review.log 2>&1
```

### Option 5: Hybrid - Cron + State-Based Recovery

**Advantages**:
- Works with existing setup
- Detects missed runs
- Self-healing

**Implementation**:

Add to beginning of each review script:

```typescript
// Check for missed runs
async function checkMissedRuns(): Promise<void> {
  const statePath = path.join(OBSIDIAN_VAULT, "daily-summary/state/claude-state.md");
  const state = await fs.readFile(statePath, "utf-8");

  const lastRun = extractLastRunDate(state);
  const today = new Date().toISOString().split("T")[0];

  if (shouldHaveRun(lastRun, today)) {
    logger.warn("Missed run detected, executing now");
    // Continue with review
  }
}
```

## Comparison Matrix

| Option | macOS | Linux | Retry on Boot | Complexity | Recommended |
|--------|-------|-------|---------------|------------|-------------|
| launchd | ✅ Native | ❌ | ✅ | Low | ✅ **Best for macOS** |
| anacron | ⚠️ Homebrew | ✅ Native | ✅ | Medium | ✅ **Best for Linux** |
| systemd | ❌ | ✅ Native | ✅ | Medium | Good for Linux |
| Retry Script | ✅ | ✅ | ❌ | Low | Quick fix |
| State Recovery | ✅ | ✅ | ⚠️ Manual | High | Advanced |

## Recommendation

**For your setup (macOS)**:
1. **Primary**: Use **launchd** (Option 1) - native, reliable, power-aware
2. **Fallback**: Add **state-based recovery** (Option 5) for extra safety
3. **Monitor**: Set up notifications when reviews are missed

**Quick Win**: Implement Option 4 (retry script) immediately while planning launchd migration.

## Installation Script

Create `scripts/setup-launchd.sh`:
```bash
#!/bin/bash
# Setup launchd for automatic reviews with retry

# Generate launchd plists for all reviews
# Load them into user agents
# Test with launchctl start
```

Would you like me to implement any of these options?
