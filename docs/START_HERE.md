# 🚀 START HERE - Review System Quick Reference

## What This Is

An automated review system that analyzes your Obsidian notes to extract **AI/ML/LLM productization opportunities** across five market sectors:

- 🛠️ **DevTools** (LLM observability, testing, deployment)
- 🔒 **Privacy** (federated learning, secure computation)
- 🏢 **Enterprise** (B2B AI solutions, governance)
- 🛡️ **Defence** (secure AI, threat detection)
- 🔬 **Research** (academic → commercial)

## ⚡ Quick Start (5 Minutes)

### Step 1: Test the Skills

Open Claude Code and run:
```
/daily-review
/weekly-review
/product-review monthly
```

### Step 2: Install Automation

```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
./scripts/setup-cron.sh
```

Select option 1 to install cron jobs.

### Step 3: Start Capturing Insights

Tag your notes with market categories:
```markdown
Met with AI startup. Need for self-hosted LLM monitoring.
#DevTools #Privacy
```

Done! Reviews will run automatically.

---

## 📋 What Was Created

### Claude Skills (invoke with `/` commands)
- `/daily-review` - Process notes, sync tasks
- `/weekly-review` - Consolidate patterns
- `/product-review [monthly|quarterly]` - Extract market insights

### Scripts (run manually)
- `bun run review:daily`
- `bun run review:weekly`
- `bun run review:product`

### Agent SDK Tools (use programmatically)
```typescript
import { reviewTools } from "./src/agent/tools";
// Use in Claude Agent SDK applications
```

### Automation (via cron)
- **Daily**: Weekdays 9 AM
- **Weekly**: Fridays 4 PM
- **Monthly**: 1st of month 10 AM
- **Quarterly**: Jan/Apr/Jul/Oct 1st 10 AM

---

## 📚 Documentation Index

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** | Complete overview | 10 min |
| **[README_REVIEWS.md](README_REVIEWS.md)** | Product review deep dive | 15 min |
| **[.claude/skills/SKILLS.md](.claude/skills/SKILLS.md)** | Progressive reveal skills | 20 min |
| **[REVIEW_PLAN.md](../claude-summary/REVIEW_PLAN.md)** | Full methodology | 30 min |
| **[CRON_SCHEDULE.md](../claude-summary/CRON_SCHEDULE.md)** | Automation reference | 5 min |
| **[src/agent/tools/README.md](src/agent/tools/README.md)** | TypeScript tools | 10 min |

**Recommended reading order**: START_HERE → IMPLEMENTATION_SUMMARY → README_REVIEWS

---

## 🎯 How It Works

### Daily Review
1. Auto-runs weekdays at 9 AM
2. Processes new notes from vault
3. Extracts tasks → Todoist/Linear
4. Generates: `daily-summary/YYYY-MM-DD.md`

### Weekly Review
1. Auto-runs Fridays at 4 PM
2. Consolidates week's daily summaries
3. Identifies patterns and themes
4. Generates: `weekly-notes/YYYY-WWW.md`

### Product Review
1. Auto-runs 1st of month at 10 AM
2. Analyzes weekly notes for market signals
3. Extracts productization opportunities
4. Creates Linear issues for top ideas
5. Generates: `product-reviews/YYYY-MM-product-review.md`

---

## 💡 Usage Examples

### Capture an Insight
```markdown
## Customer Call Notes

Healthcare provider needs HIPAA-compliant AI training.
Cannot send patient data to cloud LLM providers.
Budget: $100K pilot, $1M+ production.

#Privacy #Enterprise

**Opportunity**: HIPAA-certified federated learning platform
**Market**: Healthcare AI (large enterprises)
**Next**: Interview 5 hospital CTOs, research compliance requirements
```

### Review Extracts This
- **Category**: Privacy + Enterprise
- **Opportunity**: HIPAA-certified federated learning
- **Market Size**: Large (healthcare enterprises)
- **Readiness**: MVP-ready
- **Competition**: Limited HIPAA-certified solutions
- **Creates**: Linear issue + Todoist research tasks

---

## 🔍 Check Status

### View Outputs
```bash
# Daily summaries
ls -lh "/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary/daily-summary/"

# Product reviews
ls -lh "/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary/product-reviews/"
```

### Check Logs
```bash
tail -f /tmp/claude-daily-review.log
tail -f /tmp/claude-product-review.log
```

### Verify Automation
```bash
crontab -l | grep claude
```

---

## 🛠️ Common Tasks

### Run Manual Review
```bash
/daily-review
/weekly-review
/product-review monthly
```

### Test Without Changes
```bash
DRY_RUN=true bun run review:daily
```

### Focus on Specific Sectors
Edit `scripts/product-review.ts`:
```typescript
const FOCUS_SECTORS = ["DevTools", "Privacy"];
```

### Change Review Times
```bash
crontab -e
# Modify time in cron expression
```

---

## 🐛 Troubleshooting

### Skills not working?
```bash
# Check files exist
ls -la ~/.claude/skills/*/SKILL.md

# Restart Claude Code
```

### Cron not running?
```bash
# Verify installation
crontab -l | grep claude

# Test manually
bun run review:daily

# Check logs
tail /tmp/claude-daily-review.log
```

### No opportunities found?
- Add weekly notes with tags: `#DevTools`, `#Privacy`
- Include market context in notes
- Run manually to debug: `/product-review monthly`

---

## 📖 Learn More

### Progressive Learning Path

1. **Quick Start** (5 min) - You are here!
2. **[IMPLEMENTATION_SUMMARY](IMPLEMENTATION_SUMMARY.md)** (10 min) - Complete overview
3. **[Skills Documentation](.claude/skills/SKILLS.md)** (20 min) - Progressive reveal
4. **[Product Review Guide](README_REVIEWS.md)** (15 min) - Market analysis
5. **[Full Methodology](../claude-summary/REVIEW_PLAN.md)** (30 min) - Deep dive

### By Use Case

**Want to run reviews manually?**
→ Read [Skills Documentation](.claude/skills/SKILLS.md)

**Want to automate everything?**
→ Read [CRON_SCHEDULE](../claude-summary/CRON_SCHEDULE.md)

**Want to build custom agents?**
→ Read [Agent Tools README](src/agent/tools/README.md)

**Want to understand product analysis?**
→ Read [README_REVIEWS](README_REVIEWS.md)

---

## ✅ Next Steps

1. ✅ **Test skills**: Run `/daily-review` in Claude Code
2. ✅ **Install automation**: Run `./scripts/setup-cron.sh`
3. ✅ **Tag your notes**: Add `#DevTools`, `#Privacy`, etc.
4. ✅ **Review outputs**: Check generated summaries
5. ✅ **Customize**: Edit scripts and prompts as needed

---

## 🎓 Key Concepts

**Skills** = Slash commands in Claude Code (`/daily-review`)
**Scripts** = TypeScript automation (`bun run review:daily`)
**Tools** = Agent SDK wrappers (programmatic use)
**Reviews** = Automated analysis outputs (daily/weekly/product)

---

*Ready to extract market insights from your notes? Start with `/daily-review`!*

