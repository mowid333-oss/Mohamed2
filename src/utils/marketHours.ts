import { MarketSessionStatus } from '../types/stock';

/**
 * Egyptian Exchange (EGX) Market Schedule:
 * - Days: Sunday to Thursday (جمعة وسبت عطلة أسبوعية رسمية)
 * - Discovery Pre-Market Session: 09:30 AM to 10:00 AM Cairo Time
 * - Main Trading Session: 10:00 AM to 02:30 PM (14:30) Cairo Time
 * - Post-Market & Fixed Price: 02:30 PM to 02:45 PM
 */
export function getEgxMarketStatus(): MarketSessionStatus {
  const now = new Date();
  
  // Format to Cairo local time
  const cairoFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = cairoFormatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  parts.forEach((p) => {
    partMap[p.type] = p.value;
  });

  const weekday = partMap.weekday; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
  const hour = parseInt(partMap.hour || '0', 10);
  const minute = parseInt(partMap.minute || '0', 10);
  const totalMinutes = hour * 60 + minute;

  const cairoTimeFormatted = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} بتوقيت القاهرة`;

  const isWeekend = weekday === 'Fri' || weekday === 'Sat';

  if (isWeekend) {
    return {
      isOpen: false,
      statusTextAr: 'السوق مغلق (عطلة نهاية الأسبوع)',
      statusTextEn: 'EGX Closed (Weekend Holiday)',
      nextOpenTextAr: 'تفتتح الجلسة القادمة يوم الأحد الساعة 10:00 صباحاً بتوقيت القاهرة',
      cairoTimeFormatted,
      badgeColor: 'amber',
    };
  }

  const openMinutes = 10 * 60; // 10:00 AM = 600
  const closeMinutes = 14 * 60 + 30; // 02:30 PM = 870
  const discoveryMinutes = 9 * 60 + 30; // 09:30 AM = 570

  if (totalMinutes < discoveryMinutes) {
    return {
      isOpen: false,
      statusTextAr: 'السوق مغلق (قبل الجلسة)',
      statusTextEn: 'EGX Closed (Pre-Session)',
      nextOpenTextAr: 'الجلسة الاستكشافية تبدأ 9:30 ص، والتداول الفعلي 10:00 ص',
      cairoTimeFormatted,
      badgeColor: 'slate',
    };
  }

  if (totalMinutes >= discoveryMinutes && totalMinutes < openMinutes) {
    const minsToOpen = openMinutes - totalMinutes;
    return {
      isOpen: false,
      statusTextAr: `الجلسة الاستكشافية (افتتاح التداول خلال ${minsToOpen} دقيقة)`,
      statusTextEn: 'EGX Pre-Market Discovery',
      nextOpenTextAr: 'جلسة استكشاف أوامر السوق قبل الافتتاح الرسمي',
      cairoTimeFormatted,
      badgeColor: 'amber',
    };
  }

  if (totalMinutes >= openMinutes && totalMinutes < closeMinutes) {
    const minutesLeft = closeMinutes - totalMinutes;
    const hours = Math.floor(minutesLeft / 60);
    const mins = minutesLeft % 60;
    return {
      isOpen: true,
      statusTextAr: 'جلسة التداول مفتوحة ومباشرة (LIVE)',
      statusTextEn: 'EGX Live Trading Session is OPEN',
      nextOpenTextAr: `الجلسة نشطة (تغلق في تمام 2:30 ظهراً - متبقي ${hours > 0 ? `${hours} ساعة و ` : ''}${mins} دقيقة)`,
      cairoTimeFormatted,
      badgeColor: 'emerald',
    };
  }

  // After 02:30 PM
  const isThursday = weekday === 'Thu';
  const nextDay = isThursday ? 'الأحد القادم' : 'غداً';
  return {
    isOpen: false,
    statusTextAr: 'انتهت جلسة اليوم الرسمية (أسعار الإغلاق)',
    statusTextEn: 'EGX Closed (Session Finished)',
    nextOpenTextAr: `تفتح الجلسة القادمة ${nextDay} الساعة 10:00 صباحاً بتوقيت القاهرة`,
    cairoTimeFormatted,
    badgeColor: 'slate',
  };
}
