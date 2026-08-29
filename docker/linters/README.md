# docker/linters/

One Dockerfile per language linter, run as container tasks from Kestra flows (Phase 4).
Linter output is fed to the LLM as fact — the model does judgement, not detection.

- `ruff.Dockerfile` — Python
- `eslint.Dockerfile` — JS/TS
- `clippy.Dockerfile` — Rust

Each image takes a checked-out repo at the PR head commit on a mounted volume, runs the
linter, writes machine-readable output (JSON) to stdout.
