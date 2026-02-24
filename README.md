# Agent Patterns — TypeScript × Anthropic SDK

> Every pattern from Anthropic's ["Building Effective Agents"](https://www.anthropic.com/engineering/building-effective-agents) — implemented from scratch.

No frameworks. No abstractions. Just the raw Anthropic SDK and clear, readable TypeScript showing exactly how each pattern works.

## Patterns

| # | Pattern | When to Use | Run |
|---|---------|-------------|-----|
| 1 | [Prompt Chaining](src/1-prompt-chaining/) | When a task decomposes into fixed sequential steps | `npx tsx src/1-prompt-chaining/index.ts` |
| 2 | [Routing](src/2-routing/) | When input needs to be classified and handled differently | `npx tsx src/2-routing/index.ts` |
| 3 | [Parallelization](src/3-parallelization/) | When subtasks can run independently (sectioning or voting) | `npx tsx src/3-parallelization/index.ts` |
| 4 | [Orchestrator-Workers](src/4-orchestrator-workers/) | When subtasks aren't known upfront and must be determined dynamically | `npx tsx src/4-orchestrator-workers/index.ts` |
| 5 | [Evaluator-Optimizer](src/5-evaluator-optimizer/) | When iterative refinement measurably improves output | `npx tsx src/5-evaluator-optimizer/index.ts` |
| 6 | [Autonomous Agent](src/6-autonomous-agent/) | When tasks require flexible, multi-step tool use with model-driven decisions | `npx tsx src/6-autonomous-agent/index.ts` |

## Prerequisites

- **Node.js 18+**
- **Anthropic API key** — set `ANTHROPIC_API_KEY` in your environment

## Quick Start

```bash
git clone https://github.com/echotheagent/agent-patterns.git
cd agent-patterns
npm install
export ANTHROPIC_API_KEY="your-key-here"

# Run any pattern:
npx tsx src/1-prompt-chaining/index.ts
```

## Structure

```
src/
├── lib/anthropic.ts              — shared client + helpers
├── 1-prompt-chaining/            — sequential steps with gates
├── 2-routing/                    — classify → dispatch
├── 3-parallelization/            — Promise.all() sectioning & voting
├── 4-orchestrator-workers/       — dynamic subtask delegation
├── 5-evaluator-optimizer/        — generate → evaluate → refine loop
└── 6-autonomous-agent/           — full tool-use agent loop
```

## Credits

Based on Anthropic's [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) research post. All implementations use the [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript).
