<!--
Title format: <type>(<scope>): <short>
Example:       feat(frontend/pdp): shade selector with swatch previews
-->

## What

<!-- One paragraph describing the change at the capability level. -->

## Why

<!-- Link to task/issue and the contract section that motivates this. -->

- Closes #
- Contract: `docs/04-contracts.md` §

## Agent lane

- [ ] frontend
- [ ] backend
- [ ] database
- [ ] security
- [ ] devops
- [ ] qa

## How

<!-- Brief technical notes only when non-obvious. Skip if the diff speaks for itself. -->

## Test plan

- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E smoke covers this flow (or rationale why not)
- [ ] Manual verification steps:
  - [ ]
  - [ ]

## Blast radius

- **Files changed:**
- **New migrations:** yes / no
- **Cross-lane impact:** none / describe
- **Breaking change:** no / yes (explain migration path)
- **Bundle delta (frontend):**
- **New env var:** no / yes (documented in `docs/13-env-vars.md`)
- **New dependency:** no / yes (justification)

## Screenshots / recording

<!-- Required for UI changes. Include before/after. -->

## Checklist

- [ ] Branch named `<type>/<agent>-<scope>-<short>`
- [ ] Conventional Commits throughout
- [ ] Stayed in my agent lane (or explicit cross-lane approval)
- [ ] No secrets committed
- [ ] No new `any` without rationale comment
- [ ] No commented-out code
- [ ] Docs updated if contract or cross-lane behavior changed
- [ ] `MEMORY.md` pointer updated (orchestrator only, if decision is load-bearing)
