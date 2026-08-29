import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldReview } from "./server.ts";

test("reviews PR opened/reopened/synchronize", () => {
  for (const action of ["opened", "reopened", "synchronize"]) {
    assert.equal(shouldReview("pull_request", { action }), true);
  }
});

test("ignores other PR actions and other events", () => {
  assert.equal(shouldReview("pull_request", { action: "labeled" }), false);
  assert.equal(shouldReview("push", { action: "opened" }), false);
});
