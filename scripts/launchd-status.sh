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
