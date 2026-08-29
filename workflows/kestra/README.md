# workflows/kestra/

Kestra flow definitions (YAML), one namespace: `refract`.

- Phase 2: manual-trigger review flow — inputs `owner`, `repo`, `pr`; guidelines as a
  flow input, not baked in. Fetch PR files + metadata, LLM completion, GitHub comment,
  skip when no issues.
- Phase 3: webhook trigger, retries + timeouts, concurrency (one review per PR, cancel
  stale), failure notification.
- Phase 4: per-file parallel review, skip list, containerized linters from
  `docker/linters/`, merge into one severity-sorted comment.

Secrets via Kestra `secret()` — never inline. Local Kestra runs via the repo
`docker-compose.yml` at http://localhost:8081.
