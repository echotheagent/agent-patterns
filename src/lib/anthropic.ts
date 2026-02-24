import Anthropic from "@anthropic-ai/sdk";

// --------------------------------------------------------------------------
// Shared Anthropic client and helpers used by every pattern example.
// --------------------------------------------------------------------------

// Single client instance — reads ANTHROPIC_API_KEY from environment.
export const client = new Anthropic();

// Default model — claude-sonnet-4-20250514 is a great balance of speed and quality for demos.
export const MODEL = "claude-sonnet-4-20250514";

/**
 * Minimal chat helper — thin wrapper around `client.messages.create()`.
 *
 * Accepts a system prompt, user messages, and optional overrides.
 * Returns the full Anthropic Message object so callers can inspect
 * stop_reason, tool_use blocks, etc.
 */
export async function chat(options: {
  system?: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
  tools?: Anthropic.Tool[];
  temperature?: number;
}) {
  return client.messages.create({
    model: MODEL,
    max_tokens: options.maxTokens ?? 1024,
    system: options.system ?? "",
    messages: options.messages,
    ...(options.tools ? { tools: options.tools } : {}),
    ...(options.temperature !== undefined
      ? { temperature: options.temperature }
      : {}),
  });
}

/**
 * Extract the text content from a Message response.
 * Filters to TextBlock content and joins them.
 */
export function getText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}
