import { chat, getText } from "../lib/anthropic.js";

// ============================================================================
// Pattern 4: Orchestrator-Workers
//
// An orchestrator LLM analyzes the task and dynamically decides what subtasks
// are needed. Worker LLMs execute each subtask in parallel. A final synthesis
// step combines the results.
//
// Key difference from Pattern 3 (Parallelization): the subtasks are NOT
// hardcoded. The orchestrator decides them based on the input.
//
// Example: Given a feature request, plan which files need changes and
// generate the code for each.
// ============================================================================

const FEATURE_REQUEST = `
Add a "dark mode" toggle to the settings page. It should:
- Add a toggle switch in the user settings UI
- Persist the preference to localStorage
- Apply a dark CSS theme when enabled
- Default to the user's OS preference
`;

interface Subtask {
  file: string;
  description: string;
  action: "create" | "modify";
}

async function main() {
  console.log("=== Orchestrator-Workers Demo ===\n");
  console.log(`Feature Request: ${FEATURE_REQUEST}`);

  // ── Step 1: Orchestrator determines subtasks ─────────────────────────────
  // The orchestrator's output is structured JSON — we parse it and use it
  // to spawn workers. This is what makes the pattern dynamic.

  console.log("Orchestrator: Analyzing feature request...\n");

  const planResponse = await chat({
    system: `You are a senior software architect. Given a feature request, determine 
which files need to be created or modified. Return ONLY a JSON array of objects, 
each with: "file" (path), "description" (what to do), "action" ("create" or "modify").

Example response:
[
  {"file": "src/theme.css", "description": "Add dark mode CSS variables", "action": "create"},
  {"file": "src/settings.ts", "description": "Add toggle handler", "action": "modify"}
]

Return valid JSON only. No markdown, no explanation.`,
    messages: [{ role: "user", content: FEATURE_REQUEST }],
    temperature: 0,
  });

  // Parse the orchestrator's plan.
  let subtasks: Subtask[];
  try {
    subtasks = JSON.parse(getText(planResponse));
  } catch {
    console.error("Failed to parse orchestrator output:", getText(planResponse));
    process.exit(1);
  }

  console.log(`Orchestrator identified ${subtasks.length} subtasks:`);
  for (const task of subtasks) {
    console.log(`  ${task.action === "create" ? "+" : "~"} ${task.file} — ${task.description}`);
  }
  console.log();

  // ── Step 2: Workers execute subtasks in parallel ─────────────────────────
  // Each worker gets a focused prompt for its specific file.
  // Workers don't know about each other — they work independently.

  console.log("Workers: Generating code in parallel...\n");

  const workerResults = await Promise.all(
    subtasks.map(async (task) => {
      const response = await chat({
        system: `You are a frontend developer. Generate code for the specified file.
Write clean, well-commented code. Return ONLY the file contents, no explanation.`,
        messages: [
          {
            role: "user",
            content: `Feature: ${FEATURE_REQUEST}\n\nFile: ${task.file}\nAction: ${task.action}\nTask: ${task.description}\n\nGenerate the file contents:`,
          },
        ],
        maxTokens: 1024,
      });
      return { file: task.file, code: getText(response) };
    })
  );

  // Display worker outputs
  for (const result of workerResults) {
    console.log(`── ${result.file} ${"─".repeat(50 - result.file.length)}`);
    console.log(result.code);
    console.log();
  }

  // ── Step 3: Synthesize results ───────────────────────────────────────────
  // A final LLM call reviews all the generated code and provides a summary.

  console.log("Synthesizer: Reviewing all changes...\n");

  const filesSummary = workerResults
    .map((r) => `### ${r.file}\n\`\`\`\n${r.code}\n\`\`\``)
    .join("\n\n");

  const synthesisResponse = await chat({
    system:
      "You are a code reviewer. Summarize the changes made, note any integration points between files, and flag any potential issues. Be concise.",
    messages: [
      {
        role: "user",
        content: `Feature: ${FEATURE_REQUEST}\n\nGenerated files:\n\n${filesSummary}\n\nProvide a brief implementation summary.`,
      },
    ],
  });

  console.log("Summary:\n" + getText(synthesisResponse));
}

main().catch(console.error);
