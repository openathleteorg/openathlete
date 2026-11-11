/**
 * Adds the user's own instructions for a feature to its agent's.
 *
 * Providers cache prompts by prefix (OpenAI and Gemini implicitly, Claude at
 * its cache breakpoints). The generic instructions, identical for every call
 * of the feature, come first; the user's, which only change when they edit
 * them, come next. The call's data (the request, the activity...) is in the
 * user message after both, so neither part is re-read when only the data
 * changes, and editing the instructions keeps the generic part cached.
 */
export function withCustomInstructions(
  instructions: string,
  custom: string | null | undefined,
): string {
  const text = custom?.trim();
  if (!text) return instructions;
  return `${instructions}

CUSTOM INSTRUCTIONS:
The athlete or coach using this feature wrote the instructions below. Follow them: they take precedence over the general guidelines above, but never over the required output format, the structural rules or the language of the answer.

<custom_instructions>
${text}
</custom_instructions>`;
}
