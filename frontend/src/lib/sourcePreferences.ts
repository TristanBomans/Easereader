import type { components } from '../api/types';

export type BookSourceOptions = components['schemas']['BookSourceOptions'];

export type SearchParams = {
  q: string;
  strategy: 'zlibrary' | 'source';
  zlibraryUrl: string;
  sourceUrl: string;
};

export type SourcePreferences = {
  strategy: SearchParams['strategy'];
  zlibraryUrl: string;
  sourceUrl: string;
};

export const STORAGE_KEY = 'easereader.bookSources';

const DEFAULT_STRATEGY: SourcePreferences['strategy'] = 'source';

export function getDefaultPreferences(options: BookSourceOptions): SourcePreferences {
  const zlibrary = options.zlibrary?.[0]?.url ?? '';
  const source = options.AnnasArchive?.[0]?.url ?? '';
  return {
    strategy: DEFAULT_STRATEGY,
    zlibraryUrl: zlibrary,
    sourceUrl: source,
  };
}

export function loadSourcePreferences(): SourcePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'strategy' in parsed &&
      'zlibraryUrl' in parsed &&
      'sourceUrl' in parsed &&
      (parsed.strategy === 'zlibrary' || parsed.strategy === 'source') &&
      typeof parsed.zlibraryUrl === 'string' &&
      typeof parsed.sourceUrl === 'string'
    ) {
      return parsed as SourcePreferences;
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export function saveSourcePreferences(preferences: SourcePreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function validateAndNormalizePreferences(
  preferences: SourcePreferences,
  options: BookSourceOptions
): SourcePreferences {
  const allowedZlibrary = new Set((options.zlibrary ?? []).map((o) => o.url));
  const allowedSource = new Set((options.AnnasArchive ?? []).map((o) => o.url));

  return {
    strategy: preferences.strategy,
    zlibraryUrl: allowedZlibrary.has(preferences.zlibraryUrl)
      ? preferences.zlibraryUrl
      : (options.zlibrary?.[0]?.url ?? preferences.zlibraryUrl),
    sourceUrl: allowedSource.has(preferences.sourceUrl)
      ? preferences.sourceUrl
      : (options.AnnasArchive?.[0]?.url ?? preferences.sourceUrl),
  };
}

export function resolveSourcePreferences(
  options: BookSourceOptions,
  overrides?: Partial<SourcePreferences>
): SourcePreferences {
  const saved = loadSourcePreferences();
  const defaults = getDefaultPreferences(options);

  let merged: SourcePreferences = {
    ...defaults,
    ...(saved ?? {}),
    ...overrides,
  };

  merged = validateAndNormalizePreferences(merged, options);

  if (JSON.stringify(merged) !== JSON.stringify(saved)) {
    saveSourcePreferences(merged);
  }

  return merged;
}

export function buildDownloadUrl(params: SourcePreferences & { dl: string; title?: string }): string {
  const search = new URLSearchParams();
  search.set('dl', params.dl);
  if (params.title) search.set('title', params.title);
  search.set('strategy', params.strategy);
  search.set('zlibraryUrl', params.zlibraryUrl);
  search.set('sourceUrl', params.sourceUrl);
  return `/api/download?${search.toString()}`;
}
