# `@repo/provider`

The LLM boundary: `{ key, model, prompt }` in, structured `Review` out.

Calls any OpenAI-compatible `/v1/chat/completions` endpoint. The gateway is a
`baseUrl` (arg or `REFRACT_GATEWAY_URL`) — OmniRoute in dev, LiteLLM in prod,
no code change to switch.

```ts
import { review } from "@repo/provider";

const r = await review({ key, model: "anthropic/claude-sonnet-5", prompt });
```

`pnpm test` runs the parser unit tests (`node --test`).
