# Pattern 2: Routing

> Classify input and dispatch it to a specialized handler.

## When to Use

- Different inputs require fundamentally different handling
- You want specialized prompts/personas for each category
- A single monolithic prompt would be too complex or unfocused

## Example

A customer support router that:

1. **Classifies** an incoming message as `general`, `refund`, or `technical`
2. **Routes** to a specialized prompt with a different persona and instructions

```
                    ┌─────────────┐
                    │  Classifier │
                    │   (LLM)     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ General  │ │  Refund  │ │Technical │
        │ Handler  │ │ Handler  │ │ Handler  │
        └──────────┘ └──────────┘ └──────────┘
           LLM          LLM          LLM
```

## Run

```bash
npx tsx src/2-routing/index.ts
```

## Key Concepts

- Classification is its own LLM call with a constrained output format
- A simple `switch` statement in TypeScript does the routing — no framework needed
- Each route gets a tailored system prompt, so the model can be an expert at one thing
