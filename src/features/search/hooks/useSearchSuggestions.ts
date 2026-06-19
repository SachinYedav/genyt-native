import { useEffect, useRef, useState } from 'react';
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_SUGGESTION_CACHE_LIMIT,
} from '../constants/searchConstants';
import { fetchSearchSuggestions } from '../api/fetchSearchSuggestions';
import { extractYouTubeVideoId } from '../utils/searchUrl';
import { SuggestionLruCache } from '../api/suggestionCache';

type UseSearchSuggestionsOptions = {
  debounceMs?: number;
  cacheSize?: number;
  focused: boolean;
  query: string;
};

export function useSearchSuggestions({
  cacheSize = SEARCH_SUGGESTION_CACHE_LIMIT,
  debounceMs = SEARCH_DEBOUNCE_MS,
  focused,
  query,
}: UseSearchSuggestionsOptions) {
  const cacheRef = useRef<SuggestionLruCache | null>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsQuery, setSuggestionsQuery] = useState('');
  const [resolvedQuery, setResolvedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<{ variant: 'offline' | 'error'; message: string; subMessage?: string } | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [debouncedCount, setDebouncedCount] = useState(0);
  const [averageResponseMs, setAverageResponseMs] = useState(0);

  if (!cacheRef.current) {
    cacheRef.current = new SuggestionLruCache(cacheSize);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const directVideoId = extractYouTubeVideoId(query);

  useEffect(() => {
    abortRef.current?.abort();
    setErrorState(null);

    if (!focused || normalizedQuery.length < 2 || directVideoId) {
      setSuggestions([]);
      setSuggestionsQuery('');
      setResolvedQuery('');
      setIsLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const cachedSuggestions = cacheRef.current?.get(normalizedQuery);
    if (cachedSuggestions) {
      setSuggestions(cachedSuggestions);
      setSuggestionsQuery(normalizedQuery);
      setResolvedQuery(normalizedQuery);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setResolvedQuery('');

    const debounceId = setTimeout(() => {
      const startedAt = Date.now();
      setDebouncedCount((count) => count + 1);
      setRequestCount((count) => count + 1);

      fetchSearchSuggestions(normalizedQuery, controller.signal)
        .then((results) => {
          if (controller.signal.aborted || requestId !== requestIdRef.current) return;

          cacheRef.current?.set(normalizedQuery, results);
          setSuggestions(results);
          setSuggestionsQuery(normalizedQuery);
          setResolvedQuery(normalizedQuery);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || requestId !== requestIdRef.current) return;
          setSuggestions([]);
          setSuggestionsQuery(normalizedQuery);
          setResolvedQuery(normalizedQuery);
          
          const rawMessage = error instanceof Error ? error.message : String(error);
          console.error('[SearchSuggestions] Fetch failed:', rawMessage);
          
          if (rawMessage.includes('UnknownHostException') || rawMessage.includes('Network') || rawMessage.includes('ConnectException')) {
            setErrorState({
              variant: 'offline',
              message: "You're offline",
              subMessage: 'Check your internet connection',
            });
          } else {
            setErrorState({
              variant: 'error',
              message: 'Something went wrong',
            });
          }
        })
        .finally(() => {
          if (controller.signal.aborted || requestId !== requestIdRef.current) return;

          const elapsedMs = Date.now() - startedAt;
          setAverageResponseMs((current) => (current === 0 ? elapsedMs : Math.round((current + elapsedMs) / 2)));
          setIsLoading(false);
        });
    }, debounceMs);

    return () => {
      clearTimeout(debounceId);
      controller.abort();
    };
  }, [debounceMs, directVideoId, focused, normalizedQuery]);

  const visibleSuggestions =
    normalizedQuery &&
    suggestions.length > 0 &&
    (suggestionsQuery === normalizedQuery || normalizedQuery.startsWith(suggestionsQuery))
      ? suggestions
      : [];

  return {
    errorState,
    hasNoSuggestions:
      normalizedQuery.length > 1 &&
      resolvedQuery === normalizedQuery &&
      !errorState &&
      !isLoading &&
      visibleSuggestions.length === 0,
    isLoading,
    metrics: {
      averageResponseMs,
      cache: cacheRef.current?.metrics ?? { hits: 0, misses: 0, writes: 0, evictions: 0 },
      cacheSize: cacheRef.current?.size ?? 0,
      debouncedCount,
      requestCount,
    },
    suggestions: visibleSuggestions,
  };
}
