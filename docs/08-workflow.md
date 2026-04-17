# 08 — Multi-Agent Workflow

## Daily flow

1. **Orchestrator** reads the roadmap, picks the next slice of work.
2. Slice is broken into `TASK-###` cards (one per agent lane).
3. Each agent claims its task, branches, codes, opens PR, waits for review.
4. QA agent runs the test matrix on every PR.
5. Orchestrator merges in dependency order.

## Branch model

- `main` — always deployable. Auto-deployed to production on merge.
- `develop` — integration. Auto-deployed to staging.
- Feature branches off `develop`. Merge back via PR with green CI.
- Hotfixes off `main`, merged to both `main` and `develop`.

## PR requirements

- Title: `<type>(<scope>): <short>` — e.g., `feat(cart): apply coupon endpoint`.
- Description sections: **What**, **Why**, **Test plan**, **Screenshots** (if UI).
- Linked task ID(s).
- All checks green: typecheck, lint, unit, integration, e2e (smoke), bundle size.
- 1 reviewer from owning agent + 1 cross-lane reviewer for shared files.

## Cross-agent coordination

When agent A needs work from agent B before it can finish:

1. Agent A pauses, opens an `ASK-###` card describing what it needs (signature, behavior).
2. Agent B implements, posts the merged commit SHA + symbol path.
3. Agent A resumes against the new symbol.

Never block on undocumented assumptions. If you don't know the shape, ask.

## Type-first protocol

Before implementing a new endpoint or component:

1. Define the type in `src/types/api/<domain>.ts` and merge.
2. Backend implements against the type.
3. Frontend implements against the same type.

This lets both lanes proceed in parallel without integration thrash.

## Conflict resolution

- File conflict → orchestrator splits along helper boundaries.
- Decision conflict → reread `docs/04-contracts.md`. If silent there, escalate to user, then write the resolution back into contracts.
- Style/convention conflict → defer to `docs/07-coding-standards.md`. If silent there, the first PR sets the precedent and the standard doc is updated in the same PR.

## Definition of done

A task is done when:

- All acceptance bullets pass.
- Unit + integration tests added.
- Types exported and documented in the contract file if new.
- No new `any`, no commented-out code, no `TODO` without an issue link.
- Bundle size delta reported (frontend tasks).
- Updates `docs/` if the change affects another lane.
- Updates `MEMORY.md` (orchestrator only) if the change is a load-bearing decision.

## Rollback

Production issue → `git revert <sha>` on `main`, deploy. Postmortem within 48h, written under `docs/postmortems/<YYYY-MM-DD>-<slug>.md`.

## Communication

- Lane reports go in PR descriptions, not chat.
- Orchestrator keeps a running `WORKLOG.md` (gitignored, local) of decisions for the next session.

## Escalation to user

Escalate only when:

- A locked contract needs to change.
- A roadmap milestone slips by >1 week.
- A security or data-loss risk is found.
- Two agents disagree and contracts are silent.
