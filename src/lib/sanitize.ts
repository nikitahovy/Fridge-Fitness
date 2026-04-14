/**
 * Strip control characters, HTML tags, null bytes, and trim whitespace.
 * Used inside zod .transform() on all user-facing string inputs.
 */
export function sanitizeString(str: string, maxLength = 200): string {
  return str
    .replace(/\0/g, "")                                  // strip null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")  // strip control chars
    .replace(/<[^>]*>/g, "")                              // strip HTML tags
    .replace(/<!--[\s\S]*?-->/g, "")                      // strip HTML comments
    .trim()
    .slice(0, maxLength);
}
