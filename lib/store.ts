'use client';
import { createContext, useContext } from 'react';
import { DataStore } from './types';
import { defaultData } from './defaultData';

const STORAGE_KEY = 'avis-ml-dashboard-data';

export function loadData(): DataStore {
  if (typeof window === 'undefined') return defaultData;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultData;
    const parsed = JSON.parse(stored);
    // Merge with default to handle new fields
    return {
      ...defaultData,
      ...parsed,
      findings: parsed.findings ?? defaultData.findings,
      experiments: parsed.experiments ?? defaultData.experiments,
      shareLinks: parsed.shareLinks ?? defaultData.shareLinks,
      seenFindings: parsed.seenFindings ?? {},
      timelinePhases: parsed.timelinePhases ?? defaultData.timelinePhases,
      milestones: parsed.milestones ?? defaultData.milestones,
    };
  } catch {
    return defaultData;
  }
}

export function saveData(data: DataStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function markFindingsSeen(slug: string, findingIds: string[]): void {
  const data = loadData();
  const seen = new Set(data.seenFindings[slug] ?? []);
  findingIds.forEach((id) => seen.add(id));
  data.seenFindings[slug] = Array.from(seen);
  saveData(data);
}

export function getUnseenCount(slug: string): number {
  const data = loadData();
  const seen = new Set(data.seenFindings[slug] ?? []);
  return data.findings.filter((f) => !seen.has(f.id)).length;
}

export function isAuthenticated(slug: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`auth_${slug}`) === 'true';
}

export function authenticate(slug: string, password: string): boolean {
  const data = loadData();
  const link = data.shareLinks.find((l) => l.slug === slug);
  if (!link || link.password !== password) return false;
  localStorage.setItem(`auth_${slug}`, 'true');
  return true;
}

export function getShareLink(slug: string) {
  const data = loadData();
  return data.shareLinks.find((l) => l.slug === slug) ?? null;
}

export const DataContext = createContext<{
  data: DataStore;
  setData: (d: DataStore) => void;
} | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
