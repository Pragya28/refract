# AGENTS.md

How to run linters and quality checks in this repo. Also see `CLAUDE.md` for architecture.

## Whole repo

```sh
pnpm install
pnpm lint          # turbo run lint across all workspaces
pnpm check-types   # tsc / next typegen across all workspaces
pnpm test          # turbo run test (node --test)
pnpm format        # prettier --write **/*.{ts,tsx,md}
```

Scope to one workspace: `pnpm --filter <name> <script>` (names: `web`, `@repo/ui`,
`@repo/provider`, `@repo/api`).

## Per workspace

| Workspace | lint | types | test |
|---|---|---|---|
| `apps/web` | `eslint --max-warnings 0` | `next typegen && tsc --noEmit` | — |
| `packages/provider` | `eslint . --max-warnings 0` | `tsc --noEmit` | `node --test` |
| `services/api` | `eslint . --max-warnings 0` | `tsc --noEmit` | `node --test` |
| `packages/ui` | `eslint . --max-warnings 0` | `tsc --noEmit` | — |

Single test file: `cd services/api && node --test src/server.test.ts`.
Single test by name: `node --test --test-name-pattern="<substring>" <file>`.

ESLint is flat-config from `@repo/eslint-config`; it uses `eslint-plugin-only-warn`, so
warnings never fail on their own — `--max-warnings 0` is what makes `lint` fail.

## Target-code linters (Phase 4)

The linters Refract *runs against reviewed PRs* (ruff, eslint, clippy) are containerized
under `docker/linters/` and invoked from Kestra flows, not from this repo's own tooling.
