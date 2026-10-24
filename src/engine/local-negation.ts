/**
 * Local polarity check.
 * Only the words immediately before a match count. A "do not" later in the
 * excerpt, or several words earlier, does not change this sentence.
 * This is not entailment. When the window is unclear, callers abstain.
 */
export function deniesAt(text: string, index: number): boolean {
  const window = text.slice(Math.max(0, index - 32), index);
  return /(?:\b(?:not|never|no|without)\b|n't)(?:\s+\w+){0,2}\s*$/i.test(window);
}
