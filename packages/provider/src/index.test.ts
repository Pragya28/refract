import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReview } from "./index.ts";

test("parses a plain JSON review", () => {
  const r = parseReview(
    '{"summary":"ok","issues":[],"verdict":"approve"}',
  );
  assert.equal(r.verdict, "approve");
});

test("tolerates ```json fences", () => {
  const r = parseReview(
    '```json\n{"summary":"s","issues":[{"severity":"CRITICAL","message":"leaked key"}],"verdict":"request_changes"}\n```',
  );
  assert.equal(r.issues[0]?.severity, "CRITICAL");
});

test("rejects a malformed object", () => {
  assert.throws(() => parseReview('{"summary":"x"}'));
});
