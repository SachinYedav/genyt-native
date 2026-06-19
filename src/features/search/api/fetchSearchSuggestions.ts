import { SEARCH_SUGGESTION_LIMIT } from '../constants/searchConstants';

type GoogleSuggestResponse = [string, unknown];

function sanitizeSuggestions(rawSuggestions: unknown, query: string) {
  if (!Array.isArray(rawSuggestions)) return [];

  const normalizedQuery = query.trim().toLowerCase();
  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const suggestion of rawSuggestions) {
    if (typeof suggestion !== 'string') continue;

    const cleanSuggestion = suggestion.trim();
    const key = cleanSuggestion.toLowerCase();
    if (!cleanSuggestion || key === normalizedQuery || seen.has(key)) continue;

    seen.add(key);
    suggestions.push(cleanSuggestion);
    if (suggestions.length >= SEARCH_SUGGESTION_LIMIT) break;
  }

  return suggestions;
}

export async function fetchSearchSuggestions(query: string, signal?: AbortSignal) {
  const cleanQuery = query.trim().slice(0, 100).toLowerCase();
  if (cleanQuery.length < 2) return [];

  const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(cleanQuery)}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error('Suggestion service is temporarily unavailable.');
  }

  const json = (await response.json()) as GoogleSuggestResponse;
  return sanitizeSuggestions(json[1], cleanQuery);
}
