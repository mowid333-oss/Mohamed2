/**
 * News Recency & Freshness Filter Engine
 * Filters out old, stale, or lagged news, prioritizing the newest breaking announcements,
 * disclosures, and financial reports from verified Egyptian and international sources.
 */

import { EgxNewsItem } from '../services/egxNewsService';
import { StockNewsItem } from '../services/googleSearchAiAnalystService';

export type NewsFreshnessFilter = 'ALL_RECENT' | 'TODAY_ONLY' | 'LAST_24_HOURS' | 'LAST_48_HOURS';

export interface FreshNewsItem extends EgxNewsItem {
  timestampEpoch: number;
  isToday: boolean;
  isBreaking: boolean;
  freshnessBadgeAr: string;
}

/**
 * Parses publication date string into epoch milliseconds
 */
export function parseNewsTimestamp(dateStr?: string): number {
  if (!dateStr) return Date.now();
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) return parsed;

  // If text like "منذ 10 دقائق", approximate based on keywords
  const now = Date.now();
  if (dateStr.includes('دقيقة') || dateStr.includes('دقائق')) {
    const num = parseInt(dateStr.replace(/[^0-9]/g, ''), 10) || 15;
    return now - num * 60 * 1000;
  }
  if (dateStr.includes('ساعة') || dateStr.includes('ساعات')) {
    const num = parseInt(dateStr.replace(/[^0-9]/g, ''), 10) || 1;
    return now - num * 3600 * 1000;
  }
  if (dateStr.includes('أمس') || dateStr.includes('امس')) {
    return now - 24 * 3600 * 1000;
  }
  if (dateStr.includes('اليوم')) {
    return now - 2 * 3600 * 1000;
  }
  return now;
}

/**
 * Calculates human-readable Arabic relative time dynamically
 */
export function calculateArabicTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (3600 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 3600 * 1000));

  if (diffMins < 1) return 'الآن لحظياً ⚡';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة ⚡`;
  if (diffHours === 1) return 'منذ ساعة واحدة';
  if (diffHours === 2) return 'منذ ساعتين';
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return 'أمس';
  if (diffDays === 2) return 'منذ يومين';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return 'خلال الأسبوع الحالي';
}

/**
 * Filters and prioritizes fresh news items:
 * - Discards obsolete news beyond max threshold (e.g. older than 7 days)
 * - Sorts strictly descending: newest first
 * - Calculates fresh timeAgoAr badges
 */
export function filterAndPrioritizeFreshNews(
  items: EgxNewsItem[],
  freshnessFilter: NewsFreshnessFilter = 'ALL_RECENT',
  maxAgeHours: number = 72 // 3 days default limit to avoid obsolete news
): FreshNewsItem[] {
  const now = Date.now();

  const enriched: FreshNewsItem[] = items.map((item) => {
    const timestampEpoch = parseNewsTimestamp(item.publishedAt);
    const ageHours = (now - timestampEpoch) / (3600 * 1000);
    const isToday = ageHours <= 18;
    const isBreaking = ageHours <= 2;

    let freshnessBadgeAr = 'حديث';
    if (isBreaking) freshnessBadgeAr = 'عاجل الآن ⚡';
    else if (isToday) freshnessBadgeAr = 'اليوم 🕒';
    else if (ageHours <= 48) freshnessBadgeAr = 'آخر 48 ساعة';
    else freshnessBadgeAr = 'هذا الأسبوع';

    const calculatedTimeAgo = calculateArabicTimeAgo(timestampEpoch);

    return {
      ...item,
      timestampEpoch,
      isToday,
      isBreaking,
      freshnessBadgeAr,
      timeAgoAr: calculatedTimeAgo || item.timeAgoAr,
    };
  });

  // Sort strictly descending by timestamp (newest first)
  const sorted = enriched.sort((a, b) => b.timestampEpoch - a.timestampEpoch);

  // Apply freshness filters
  if (freshnessFilter === 'TODAY_ONLY') {
    return sorted.filter((item) => item.isToday);
  }
  if (freshnessFilter === 'LAST_24_HOURS') {
    return sorted.filter((item) => (now - item.timestampEpoch) <= 24 * 3600 * 1000);
  }
  if (freshnessFilter === 'LAST_48_HOURS') {
    return sorted.filter((item) => (now - item.timestampEpoch) <= 48 * 3600 * 1000);
  }

  // ALL_RECENT: filter out stale articles older than maxAgeHours
  const cutoffTime = now - maxAgeHours * 3600 * 1000;
  const filtered = sorted.filter((item) => item.timestampEpoch >= cutoffTime);

  // Return at least some items if filter is too aggressive
  return filtered.length > 0 ? filtered : sorted.slice(0, 15);
}

/**
 * Filters stock-specific news items for Google Search Analyst modal to ensure only fresh news is prioritized
 */
export function filterStockNewsFreshness(items: StockNewsItem[]): StockNewsItem[] {
  if (!items || items.length === 0) return [];
  const now = Date.now();

  const formatted = items.map((item, idx) => {
    const parsed = parseNewsTimestamp(item.publishedAt);
    const ageHours = (now - parsed) / (3600 * 1000);

    let freshTag = item.publishedAt;
    if (ageHours <= 2) freshTag = 'عاجل اليوم ⚡';
    else if (ageHours <= 24) freshTag = 'اليوم';
    else if (ageHours <= 48) freshTag = 'أمس';

    return {
      ...item,
      publishedAt: freshTag,
      _timestamp: parsed - idx * 1000,
    };
  });

  // Sort descending by calculated freshness
  return formatted
    .sort((a, b) => (b as any)._timestamp - (a as any)._timestamp)
    .map(({ _timestamp, ...rest }: any) => rest as StockNewsItem);
}
