# Pattern 5: Evaluator-Optimizer

> Generate content, evaluate it, and iteratively refine until quality threshold is met.

## When to Use

- Output quality can be objectively evaluated
- Iterative refinement produces measurably better results
- You want to separate the "creative" and "critical" roles

## Example

Write a haiku, evaluate it (0-10 score + critique), refine, repeat until score ≥ 8 or max iterations.

```
┌───────────┐     ┌───────────┐
│ Generator │────▶│ Evaluator │
│  (LLM)    │◀────│  (LLM)    │
└───────────┘     └───────────┘
     │  ▲              │
     │  └──────────────┘
     │    loop until score ≥ 8
     ▼     or max iterations
┌───────────┐
│   Done!   │
└───────────┘
```

## Run

```bash
npx tsx src/5-evaluator-optimizer/index.ts
```

## Key Concepts

- Generator and evaluator are separate LLM calls with different system prompts
- Evaluator returns structured feedback (score + critique) for programmatic decisions
- The loop is a simple `while` — nothing fancy, just iterate until done
- Max iterations prevent infinite loops if the model can't satisfy the evaluator
