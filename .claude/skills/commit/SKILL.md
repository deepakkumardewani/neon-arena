---
name: commit
description: Run before every git commit. Ensures each commit is atomic, clean, tested, and properly messaged.
---

# Commit

## Pre-Commit Checklist

Run through these in order. Do not commit if any step fails.

```bash
# 1. Review exactly what you're committing
git diff --staged

# 2. Check for accidentally staged secrets
git diff --staged | grep -i "password\|secret\|api_key\|token\|private_key"

# 3. Format, lint, type-check
vp check --fix

# 4. All tests must pass — new and existing
vp test
```

All six must be clean before committing. If any fail, fix and re-run from that step.

## Commit Message Format

```
<type>(<scope>): <short description>
```

**Types:**
- `feat` — new feature or behavior
- `fix` — bug fix
- `refactor` — restructuring with no behavior change
- `test` — adding or updating tests
- `chore` — config, deps, tooling

**Examples:**
```
feat(quiz): add GSAP flip animation to FlashCard component
fix(parser): handle unbalanced parentheses in formula input
test(usePropertyColor): add branch coverage for all 7 color modes
refactor(DetailModal): extract tab layout into DetailTabs component
chore: update vite to 5.4.2
```

Keep the description under 72 characters. No period at the end.

## Atomicity Rules

Each commit must do **one logical thing**. Before committing, ask:

- Does this commit mix a feature with a refactor? → Split it.
- Does this commit mix implementation with unrelated cleanup? → Split it.
- Does this commit include a behavior change AND a formatting change? → Split it.

If you noticed something worth fixing outside the task scope while implementing, do NOT include it in this commit. Note it instead:

```
NOTICED BUT NOT INCLUDED:
- src/utils/format.ts has an unused import (unrelated to this task)
→ Create a follow-up task if worth fixing
```