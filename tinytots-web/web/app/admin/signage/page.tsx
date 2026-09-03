"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-fetch";
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminBadge,
  AdminAlert,
  AdminSubnav,
} from "@/components/admin/ui";
import { SUBNAV } from "@/lib/admin-nav";
import {
  describeCampaignSchedule,
  isCampaignScheduleActive,
  normalizeCampaignSchedule,
  DEFAULT_STORE_TIMEZONE,
} from "@/lib/campaign-schedule";
import { DEFAULT_ROTATION_SECONDS } from "@/lib/signage-campaign";

type Campaign = {
  id: number;
  name: string;
  heading: string | null;
  is_active: boolean;
  rotation_order: number | null;
  schedule_enabled?: boolean;
  schedule_start_at?: string | null;
  schedule_end_at?: string | null;
  schedule_days?: number[] | null;
  schedule_daily_start?: string | null;
  schedule_daily_end?: string | null;
  schedule_timezone?: string | null;
};

type SignageSettings = {
  header_logo_text: string;
  header_tagline: string;
  rotation_seconds: number;
  store_timezone: string;
};

export default function AdminSignageOverviewPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [settings, setSettings] = useState<SignageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          adminFetch("/api/admin/campaigns"),
          adminFetch("/api/admin/signage-settings"),
        ]);
        const cJson = await cRes.json();
        const sJson = await sRes.json();
        if (!cRes.ok) throw new Error(cJson.error || "Failed to load campaigns");
        if (!sRes.ok) throw new Error(sJson.error || "Failed to load signage settings");
        setCampaigns((cJson.campaigns || []) as Campaign[]);
        setSettings(sJson.settings as SignageSettings);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load Digital Signage data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tz = settings?.store_timezone || DEFAULT_STORE_TIMEZONE;

  const { active, displayingNow, scheduled, nextScheduled } = useMemo(() => {
    const now = new Date();
    const activeList = campaigns
      .filter((c) => c.is_active)
      .sort((a, b) => (a.rotation_order ?? 0) - (b.rotation_order ?? 0) || a.id - b.id);
    const displaying = activeList.filter((c) => isCampaignScheduleActive(c, now, tz));
    const scheduledList = activeList.filter((c) => normalizeCampaignSchedule(c, tz).schedule_enabled);
    // Nearest future start among active, schedule-enabled campaigns not showing now.
    const upcoming = scheduledList
      .map((c) => ({ c, start: c.schedule_start_at ? Date.parse(c.schedule_start_at) : NaN }))
      .filter((x) => Number.isFinite(x.start) && x.start > now.getTime())
      .sort((a, b) => a.start - b.start);
    return {
      active: activeList,
      displayingNow: displaying,
      scheduled: scheduledList,
      nextScheduled: upcoming[0]?.c ?? null,
    };
  }, [campaigns, tz]);

  const live = displayingNow.length > 0;
  const rotationSeconds = settings?.rotation_seconds || DEFAULT_ROTATION_SECONDS;

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        breadcrumb={["Store experience", "Digital Signage"]}
        title="Digital Signage"
        description="The in-store TV display at /signage. Campaigns supply the on-screen content; the content library holds the reusable pieces (trust points, feature icons, stats, badges) that campaigns pull from."
        actions={
          <AdminButton
            variant="primary"
            onClick={() => window.open("/signage", "_blank", "noopener")}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>tv</span>
            Open live display
          </AdminButton>
        }
      />

      <AdminSubnav items={SUBNAV.signage} />

      {error && (
        <div className="mb-6">
          <AdminAlert tone="danger">{error}</AdminAlert>
        </div>
      )}

      {loading ? (
        <p className="font-body-sm text-body-sm text-text-secondary">Loading…</p>
      ) : (
        <div className="space-y-6">
          {/* Status */}
          <AdminCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-full ${
                    live ? "bg-green-100 text-green-700" : "bg-surface-secondary text-text-secondary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]" aria-hidden>
                    {live ? "cast_connected" : "cast"}
                  </span>
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <AdminBadge tone={live ? "success" : "neutral"}>
                      {live ? "Live" : "No active campaign"}
                    </AdminBadge>
                  </div>
                  <p className="mt-1 font-body-sm text-body-sm text-text-secondary">
                    {live
                      ? displayingNow.length === 1
                        ? `Showing “${displayingNow[0].name}”`
                        : `Rotating ${displayingNow.length} campaigns every ${rotationSeconds}s`
                      : active.length > 0
                        ? `${active.length} active campaign${active.length === 1 ? "" : "s"}, but none is inside its schedule window right now.`
                        : "The display shows a neutral holding screen until a campaign is activated."}
                  </p>
                </div>
              </div>
              <Link href="/admin/campaigns">
                <AdminButton variant="secondary">Manage campaigns</AdminButton>
              </Link>
            </div>
          </AdminCard>

          {/* Key figures */}
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminCard>
              <p className="font-label-md text-label-md uppercase tracking-wide text-text-secondary">Active campaigns</p>
              <p className="mt-1 font-headline-lg text-[28px] font-semibold text-text-primary">{active.length}</p>
              <p className="mt-1 font-label-md text-label-md text-text-secondary">In the rotation queue</p>
            </AdminCard>
            <AdminCard>
              <p className="font-label-md text-label-md uppercase tracking-wide text-text-secondary">Scheduled</p>
              <p className="mt-1 font-headline-lg text-[28px] font-semibold text-text-primary">{scheduled.length}</p>
              <p className="mt-1 font-label-md text-label-md text-text-secondary">
                {nextScheduled
                  ? `Next: ${nextScheduled.name}`
                  : "Active campaigns with a schedule window"}
              </p>
            </AdminCard>
            <AdminCard>
              <p className="font-label-md text-label-md uppercase tracking-wide text-text-secondary">Rotation</p>
              <p className="mt-1 font-headline-lg text-[28px] font-semibold text-text-primary">{rotationSeconds}s</p>
              <p className="mt-1 font-label-md text-label-md text-text-secondary">Per campaign · {tz}</p>
            </AdminCard>
          </div>

          {/* Active campaign list */}
          <AdminCard title="In rotation now" padded={false}>
            {active.length === 0 ? (
              <p className="px-4 py-6 font-body-sm text-body-sm text-text-secondary sm:px-5">
                No active campaigns. Open{" "}
                <Link href="/admin/campaigns" className="text-brand-primary underline">
                  Campaigns
                </Link>{" "}
                to activate one.
              </p>
            ) : (
              <ul className="divide-y divide-border-default">
                {active.map((c, i) => {
                  const showingNow = isCampaignScheduleActive(c, new Date(), tz);
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                      <span className="font-label-md text-label-md text-text-secondary">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-body-sm text-body-sm font-medium text-text-primary">
                          {c.name}
                        </span>
                        <span className="block truncate font-label-md text-label-md text-text-secondary">
                          {describeCampaignSchedule(c, tz)}
                        </span>
                      </span>
                      <AdminBadge tone={showingNow ? "success" : "warning"}>
                        {showingNow ? "Displaying" : "Outside schedule"}
                      </AdminBadge>
                      <a
                        href={`/signage?preview=${c.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-label-md text-label-md font-medium text-brand-primary hover:underline"
                      >
                        Preview
                        <span className="material-symbols-outlined text-[15px]" aria-hidden>open_in_new</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>

          {/* Quick actions */}
          <AdminCard title="Quick actions">
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickAction href="/admin/campaigns" icon="campaign" label="Manage campaigns" hint="Create, edit, schedule and activate" />
              <QuickAction href="/admin/site-content" icon="collections" label="Content library" hint="Trust points, feature icons, stats, badges" />
              <QuickAction href="/signage" icon="tv" label="Open live display" hint="The screen shown in store" external />
              <QuickAction href="/admin/settings" icon="settings" label="Signage settings" hint="Header text, rotation speed, timezone" />
            </div>
          </AdminCard>
        </div>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  hint,
  external,
}: {
  href: string;
  icon: string;
  label: string;
  hint: string;
  external?: boolean;
}) {
  const inner = (
    <div className="flex items-start gap-3 rounded-lg border border-border-default p-4 transition-colors hover:bg-surface-secondary">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-primary/10 text-brand-primary">
        <span className="material-symbols-outlined text-[20px]" aria-hidden>{icon}</span>
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 font-body-sm text-body-sm font-medium text-text-primary">
          {label}
          {external && (
            <span className="material-symbols-outlined text-[15px] text-text-secondary" aria-hidden>open_in_new</span>
          )}
        </span>
        <span className="mt-0.5 block font-label-md text-label-md text-text-secondary">{hint}</span>
      </span>
    </div>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  }
  return <Link href={href}>{inner}</Link>;
}
