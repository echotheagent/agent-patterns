import { chat, getText } from "../lib/anthropic.js";

// ============================================================================
// Pattern 2: Routing
//
// An LLM classifies the input, then a switch statement routes to a
// specialized prompt. Each route has its own system prompt / persona.
//
// Example: Customer support — classify as general/refund/technical,
// then handle with a specialist.
// ============================================================================

// ── Specialized system prompts for each route ──────────────────────────────

const ROUTES: Record<string, string> = {
  general: `You are a friendly, helpful customer support agent. Answer general 
questions about the company, its products, and policies. Be warm and concise.`,

  refund: `You are a customer support specialist handling refund requests. 
Be empathetic but follow these rules:
- Refunds are available within 30 days of purchase
- Digital products are non-refundable once downloaded
- Always ask for the order number if not provided
Guide the customer through the refund process step by step.`,

  technical: `You are a senior technical support engineer. 
- Ask clarifying questions about the user's environment (OS, version, etc.)
- Provide step-by-step troubleshooting instructions
- If the issue requires escalation, explain that clearly
Be precise and technical — the user wants solutions, not pleasantries.`,
};

// ── Sample messages to route ───────────────────────────────────────────────

const SAMPLE_MESSAGES = [
  "What are your business hours?",
  "I want my money back, this product is terrible!",
  "I'm getting a 502 error when I try to access the API endpoint",
];

async function classifyMessage(message: string): Promise<string> {
  // The classifier's job is simple: read the message, return a category.
  // We constrain the output to just the category name.
  const response = await chat({
    system: `You are a customer support classifier. Classify the incoming message 
into exactly one category. Respond with ONLY the category name, nothing else.

Categories:
- general — general questions, business info, policies
- refund — refund requests, billing issues, payment problems  
- technical — technical issues, bugs, API problems, errors`,
    messages: [{ role: "user", content: message }],
    maxTokens: 20, // We only need one word back
    temperature: 0, // Deterministic classification
  });

  return getText(response).trim().toLowerCase();
}

async function handleMessage(message: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Customer: "${message}"\n`);

  // Step 1: Classify
  const category = await classifyMessage(message);
  console.log(`→ Classified as: [${category}]`);

  // Step 2: Route to specialized handler
  const systemPrompt = ROUTES[category];
  if (!systemPrompt) {
    console.log(`⚠ Unknown category "${category}", falling back to general.`);
  }

  const response = await chat({
    system: systemPrompt ?? ROUTES.general,
    messages: [{ role: "user", content: message }],
  });

  console.log(`→ Response:\n${getText(response)}`);
}

async function main() {
  console.log("=== Routing Demo: Customer Support ===");

  for (const message of SAMPLE_MESSAGES) {
    await handleMessage(message);
  }
}

main().catch(console.error);
