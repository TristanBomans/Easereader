import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDefaultPreferences,
  loadSourcePreferences,
  validateAndNormalizePreferences,
  resolveSourcePreferences,
  STORAGE_KEY,
  type BookSourceOptions,
} from './sourcePreferences';

const sampleOptions: BookSourceOptions = {
  zlibrary: [
    { label: 'articles.sk', url: 'https://articles.sk' },
    { label: '1lib.sk', url: 'https://1lib.sk' },
  ],
  AnnasArchive: [
    { label: 'annas-archive.gl', url: 'https://annas-archive.gl' },
    { label: 'annas-archive.pk', url: 'https://annas-archive.pk' },
  ],
};

describe('sourcePreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default preferences from options', () => {
    const prefs = getDefaultPreferences(sampleOptions);
    expect(prefs.strategy).toBe('source');
    expect(prefs.zlibraryUrl).toBe('https://articles.sk');
    expect(prefs.sourceUrl).toBe('https://annas-archive.gl');
  });

  it('loads saved preferences', () => {
    const saved = {
      strategy: 'zlibrary' as const,
      zlibraryUrl: 'https://1lib.sk',
      sourceUrl: 'https://annas-archive.pk',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    expect(loadSourcePreferences()).toEqual(saved);
  });

  it('falls back when saved URL is no longer allowed', () => {
    const saved = {
      strategy: 'source' as const,
      zlibraryUrl: 'https://old.sk',
      sourceUrl: 'https://annas-archive.gl',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const resolved = resolveSourcePreferences(sampleOptions);
    expect(resolved.zlibraryUrl).toBe('https://articles.sk');
    expect(resolved.sourceUrl).toBe('https://annas-archive.gl');
  });

  it('validates and normalizes preferences', () => {
    const prefs = {
      strategy: 'zlibrary' as const,
      zlibraryUrl: 'https://unknown.sk',
      sourceUrl: 'https://annas-archive.pk',
    };
    const normalized = validateAndNormalizePreferences(prefs, sampleOptions);
    expect(normalized.zlibraryUrl).toBe('https://articles.sk');
    expect(normalized.sourceUrl).toBe('https://annas-archive.pk');
  });
});
