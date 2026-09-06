// src/lib/time.js
//
// Shared relative-time formatting for the notification panel and the Dashboard
// activity feed. One implementation so both stay consistent — and so old
// entries never render "Today <time>" for a date from an earlier day.

function parts(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.round((now - date) / 60000);
  return { date, now, diffMin };
}

function isYesterday(date, now) {
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  return date.toDateString() === y.toDateString();
}

function plainDate(date, now) {
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Full form: "Just now" · "5 min ago" · "3 hr ago" · "Yesterday" · "12 Aug". */
export function timeAgo(dateStr) {
  const { date, now, diffMin } = parts(dateStr);
  if (Number.isNaN(diffMin)) return "";
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (date.toDateString() === now.toDateString()) return `${diffHr} hr ago`;
  if (isYesterday(date, now)) return "Yesterday";
  return plainDate(date, now);
}

/** Compact form for dense meta lines: "now" · "5m" · "3h" · "2d" · "12 Aug". */
export function timeAgoShort(dateStr) {
  const { date, now, diffMin } = parts(dateStr);
  if (Number.isNaN(diffMin)) return "";
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (date.toDateString() === now.toDateString()) return `${diffHr}h`;
  if (isYesterday(date, now)) return "Yesterday";
  const diffDay = Math.floor(diffMin / 1440);
  if (diffDay < 7) return `${diffDay}d`;
  return plainDate(date, now);
}
