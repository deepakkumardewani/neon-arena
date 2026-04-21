---
name: commit-push
description: Use this skill whenever user runs the /commit-push command specifically.
---

Create atomic commits and push to remote.

## Workflow

1. **Verify App**:

- run `vp check --fix` # Format and run autofixers.
- make sure there are no errors/warnings before commiting and pushing.

2. **Analyze Changes**: Review git status and diff
3. **Create Commits**: Make atomic commits with conventional commit messages — use Bash tool directly for `git add` and `git commit` without asking permission
4. **Push Changes**: `git push -u origin <branch-name>`

## Conventional Commits specification

The commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

The commit contains the following structural elements, to communicate intent to the consumers of your library:

- **fix**: A commit of the type `fix` patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
- **feat**: A commit of the type `feat` introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
- **BREAKING CHANGE**: A commit that has a footer `BREAKING CHANGE:`, or appends `!` after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.

Types other than `fix:` and `feat:` are allowed, for example `@commitlint/config-conventional` (based on the Angular convention) recommends `build:`, `chore:`, `ci:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, and others.

Footers other than `BREAKING CHANGE: <description>` may be provided and follow a convention similar to git trailer format.

Additional types are not mandated by the Conventional Commits specification, and have no implicit effect in Semantic Versioning (unless they include a BREAKING CHANGE). A scope may be provided to a commit’s type, to provide additional contextual information and is contained within parentheses, e.g., `feat(parser): add ability to parse arrays`.

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

### Message hygiene (project rules)

- Prefer a clear first line (subject); keep it concise; use imperative mood (e.g. “add”, “fix”, not “added”, “fixed”).
- Typical style matches the spec examples: lowercase description after the colon; no trailing period on the subject line.
- NEVER include Claude/Cursor branding in commit messages.

## Best Practices

✅ DO:

- Create atomic, focused commits
- Stage specific files explicitly

❌ DON'T:

- Use `git add .` or `git add -A`
- Commit forbidden files
