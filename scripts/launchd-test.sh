#!/bin/bash
# Test a Claude review agent manually

LABEL=$1

if [ -z "$LABEL" ]; then
    echo "Usage: $0 <agent-name>"
    echo ""
    echo "Available agents:"
    echo "  daily       - Daily review"
    echo "  weekly      - Weekly review"
    echo "  product     - Monthly product review"
    echo "  quarterly   - Quarterly product review"
    exit 1
fi

FULL_LABEL="com.metacogna.claude.${LABEL}-review"

echo "Testing: $FULL_LABEL"
echo ""

if ! launchctl list | grep -q "$FULL_LABEL"; then
    echo "❌ Error: $FULL_LABEL is not loaded"
    exit 1
fi

echo "Starting agent..."
launchctl start "$FULL_LABEL"

echo ""
echo "Waiting for completion..."
sleep 2

echo ""
echo "Recent log output:"
echo "=================="
tail -30 "/tmp/claude-${LABEL}-review.log"

if [ -f "/tmp/claude-${LABEL}-review-error.log" ]; then
    echo ""
    echo "Errors (if any):"
    echo "================"
    tail -30 "/tmp/claude-${LABEL}-review-error.log"
fi
