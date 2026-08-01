export type CampaignSchedule = {
  schedule_enabled: boolean;
  schedule_start_at: string | null;
  schedule_end_at: string | null;
  /** 0 = Sunday … 6 = Saturday. Empty = every day. */
  schedule_days: number[];
  /** "HH:MM" or "HH:MM:SS" */
  schedule_daily_start: string | null;
  schedule_daily_end: string | null;
  schedule_timezone: string;
};

export const DEFAULT_STORE_TIMEZONE = "Asia/Karachi";

export const WEEKDAY_OPTIONS: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
];

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

export function normalizeTimezone(value: unknown, fallback = DEFAULT_STORE_TIMEZONE): string {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (!candidate) return fallback;
  try {
    // Throws RangeError for invalid IANA zones in modern runtimes.
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return fallback;
  }
}

export function normalizeTimeString(value: unknown): string | null {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const match = TIME_RE.exec(raw);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function normalizeScheduleDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const days = [...new Set(value.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))];
  return days.sort((a, b) => a - b);
}

export function normalizeCampaignSchedule(
  value: Partial<CampaignSchedule> | Record<string, unknown> | null | undefined,
  fallbackTimezone = DEFAULT_STORE_TIMEZONE
): CampaignSchedule {
  const source = value && typeof value === "object" ? value : {};
  const startAt =
    typeof source.schedule_start_at === "string" && source.schedule_start_at.trim()
      ? new Date(source.schedule_start_at).toISOString()
      : null;
  const endAt =
    typeof source.schedule_end_at === "string" && source.schedule_end_at.trim()
      ? new Date(source.schedule_end_at).toISOString()
      : null;

  return {
    schedule_enabled: source.schedule_enabled === true,
    schedule_start_at: startAt && !Number.isNaN(Date.parse(startAt)) ? startAt : null,
    schedule_end_at: endAt && !Number.isNaN(Date.parse(endAt)) ? endAt : null,
    schedule_days: normalizeScheduleDays(source.schedule_days),
    schedule_daily_start: normalizeTimeString(source.schedule_daily_start),
    schedule_daily_end: normalizeTimeString(source.schedule_daily_end),
    schedule_timezone: normalizeTimezone(source.schedule_timezone, fallbackTimezone),
  };
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    weekday: weekdayMap[get("weekday")] ?? 0,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    isoDate: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

function minutesOfDay(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Whether a campaign that is already in the rotation queue should play *now*.
 * schedule_enabled=false → always eligible.
 */
export function isCampaignScheduleActive(
  schedule: Partial<CampaignSchedule> | Record<string, unknown> | null | undefined,
  now: Date = new Date(),
  fallbackTimezone = DEFAULT_STORE_TIMEZONE
): boolean {
  const normalized = normalizeCampaignSchedule(schedule, fallbackTimezone);
  if (!normalized.schedule_enabled) return true;

  const tz = normalized.schedule_timezone;
  const nowMs = now.getTime();

  if (normalized.schedule_start_at) {
    const startMs = Date.parse(normalized.schedule_start_at);
    if (Number.isFinite(startMs) && nowMs < startMs) return false;
  }
  if (normalized.schedule_end_at) {
    const endMs = Date.parse(normalized.schedule_end_at);
    if (Number.isFinite(endMs) && nowMs > endMs) return false;
  }

  const parts = zonedParts(now, tz);

  if (normalized.schedule_days.length > 0 && !normalized.schedule_days.includes(parts.weekday)) {
    return false;
  }

  const dailyStart = normalized.schedule_daily_start;
  const dailyEnd = normalized.schedule_daily_end;
  if (dailyStart && dailyEnd) {
    const current = parts.hour * 60 + parts.minute;
    const start = minutesOfDay(dailyStart);
    const end = minutesOfDay(dailyEnd);
    if (start === end) {
      // Same start/end → treat as all-day.
    } else if (start < end) {
      if (current < start || current >= end) return false;
    } else {
      // Overnight window, e.g. 22:00–06:00
      if (current < start && current >= end) return false;
    }
  } else if (dailyStart && !dailyEnd) {
    if (parts.hour * 60 + parts.minute < minutesOfDay(dailyStart)) return false;
  } else if (!dailyStart && dailyEnd) {
    if (parts.hour * 60 + parts.minute >= minutesOfDay(dailyEnd)) return false;
  }

  return true;
}

export function describeCampaignSchedule(
  schedule: Partial<CampaignSchedule> | Record<string, unknown> | null | undefined,
  fallbackTimezone = DEFAULT_STORE_TIMEZONE
): string {
  const normalized = normalizeCampaignSchedule(schedule, fallbackTimezone);
  if (!normalized.schedule_enabled) return "Always (while in rotation)";

  const bits: string[] = [];
  if (normalized.schedule_start_at || normalized.schedule_end_at) {
    const start = normalized.schedule_start_at
      ? new Date(normalized.schedule_start_at).toLocaleString()
      : "…";
    const end = normalized.schedule_end_at
      ? new Date(normalized.schedule_end_at).toLocaleString()
      : "…";
    bits.push(`${start} → ${end}`);
  }
  if (normalized.schedule_days.length > 0 && normalized.schedule_days.length < 7) {
    const labels = WEEKDAY_OPTIONS.filter((day) => normalized.schedule_days.includes(day.value)).map(
      (day) => day.short
    );
    bits.push(labels.join(", "));
  } else {
    bits.push("Every day");
  }
  if (normalized.schedule_daily_start || normalized.schedule_daily_end) {
    bits.push(
      `${normalized.schedule_daily_start || "00:00"}–${normalized.schedule_daily_end || "24:00"}`
    );
  }
  bits.push(normalized.schedule_timezone);
  return bits.join(" · ");
}
