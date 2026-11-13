// Groq models used by the AI routes. Groq retires models without notice —
// when a route starts returning 404 "model does not exist", update them here.

// Reads photos (receipt/fridge scans, barcodes). Must accept image input.
// On Groq's on-demand tier this model allows only 1000 output tokens per
// minute, so keep max_tokens at or below VISION_MAX_TOKENS.
export const GROQ_VISION_MODEL = "qwen/qwen3.8-27b";
export const VISION_MAX_TOKENS = 1000;

// Text-only generation (recipes, meal plans) that needs long JSON output.
export const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";
