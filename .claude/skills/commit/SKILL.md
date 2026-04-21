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

The commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
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

### Examples

**Commit message with description and breaking change footer**

```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

**Commit message with `!` to draw attention to breaking change**

```
feat!: send an email to the customer when a product is shipped
```

**Commit message with scope and `!` to draw attention to breaking change**

```
feat(api)!: send an email to the customer when a product is shipped
```

**Commit message with both `!` and BREAKING CHANGE footer**

```
feat!: drop support for Node 6

BREAKING CHANGE: use JavaScript features not available in Node 6.
```

**Commit message with no body**

```
docs: correct spelling of CHANGELOG
```

**Commit message with scope**

```
feat(lang): add Polish language
```

**Commit message with multi-paragraph body and multiple footers**

```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```