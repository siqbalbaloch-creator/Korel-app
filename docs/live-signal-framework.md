# Live Signal Framework (30-Day Validation)

This document defines how we evaluate real usage during soft launch and how we decide what to improve.
Scope: operational discipline only. No product changes.

## Core Metrics (Weekly Review Required)
- Packs per user (median, not average)
- Percent of users who regenerate at least once
- Quality score distribution (bucketed: <60, 60?80, >80)
- Publish rate (percent of packs published)
- Support tickets per 10 users
- Generation failure rate (percent)
- Regen failure rate (percent)

## Secondary Metrics (Context Only)
- Total users
- Total packs
- Page views
- Session duration

Secondary metrics do NOT drive roadmap decisions.

## Decision Discipline
- Do not add features based on 1 user request.
- Require a pattern across at least 5 users.
- If median packs per user <2 after 2 weeks, investigate output sharpness, not new features.
- If publish rate <30%, improve authority clarity, not platform expansion.
- If regen rate <40%, review hook strength and initial output quality.
- If support tickets spike, prioritize stability over new ideas.

## 30-Day Soft Launch Roadmap
Week 1:
- Monitor stability only.
- Do not change prompts.

Week 2:
- Review output samples.
- Adjust tone only if clear AI smell is detected.

Week 3:
- Evaluate retention signals.
- Adjust regeneration heuristics if needed.

Week 4:
- Decide:
  - Tighten positioning
  - Or introduce first controlled paid tier (if business ready)

## Anti-Scope-Creep Rules
Do NOT add:
- New social platforms
- Analytics dashboards
- Collaboration
- Export formats
- Chat interface
- ?Idea generator? features

Unless:
- 50+ users
- Stable retention
- Clear revenue signal

## Weekly Founder Review Template
- Stability Summary
- Usage Summary
- Output Quality Review (5 random packs)
- Regeneration Patterns
- Support Themes
- Decision (Hold / Tighten / Adjust prompts only)
