# AI Agent Workflow Log

## Agents Used

- OpenAI Codex in the local repo workspace

## Prompts & Outputs

- Example 1 prompt:
  `Complete this full-stack assignment end-to-end in the current folder...`
  Output:
  scaffolded the monorepo, backend/frontend packages, hexagonal structure, database scripts, UI, and tests.

- Example 2 refinement prompt:
  internal follow-up refinement around failing tests and local verification
  Output:
  corrected the compliance-balance expectation, adjusted the pool integration test to use a valid pool payload, and fixed frontend test selectors after duplicate text collisions.

## Validation / Corrections

- Verified git remote access before implementation.
- Installed dependencies and ran the actual PostgreSQL bootstrap instead of assuming setup worked.
- Ran `npm test` repeatedly and corrected failures until both backend and frontend suites passed.
- Verified the database existed, then re-ran schema and seed in the right order after an early race condition.
- Performed local run checks against backend health and the frontend dev server before finishing.

## Observations

- The agent saved time on repetitive scaffolding, repository wiring, and test harness setup.
- The first pass still needed correction on expected numeric values and one unrealistic integration-test scenario.
- Runtime validation was essential; the main mistakes surfaced only after the real DB and test suite ran.

## Best Practices Followed

- Kept business logic in use-cases and ports rather than Express or React layers.
- Used incremental verification after each significant implementation stage.
- Corrected generated code with real execution results rather than trusting the first output.
- Documented assumptions and preserved a clear commit history with milestone pushes.

