# Pattern 4: Orchestrator-Workers

> An orchestrator LLM dynamically determines subtasks and delegates to worker LLMs.

## When to Use

- Subtasks can't be predicted ahead of time — they depend on the input
- You need flexible decomposition that adapts to each request
- Different subtasks may require different approaches

## Example

Given a feature request, an orchestrator:

1. Analyzes the request and decides which files need to be created/modified
2. Spawns parallel worker LLMs, one per file
3. Synthesizes all worker outputs into a summary

```
┌──────────────┐
│ Orchestrator │ ← analyzes feature request
│   (LLM)      │ → returns JSON list of subtasks
└──────┬───────┘
       │ dynamic — not hardcoded!
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│  Worker 1  │ │  Worker 2  │ │  Worker N  │
│ (file A)   │ │ (file B)   │ │ (file N)   │
└──────┬─────┘ └──────┬─────┘ └──────┬─────┘
       │              │              │
       └──────────────┼──────────────┘
                      ▼
              ┌──────────────┐
              │  Synthesizer │ ← combines all outputs
              │    (LLM)     │
              └──────────────┘
```

## Run

```bash
npx tsx src/4-orchestrator-workers/index.ts
```

## Key Concepts

- The orchestrator returns structured JSON — parsed programmatically
- Workers run in parallel via `Promise.all()` — same as Pattern 3
- The difference from Pattern 3: tasks are **dynamic**, determined by the LLM
