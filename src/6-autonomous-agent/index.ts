import Anthropic from "@anthropic-ai/sdk";
import { client, MODEL, getText } from "../lib/anthropic.js";

// ============================================================================
// Pattern 6: Autonomous Agent
//
// The most powerful pattern: a loop where the LLM decides which tools to use,
// gathers information, and stops when it's done. This is the idiomatic
// Anthropic agent pattern — the foundation of every AI agent.
//
// Example: A research agent with simulated tools that investigates a topic
// and writes a report.
// ============================================================================

const MAX_ITERATIONS = 15;

// ── Tool Definitions ───────────────────────────────────────────────────────
// These are the tools the agent can use. Each has a JSON schema describing
// its inputs. The model reads these schemas to understand what's available.

const tools: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Search the web for information. Returns a list of relevant results with titles and snippets.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a file from the workspace.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Path to the file to read",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file in the workspace.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Path to write the file to",
        },
        content: {
          type: "string",
          description: "Content to write to the file",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "done",
    description:
      "Signal that the task is complete. Call this when you have finished the research and written the report.",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: {
          type: "string",
          description: "Brief summary of what was accomplished",
        },
      },
      required: ["summary"],
    },
  },
];

// ── Simulated Tool Implementations ─────────────────────────────────────────
// In a real agent, these would call actual APIs / file systems.
// Here we simulate them to keep the example self-contained.

const fileSystem = new Map<string, string>();

function executeTool(
  name: string,
  input: Record<string, string>
): string {
  switch (name) {
    case "web_search": {
      // Simulated search results — in production, call a real search API
      console.log(`  🔍 Searching: "${input.query}"`);
      return JSON.stringify({
        results: [
          {
            title: `Understanding ${input.query} - Wikipedia`,
            snippet: `${input.query} is a widely studied topic. Recent research shows significant developments in this area, with key findings suggesting important implications for the field.`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(input.query)}`,
          },
          {
            title: `${input.query}: A Comprehensive Guide`,
            snippet: `This guide covers the fundamentals of ${input.query}, including history, current state, and future directions. Experts suggest three key areas of focus.`,
            url: `https://example.com/guide/${encodeURIComponent(input.query)}`,
          },
          {
            title: `Latest Research on ${input.query}`,
            snippet: `A 2024 study published in Nature found that ${input.query} has evolved considerably. The study highlights emerging trends and challenges.`,
            url: `https://nature.com/articles/${encodeURIComponent(input.query)}`,
          },
        ],
      });
    }

    case "read_file": {
      console.log(`  📖 Reading: ${input.path}`);
      const content = fileSystem.get(input.path);
      return content ?? `Error: File "${input.path}" not found.`;
    }

    case "write_file": {
      console.log(`  📝 Writing: ${input.path} (${input.content.length} chars)`);
      fileSystem.set(input.path, input.content);
      return `Successfully wrote ${input.content.length} characters to ${input.path}`;
    }

    case "done": {
      console.log(`  ✅ Done: ${input.summary}`);
      return "Task marked as complete.";
    }

    default:
      return `Error: Unknown tool "${name}"`;
  }
}

// ── The Agent Loop ─────────────────────────────────────────────────────────
// This is the core pattern. It's a simple while loop:
//   1. Send messages to the model (with tool definitions)
//   2. Check stop_reason
//   3. If tool_use: execute tools, append results, loop
//   4. If end_turn: we're done

async function main() {
  console.log("=== Autonomous Agent Demo: Research Agent ===\n");

  const TASK =
    "Research the current state of quantum computing and write a brief report to report.md";

  console.log(`Task: "${TASK}"\n`);

  // Conversation history — this accumulates as the agent works.
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: TASK },
  ];

  let iterations = 0;

  // ── THE LOOP ─────────────────────────────────────────────────────────
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`\n── Iteration ${iterations} ${"─".repeat(40)}`);

    // Send the full conversation to the model, with tools available.
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `You are a research agent. Your job is to research topics and write reports.
Use the available tools to search for information, then write your findings to a file.
Be thorough but concise. When you're done, call the "done" tool.`,
      messages,
      tools,
    });

    // Log what the model is thinking (text blocks)
    const textContent = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    if (textContent.length > 0) {
      console.log(`\n  💭 ${textContent.map((b) => b.text).join("\n  ")}`);
    }

    // ── Check stop reason ──────────────────────────────────────────────
    // "end_turn" = model is done talking, no tools called
    // "tool_use" = model wants to use one or more tools
    // "max_tokens" = response was truncated (rare with tool use)

    if (response.stop_reason === "end_turn") {
      console.log("\n  Agent finished (end_turn).");
      break;
    }

    // ── Execute tool calls ─────────────────────────────────────────────
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      console.log("\n  No tool calls and no end_turn. Stopping.");
      break;
    }

    // Append the assistant's response to conversation history.
    // This is critical — the model needs to see its own tool_use blocks
    // to understand the tool_result messages that follow.
    messages.push({ role: "assistant", content: response.content });

    // Execute each tool and build the tool_result message.
    const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
      (toolUse) => {
        const result = executeTool(
          toolUse.name,
          toolUse.input as Record<string, string>
        );
        return {
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: result,
        };
      }
    );

    // Append tool results as a user message.
    // This is the Anthropic format: tool results go in a "user" message.
    messages.push({ role: "user", content: toolResults });

    // Check if the agent called "done"
    const doneCall = toolUseBlocks.find((b) => b.name === "done");
    if (doneCall) {
      console.log("\n  Agent called done(). Task complete.");
      break;
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    console.log(`\n⚠ Safety valve: max iterations (${MAX_ITERATIONS}) reached.`);
  }

  // Show what the agent wrote
  console.log("\n" + "=".repeat(60));
  console.log("Files created by agent:");
  for (const [path, content] of fileSystem) {
    console.log(`\n── ${path} ${"─".repeat(50 - path.length)}`);
    console.log(content);
  }
}

main().catch(console.error);
