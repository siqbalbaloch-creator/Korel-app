# Soft Launch Playbook

This playbook defines the operational steps for a controlled soft launch.
Scope: operational discipline only. No product changes.

## Pre-Launch Checklist
- Build passes.
- DATABASE_URL is correct for the target environment.
- NEXTAUTH_SECRET is set in production.
- Postgres migration deployed (if cutover is in scope).
- rateLimit.store_initialized observed in dev logs.
- generation.persisted logs verified in a smoke run.
- No runtime.unhandled_error logs during smoke test.

## Smoke Test Script (Manual)
1. Create a test user.
2. Generate 3 Authority Packs.
3. Regenerate a LinkedIn variant.
4. Regenerate an X thread.
5. Submit a support ticket.
6. Publish a pack.
7. Verify dashboard stats update.
8. Verify admin analytics reflect activity.

## Failure Thresholds
- If >5% generation requests fail in 1 hour, pause acquisition.
- If extraction parse failures >3 consecutively, inspect prompt integrity.
- If REGEN_IN_PROGRESS spikes, investigate lock TTL and client behavior.
- If runtime.unhandled_error appears, immediate triage required.

## Rollback Triggers
- Corrupted packs detected.
- Repeated PACK_INCOMPLETE failures.
- DB write anomalies (missing rows, inconsistent counts).
- Memory spike events or repeated timeouts.

## First 50 User Discipline
- Do not scale ads.
- Monitor logs daily.
- Manually review 5 random packs per day.
- Track average generation duration.
- Track average quality score distribution.

## Safe Default Rate Limit Guidance
- Generation: 10/min per user (current default).
- Support: 5/hour.
- Regen: protected by lock.

Increase limits only after >100 active users and stable logs.

## No Scale Before Signal
Do NOT:
- Launch paid ads.
- Announce widely.
- Activate billing.

Until:
- 50 real users.
- <2% generation failure rate.
- No PACK_INCOMPLETE for 7 days.
- No runtime.unhandled_error in production logs.

## Weekly Diagnostics Reminder
- Run getLaunchDiagnosticsSummary() weekly and log the snapshot.

