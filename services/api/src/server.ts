/**
 * Webhook receiver. Verifies the GitHub signature, filters to PR events worth
 * reviewing, and hands off. The actual review runs in Kestra (Phase 2+) — this
 * service only decides "is this a real review trigger" and forwards it.
 */
import { createServer, type IncomingMessage } from "node:http";
import { timingSafeEqual, createHmac } from "node:crypto";

const PORT = Number(process.env.PORT ?? 8080);
const SECRET = process.env.GITHUB_WEBHOOK_SECRET ?? "";
const REVIEW_ACTIONS = new Set(["opened", "reopened", "synchronize"]);

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Exported for testing. */
export function verifySignature(body: Buffer, header: string | undefined): boolean {
  if (!SECRET || !header) return false;
  const expected = "sha256=" + createHmac("sha256", SECRET).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Exported for testing. */
export function shouldReview(event: string | undefined, payload: { action?: string }): boolean {
  return event === "pull_request" && REVIEW_ACTIONS.has(payload.action ?? "");
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200).end("ok");
    return;
  }
  if (req.method !== "POST" || req.url !== "/webhook/github") {
    res.writeHead(404).end();
    return;
  }

  const body = await readBody(req);
  if (!verifySignature(body, req.headers["x-hub-signature-256"] as string | undefined)) {
    res.writeHead(401).end("bad signature");
    return;
  }

  const payload = JSON.parse(body.toString()) as {
    action?: string;
    number?: number;
    repository?: { owner: { login: string }; name: string };
  };
  const event = req.headers["x-github-event"] as string | undefined;

  if (!shouldReview(event, payload)) {
    res.writeHead(204).end();
    return;
  }

  // ponytail: log-and-ack for now; Phase 3 wires this to a Kestra webhook trigger.
  console.log(
    `review trigger: ${payload.repository?.owner.login}/${payload.repository?.name}#${payload.number}`,
  );
  res.writeHead(202).end("accepted");
});

if (import.meta.main) {
  server.listen(PORT, () => console.log(`api listening on :${PORT}`));
}
