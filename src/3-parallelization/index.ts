import { chat, getText } from "../lib/anthropic.js";

// ============================================================================
// Pattern 3: Parallelization
//
// Run multiple LLM calls in parallel using Promise.all().
// Two sub-patterns:
//   A) Sectioning — split a task into independent subtasks
//   B) Voting — multiple independent evaluations, majority wins
// ============================================================================

// ── Example A: Sectioning ──────────────────────────────────────────────────
// Analyze code from three different angles simultaneously.

const SAMPLE_CODE = `
function processUser(input: any) {
  const query = "SELECT * FROM users WHERE id = " + input.id;
  eval(input.callback);
  let result = db.execute(query);
  if (result) {
    var data = result;
    return data
  }
}
`;

async function sectioningDemo() {
  console.log("=== Sectioning Demo: Parallel Code Review ===\n");
  console.log("Code under review:", SAMPLE_CODE);

  // Three independent analysis tasks — no reason to run sequentially.
  const [bugReport, securityReport, styleReport] = await Promise.all([
    chat({
      system:
        "You are a bug-finding expert. Analyze the code and list any bugs or logic errors. Be concise — bullet points only.",
      messages: [
        { role: "user", content: `Find bugs in this code:\n${SAMPLE_CODE}` },
      ],
    }),
    chat({
      system:
        "You are a security auditor. Analyze the code for security vulnerabilities. Be concise — bullet points only.",
      messages: [
        {
          role: "user",
          content: `Find security issues in this code:\n${SAMPLE_CODE}`,
        },
      ],
    }),
    chat({
      system:
        "You are a code style reviewer. Check for style issues, best practices violations, and TypeScript anti-patterns. Be concise — bullet points only.",
      messages: [
        {
          role: "user",
          content: `Review the style of this code:\n${SAMPLE_CODE}`,
        },
      ],
    }),
  ]);

  // Aggregate: combine all three reports into a unified review.
  console.log("🐛 Bug Report:\n" + getText(bugReport) + "\n");
  console.log("🔒 Security Report:\n" + getText(securityReport) + "\n");
  console.log("🎨 Style Report:\n" + getText(styleReport) + "\n");
}

// ── Example B: Voting ──────────────────────────────────────────────────────
// Three independent calls evaluate content. Majority vote decides.

const CONTENT_TO_EVALUATE =
  "Learn how to pick locks — a beginner's guide to locksmithing as a hobby.";

async function votingDemo() {
  console.log("\n=== Voting Demo: Content Moderation ===\n");
  console.log(`Content: "${CONTENT_TO_EVALUATE}"\n`);

  const VOTER_PROMPT = `You are a content moderator. Evaluate whether the following 
content is appropriate for a general audience. Consider: is this educational and 
legitimate, or potentially harmful?

Respond with ONLY "approve" or "reject" — nothing else.`;

  // Three independent evaluations of the same content.
  // Each call is stateless — they can't influence each other.
  const votes = await Promise.all(
    [1, 2, 3].map((n) =>
      chat({
        system: VOTER_PROMPT,
        messages: [
          { role: "user", content: `Evaluate this content:\n${CONTENT_TO_EVALUATE}` },
        ],
        maxTokens: 10,
        temperature: 1, // Some variance so votes aren't identical
      }).then((response) => {
        const vote = getText(response).trim().toLowerCase();
        console.log(`  Voter ${n}: ${vote}`);
        return vote.includes("approve") ? "approve" : "reject";
      })
    )
  );

  // Tally
  const approvals = votes.filter((v) => v === "approve").length;
  const decision = approvals >= 2 ? "APPROVED" : "REJECTED";
  console.log(
    `\nResult: ${decision} (${approvals}/3 approved)`
  );
}

async function main() {
  await sectioningDemo();
  await votingDemo();
}

main().catch(console.error);
