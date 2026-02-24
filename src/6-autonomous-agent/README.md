# Pattern 6: Autonomous Agent

> A model-driven loop where the LLM decides which tools to call and when to stop.

## When to Use

- Tasks require flexible, multi-step reasoning
- The number of steps and which tools to use can't be predetermined
- The model needs to gather information and act on it iteratively

## Example

A research agent that can search the web (simulated), read files, write files, and decide when it's done. Given a research question, it autonomously gathers information and writes a report.

```
┌─────────────────────────────────────────────┐
│                  Agent Loop                  │
│                                              │
│  ┌─────────┐    ┌──────────────┐            │
│  │  Send    │───▶│ Check        │            │
│  │ messages │    │ stop_reason  │            │
│  └─────────┘    └──────┬───────┘            │
│                        │                     │
│              ┌─────────┼──────────┐          │
│              ▼         ▼          ▼          │
│         end_turn   tool_use   max_tokens     │
│           │         │             │          │
│           ▼         ▼             ▼          │
│         Done!   Execute tool   Continue      │
│                 Feed result                   │
│                 back to LLM                   │
│                     │                         │
│                     └── loop ──▶              │
└─────────────────────────────────────────────┘
```

## Run

```bash
npx tsx src/6-autonomous-agent/index.ts
```

## Key Concepts

- **Tool definitions** with JSON schemas — the model knows what's available
- **The agent loop:** send → check `stop_reason` → execute tools → feed results back
- **Tool result messages** — the exact format Anthropic expects
- **Safety valve** — max iterations prevents runaway loops
- This is THE idiomatic pattern for Anthropic tool use
