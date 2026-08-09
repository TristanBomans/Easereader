import { useSearch, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { SearchForm } from './SearchForm';
import { SearchResults } from './SearchResults';
import { StrategyToggle } from './StrategyToggle';
import { useBookSources } from '../../hooks/useBookSources';
import { useProfiles } from '../../api/queries/profiles';
import { useDownload } from '../../hooks/useDownload';
import { DownloadProgress } from '../progress/DownloadProgress';
import { openSettings } from '../../stores/settingsStore';

export function SearchPage() {
  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });

  const { options, isLoading: sourcesLoading, preferences, setStrategy } = useBookSources();
  const { data: profiles = [] } = useProfiles();
  const { download } = useDownload();

  const updateSearchParams = React.useCallback(
    (next: Partial<typeof search>) => {
      void navigate({
        to: '/',
        search: { ...search, ...next },
        replace: true,
      });
    },
    [navigate, search]
  );

  React.useEffect(() => {
    if (!preferences) return;
    if (
      search.strategy !== preferences.strategy ||
      search.zlibraryUrl !== preferences.zlibraryUrl ||
      search.sourceUrl !== preferences.sourceUrl
    ) {
      updateSearchParams({
        strategy: preferences.strategy,
        zlibraryUrl: preferences.zlibraryUrl,
        sourceUrl: preferences.sourceUrl,
      });
    }
  }, [preferences, search.strategy, search.zlibraryUrl, search.sourceUrl, updateSearchParams]);

  const handleSearch = (q: string) => {
    if (!preferences) return;
    updateSearchParams({
      q,
      strategy: preferences.strategy,
      zlibraryUrl: preferences.zlibraryUrl,
      sourceUrl: preferences.sourceUrl,
    });
  };

  const activeDomainLabel = React.useMemo(() => {
    if (!preferences) return '';
    const domainUrl = preferences.strategy === 'zlibrary' ? preferences.zlibraryUrl : preferences.sourceUrl;
    const domainOptions = preferences.strategy === 'zlibrary' ? options.zlibrary ?? [] : options.AnnasArchive ?? [];
    return domainOptions.find((o) => o.url === domainUrl)?.label ?? domainUrl;
  }, [preferences, options]);

  return (
    <div className="space-y-4">
      <SearchForm
        initialQuery={search.q}
        isLoading={sourcesLoading}
        onSearch={handleSearch}
      />

      <div className="flex items-center justify-between gap-2">
        <StrategyToggle
          value={preferences?.strategy}
          disabled={sourcesLoading}
          onChange={(strategy) => {
            setStrategy(strategy);
            updateSearchParams({ strategy });
          }}
        />
        <button
          type="button"
          onClick={() => openSettings('sources')}
          className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-text-muted transition-colors duration-150 hover:text-text-secondary"
        >
          <span className="truncate">{activeDomainLabel}</span>
          <SlidersHorizontal className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="sr-only">Manage book source domains</span>
        </button>
      </div>

      {preferences && (
        <SearchResults
          params={search}
          profiles={profiles}
          onDownload={(params) => void download(params)}
        />
      )}

      <DownloadProgress />
    </div>
  );
}
