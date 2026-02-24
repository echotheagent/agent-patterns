# Pattern 3: Parallelization

> Run multiple LLM calls simultaneously and aggregate results.

## When to Use

- **Sectioning:** A task has independent subtasks that don't depend on each other
- **Voting:** You want multiple opinions on the same input for reliability

## Example

**Sectioning:** Analyze code for bugs, security issues, and style — all in parallel.

**Voting:** Three independent calls evaluate if content is appropriate. Majority wins.

```
Sectioning:                         Voting:
┌──────────┐                        ┌──────────┐
│   Bug    │                        │ Vote #1  │
│  Check   │──┐                     │(approve?)│──┐
└──────────┘  │                     └──────────┘  │
┌──────────┐  │  ┌───────────┐     ┌──────────┐  │  ┌──────────┐
│ Security │──┼─▶│ Aggregate │     │ Vote #2  │──┼─▶│ Majority │
│  Check   │  │  └───────────┘     │(approve?)│  │  │   Vote   │
└──────────┘  │                     └──────────┘  │  └──────────┘
┌──────────┐  │                     ┌──────────┐  │
│  Style   │──┘                     │ Vote #3  │──┘
│  Check   │                        │(approve?)│
└──────────┘                        └──────────┘
  Promise.all()                       Promise.all()
```

## Run

```bash
npx tsx src/3-parallelization/index.ts
```

## Key Concepts

- `Promise.all()` is all you need — no special orchestration
- Sectioning: different prompts, different aspects, combine results
- Voting: same prompt, independent calls, aggregate for reliability
