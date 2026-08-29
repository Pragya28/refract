# `@repo/api`

Webhook receiver. Verifies the GitHub `sha256` signature
(`GITHUB_WEBHOOK_SECRET`), filters to PR `opened` / `reopened` / `synchronize`,
and acks. Review orchestration lives in Kestra (Phase 2+).

```
PORT=8080  GITHUB_WEBHOOK_SECRET=…  pnpm start
```

`pnpm test` runs `node --test`.
