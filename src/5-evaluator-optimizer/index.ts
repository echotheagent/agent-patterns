import { chat, getText } from "../lib/anthropic.js";

// ============================================================================
// Pattern 5: Evaluator-Optimizer
//
// A generator LLM creates content. An evaluator LLM critiques it with a
// structured score + feedback. The generator refines based on the critique.
// Loop until the score is good enough or we hit max iterations.
//
// Example: Write a haiku, evaluate, refine, repeat.
// ============================================================================

const HAIKU_TOPIC = "the mass extinction of insects";
const SCORE_THRESHOLD = 8;
const MAX_ITERATIONS = 4;

interface Evaluation {
  score: number;
  critique: string;
  suggestions: string;
}

async function generate(
  topic: string,
  previousAttempt?: string,
  feedback?: string
): Promise<string> {
  const messages: { role: "user"; content: string }[] = [];

  if (previousAttempt && feedback) {
    // Refinement: include the previous attempt and the evaluator's feedback
    messages.push({
      role: "user",
      content: `Write a haiku about: "${topic}"

Your previous attempt:
${previousAttempt}

Evaluator feedback:
${feedback}

Write an improved haiku. Return ONLY the three lines of the haiku.`,
    });
  } else {
    // First attempt
    messages.push({
      role: "user",
      content: `Write a haiku about: "${topic}". Return ONLY the three lines of the haiku.`,
    });
  }

  const response = await chat({
    system: `You are a master poet specializing in haiku. A haiku has three lines 
with 5-7-5 syllable structure. Focus on vivid imagery and emotional resonance. 
Return ONLY the haiku — no titles, no explanation.`,
    messages,
    temperature: 1,
  });

  return getText(response).trim();
}

async function evaluate(haiku: string, topic: string): Promise<Evaluation> {
  const response = await chat({
    system: `You are a poetry critic specializing in haiku. Evaluate the haiku on:
1. Syllable structure (5-7-5)
2. Imagery and evocativeness
3. Relevance to the topic
4. Emotional impact

Respond in EXACTLY this JSON format:
{"score": <0-10>, "critique": "<brief critique>", "suggestions": "<specific improvements>"}

Be a tough but fair critic. Score 8+ means genuinely excellent.
Return valid JSON only.`,
    messages: [
      {
        role: "user",
        content: `Topic: "${topic}"\n\nHaiku:\n${haiku}`,
      },
    ],
    temperature: 0,
  });

  try {
    return JSON.parse(getText(response));
  } catch {
    // If parsing fails, return a low score to trigger another iteration
    return { score: 0, critique: "Could not parse evaluation", suggestions: "Try again" };
  }
}

async function main() {
  console.log("=== Evaluator-Optimizer Demo: Haiku Refinement ===\n");
  console.log(`Topic: "${HAIKU_TOPIC}"`);
  console.log(`Threshold: ${SCORE_THRESHOLD}/10 | Max iterations: ${MAX_ITERATIONS}\n`);

  let currentHaiku: string | undefined;
  let lastFeedback: string | undefined;

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    console.log(`── Iteration ${i} ${"─".repeat(45)}`);

    // Generate (or refine)
    currentHaiku = await generate(HAIKU_TOPIC, currentHaiku, lastFeedback);
    console.log(`\nHaiku:\n  ${currentHaiku.split("\n").join("\n  ")}\n`);

    // Evaluate
    const evaluation = await evaluate(currentHaiku, HAIKU_TOPIC);
    console.log(`Score: ${evaluation.score}/10`);
    console.log(`Critique: ${evaluation.critique}`);
    console.log(`Suggestions: ${evaluation.suggestions}\n`);

    // Check if we're done
    if (evaluation.score >= SCORE_THRESHOLD) {
      console.log(`✓ Score ${evaluation.score} meets threshold ${SCORE_THRESHOLD}. Done!`);
      return;
    }

    // Prepare feedback for next iteration
    lastFeedback = `Score: ${evaluation.score}/10\nCritique: ${evaluation.critique}\nSuggestions: ${evaluation.suggestions}`;
    console.log(`Score ${evaluation.score} < ${SCORE_THRESHOLD}, refining...\n`);
  }

  console.log(`✗ Max iterations (${MAX_ITERATIONS}) reached. Final haiku:`);
  console.log(`  ${currentHaiku?.split("\n").join("\n  ")}`);
}

main().catch(console.error);
