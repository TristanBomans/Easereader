import * as React from 'react';
import { useBookSources as useBookSourcesQuery } from '../api/queries/bookSources';
import type { SourcePreferences } from '../lib/sourcePreferences';
import { resolveSourcePreferences, saveSourcePreferences } from '../lib/sourcePreferences';

export function useBookSources() {
  const { data: options, isLoading, error } = useBookSourcesQuery();

  const [preferences, setPreferencesState] = React.useState<SourcePreferences | null>(null);

  React.useEffect(() => {
    if (options) {
      setPreferencesState((prev) => {
        const resolved = resolveSourcePreferences(options, prev ?? undefined);
        return resolved;
      });
    }
  }, [options]);

  const setPreferences = React.useCallback(
    (next: SourcePreferences) => {
      if (!options) return;
      const validated = resolveSourcePreferences(options, next);
      saveSourcePreferences(validated);
      setPreferencesState(validated);
    },
    [options]
  );

  const setStrategy = React.useCallback(
    (strategy: SourcePreferences['strategy']) => {
      if (!preferences) return;
      setPreferences({ ...preferences, strategy });
    },
    [preferences, setPreferences]
  );

  const setZlibraryUrl = React.useCallback(
    (zlibraryUrl: string) => {
      if (!preferences) return;
      setPreferences({ ...preferences, zlibraryUrl });
    },
    [preferences, setPreferences]
  );

  const setSourceUrl = React.useCallback(
    (sourceUrl: string) => {
      if (!preferences) return;
      setPreferences({ ...preferences, sourceUrl });
    },
    [preferences, setPreferences]
  );

  return {
    options: options ?? { zlibrary: [], AnnasArchive: [] },
    isLoading,
    error,
    preferences,
    setStrategy,
    setZlibraryUrl,
    setSourceUrl,
  };
}
