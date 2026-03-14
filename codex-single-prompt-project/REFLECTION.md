# Reflection

Working with an AI coding agent was most valuable in the setup-heavy parts of this assignment: scaffolding a strict TypeScript monorepo, keeping both packages aligned to a ports-and-adapters structure, and generating the repeated repository and UI plumbing quickly. That let more time go into validating the actual FuelEU rules, database behavior, and tests instead of spending it on boilerplate.

The main lesson was that speed only pays off when paired with aggressive verification. The first implementation pass was close, but it still contained issues that only showed up once the real PostgreSQL database, HTTP routes, and frontend tests were exercised. Fixing those issues was straightforward because the architecture was already separated cleanly, but it reinforced that AI output is a draft, not a final answer.

Next time, I would spend a bit more time earlier on domain examples and scenario tables for banking and pooling before generating as much code. That would reduce the number of test refinements needed later. Even so, the overall efficiency gain was significant: the agent accelerated implementation, while manual review and execution kept correctness under control.
