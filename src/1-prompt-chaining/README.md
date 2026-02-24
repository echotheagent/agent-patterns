# Pattern 1: Prompt Chaining

> Decompose a task into fixed sequential steps, where each step's output feeds into the next.

## When to Use

- The task naturally breaks into distinct, sequential subtasks
- You want to trade latency for higher quality at each step
- You need programmatic **gates** between steps (validation, checks)

## Example

This demo generates a blog post in three steps:

1. **Outline** — Ask Claude to produce a structured outline for a blog post
2. **Gate** — Programmatically verify the outline has 3+ sections (no LLM needed)
3. **Write** — Feed the validated outline into a second call to write the full post

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Generate │────▶│   Gate   │────▶│  Write   │
│  Outline │     │ (3+ sec?)│     │ Full Post│
└──────────┘     └──────────┘     └──────────┘
     LLM          Code check          LLM
```

## Run

```bash
npx tsx src/1-prompt-chaining/index.ts
```

## Key Concepts

- Each LLM call is a separate `messages.create()` — no magic, just sequential calls
- The gate is plain TypeScript: parse the output, check a condition, bail if it fails
- Output from step 1 becomes part of the prompt for step 2
