# scripts/

`review.py` (Phase 1): the deliberately fragile baseline — fetch a PR diff, send to the
LLM with basic guidelines, print a structured review. Kept for reference after the Kestra
rebuild so the failure modes it exposes stay documented.

Reads all tokens from the environment (see `.env.example`). Nothing hardcoded.
