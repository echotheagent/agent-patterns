import { chat, getText } from "../lib/anthropic.js";

// ============================================================================
// Pattern 1: Prompt Chaining
//
// A task is broken into sequential steps. Each step is a separate LLM call.
// Between steps, we can insert programmatic "gates" — checks that validate
// the output before passing it to the next step.
//
// Example: Generate a blog post outline → validate it → write the full post.
// ============================================================================

const TOPIC = "Why TypeScript is great for building AI agents";

async function main() {
  console.log("=== Prompt Chaining Demo ===\n");
  console.log(`Topic: "${TOPIC}"\n`);

  // ── Step 1: Generate an outline ──────────────────────────────────────────
  console.log("Step 1: Generating outline...\n");

  const outlineResponse = await chat({
    system:
      "You are a technical blog writer. When asked for an outline, respond with a numbered list of section titles. Each section should be on its own line, formatted as: 1. Section Title",
    messages: [
      {
        role: "user",
        content: `Create an outline for a blog post about: "${TOPIC}". Include 4-6 sections. Just the numbered section titles, nothing else.`,
      },
    ],
  });

  const outline = getText(outlineResponse);
  console.log("Outline:\n" + outline + "\n");

  // ── Gate: Validate the outline has enough sections ───────────────────────
  // This is a PROGRAMMATIC check — no LLM needed. This is the power of
  // prompt chaining: you can insert arbitrary code between LLM calls.

  const sections = outline
    .split("\n")
    .filter((line) => /^\d+[\.\)]/.test(line.trim()));

  console.log(`Gate: Found ${sections.length} sections.`);

  if (sections.length < 3) {
    console.error("✗ Gate failed: outline has fewer than 3 sections. Aborting.");
    process.exit(1);
  }

  console.log("✓ Gate passed: outline has 3+ sections.\n");

  // ── Step 2: Write the full post using the outline ────────────────────────
  // The output of Step 1 (the outline) becomes input to Step 2.
  // This is the core idea: chain outputs → inputs.

  console.log("Step 2: Writing full blog post from outline...\n");

  const postResponse = await chat({
    system:
      "You are a technical blog writer. Write engaging, informative content. Use markdown formatting.",
    messages: [
      {
        role: "user",
        content: `Write a blog post about "${TOPIC}" following this outline exactly:\n\n${outline}\n\nWrite 1-2 paragraphs per section. Be concise but insightful.`,
      },
    ],
    maxTokens: 2048,
  });

  const post = getText(postResponse);
  console.log("Final Blog Post:\n");
  console.log(post);
}

main().catch(console.error);
