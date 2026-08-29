# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Refract is a GitHub PR review agent: static analysis (containerized linters) for *what*,
an LLM for *why and how to fix*. Bring-your-own-key with a rate-limited free fallback.
The build is deliberately staged — a fragile script first, then Kestra workflows, then
reliability, then scale, then a hosted product. See `central-docs/` (symlink to an
external Obsidian vault, git-ignored) for the full phase plan and architecture notes.

Current state: **Phase 0** — monorepo shell. Only `apps/web` (stock Next.js starter),
`packages/provider`, and `services/api` exist. Most of the system (Kestra workflows,
linter containers, `scripts/review.py`, auth, DB) is not built yet.

## Commands

```sh
pnpm install
pnpm dev            # turbo: runs web + api together
pnpm test           # turbo: all workspace tests
pnpm lint
pnpm check-types
pnpm format         # prettier --write on ts/tsx/md
```

Scope to one workspace with `--filter`: `pnpm --filter @repo/api test`, `pnpm --filter web dev`.

Tests are **`node --test`**, no framework. Run one file: `cd services/api && node --test src/server.test.ts`.
Run one test by name: `node --test --test-name-pattern="ignores other" src/server.test.ts`.

Node 24+ required — source is `.ts` run directly (native type stripping, no build step for
`provider`/`api`). `apps/web` builds with Next.

## Architecture

**`packages/provider` is the load-bearing boundary.** It is the *only* code that talks to
an LLM: `review({ key, model, prompt })` → structured `Review`. It calls a generic
OpenAI-compatible `/v1/chat/completions` endpoint, so switching gateways (OmniRoute in
dev → LiteLLM in prod) is a `baseUrl` / `REFRACT_GATEWAY_URL` change and never a code
change. Both `apps/web` and `services/api` import it. Keep it that way — do not scatter
LLM calls or provider-specific logic elsewhere.

**`services/api`** is a thin `node:http` webhook receiver. It verifies the GitHub
`sha256` HMAC (`GITHUB_WEBHOOK_SECRET`), filters to PR `opened`/`reopened`/`synchronize`,
and acks. It does **not** run reviews — orchestration (fetch diff, run linters, call
provider, post comment, retries, concurrency) belongs in Kestra flows under
`workflows/kestra/` (Phase 2+). `server.listen` is guarded by `import.meta.main` so the
module is importable in tests.

**`apps/web`** is the untouched `create-turbo` starter today; the product UI (Clerk auth,
Supabase, dashboard) is Phase 5.

### Monorepo conventions

- Workspaces: `apps/*`, `packages/*`, `services/*` (pnpm-workspace.yaml). Package names are
  `@repo/*` by create-turbo convention; internal deps use `"workspace:*"`.
- Shared config packages: `@repo/typescript-config` (extend its base/nextjs/react-library
  jsons), `@repo/eslint-config` (flat config, `only-warn` plugin — `lint` runs with
  `--max-warnings 0`).
- New backend service or shared lib: `turbo gen workspace -n @repo/<name> -t package -d <dir> -b`,
  then add source, tsconfig, and deps by hand (the generator only emits a skeleton).
- turbo tasks: `build` (`^build`), `test` (`^build`), `lint`/`check-types` (`^…`), `dev`
  (no cache, persistent).

## Working style

Global user rules in `~/.claude/CLAUDE.md` apply and are strict: ask before running
build/lint/test or any shell command, before installing packages, and before touching
files outside the stated scope; prefer `str_replace` edits scoped to the named
function; don't scan the whole codebase unprompted.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.
