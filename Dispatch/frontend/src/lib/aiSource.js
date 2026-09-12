/**
 * Extraction-source values the backend reports on a parsed tender.
 *
 * The backend switched from "gemini-ai" to "claude-ai". Both are accepted so a
 * frontend/backend deploy skew in either direction still reports success --
 * a stale literal here silently shows the "FALLBACK data" warning on a
 * perfectly good extraction, which is exactly what happened on the swap.
 */
export const AI_EXTRACTION_SOURCES = ["claude-ai", "gemini-ai"];

export const usedAiExtraction = (source) => AI_EXTRACTION_SOURCES.includes(source);
