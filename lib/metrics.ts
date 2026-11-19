import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * Types, loaders and formatters for the staff numbers (M1 on the server).
 *
 * Three RPCs, all gated by ume_require_admin('moderator') in the database:
 *
 *   mod_metrics_snapshot()                 the state right now
 *   mod_metrics_series(p_bucket, p_count)  per day or per ISO week
 *   mod_health()                           cron, queues, storage, pg_net
 *
 * Everything is an aggregate — the server never returns a member row, a name,
 * an id or a cron command — so nothing here needs redaction before it is shown.
 * Keys are kept as the server sends them: a new number added on the server
 * appears in the raw objects without a client change.
 */

export type Counts = Record<string, number | string | boolean | null | undefined>;

export type Snapshot = {
  generated_at: string;
  timezone: string;
  members: Counts;
  verification: Counts;
  activity: Counts;
  safety: Counts;
  money: Counts;
  system: Counts;
};

export type SeriesRow = { bucket: string } & Record<string, number | string>;

export type Series = {
  bucket: "day" | "week";
  timezone: string;
  from: string;
  to: string;
  rows: SeriesRow[];
};

export type CronJob = {
  name: string;
  schedule: string;
  active: boolean;
  last_status: string;
  last_start: string | null;
  last_end: string | null;
  runs_24h: number;
  failed_24h: number;
};

export type Health = {
  generated_at: string;
  cron: CronJob[];
  queues: Counts;
  storage: Counts;
  net: Counts;
  system: Counts;
  errors: string[];
};

export type Role = "admin" | "moderator" | null;

// -----------------------------------------------------------------------------
// LOADERS
// -----------------------------------------------------------------------------

function asObject(data: unknown, what: string): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Unexpected ${what} response.`);
  }
  return data as Record<string, unknown>;
}

/** my_admin_role(): 'admin' | 'moderator' | null for the signed-in user. */
export async function loadRole(client: SupabaseClient): Promise<Role> {
  const { data, error } = await client.rpc("my_admin_role");
  if (error) throw error;
  return data === "admin" || data === "moderator" ? data : null;
}

export async function loadSnapshot(client: SupabaseClient): Promise<Snapshot> {
  const { data, error } = await client.rpc("mod_metrics_snapshot");
  if (error) throw error;
  const m = asObject(data, "snapshot");
  return {
    generated_at: String(m.generated_at ?? ""),
    timezone: String(m.timezone ?? "Asia/Kolkata"),
    members: (m.members as Counts) ?? {},
    verification: (m.verification as Counts) ?? {},
    activity: (m.activity as Counts) ?? {},
    safety: (m.safety as Counts) ?? {},
    money: (m.money as Counts) ?? {},
    system: (m.system as Counts) ?? {},
  };
}

export async function loadSeries(
  client: SupabaseClient,
  bucket: "day" | "week",
  count: number,
): Promise<Series> {
  const { data, error } = await client.rpc("mod_metrics_series", {
    p_bucket: bucket,
    p_count: count,
  });
  if (error) throw error;
  const m = asObject(data, "series");
  const rows = Array.isArray(m.rows) ? (m.rows as SeriesRow[]) : [];
  return {
    bucket: m.bucket === "week" ? "week" : "day",
    timezone: String(m.timezone ?? "Asia/Kolkata"),
    from: String(m.from ?? ""),
    to: String(m.to ?? ""),
    rows,
  };
}

export async function loadHealth(client: SupabaseClient): Promise<Health> {
  const { data, error } = await client.rpc("mod_health");
  if (error) throw error;
  const m = asObject(data, "health");
  return {
    generated_at: String(m.generated_at ?? ""),
    cron: Array.isArray(m.cron) ? (m.cron as CronJob[]) : [],
    queues: (m.queues as Counts) ?? {},
    storage: (m.storage as Counts) ?? {},
    net: (m.net as Counts) ?? {},
    system: (m.system as Counts) ?? {},
    errors: Array.isArray(m.errors) ? m.errors.map(String) : [],
  };
}

// -----------------------------------------------------------------------------
// READING
// -----------------------------------------------------------------------------

/** An integer count from a group, 0 when absent. */
export function n(group: Counts | undefined, key: string): number {
  const v = group?.[key];
  return typeof v === "number" ? Math.round(v) : 0;
}

/** A decimal (hours, MB) from a group, null when absent. */
export function num(group: Counts | undefined, key: string): number | null {
  const v = group?.[key];
  return typeof v === "number" ? v : null;
}

export function rowValue(row: SeriesRow, key: string): number {
  const v = row[key];
  return typeof v === "number" ? v : 0;
}

export function seriesTotal(series: Series, key: string): number {
  return series.rows.reduce((sum, r) => sum + rowValue(r, key), 0);
}

export function seriesPeak(series: Series, key: string): number {
  return series.rows.reduce((max, r) => Math.max(max, rowValue(r, key)), 1);
}

// -----------------------------------------------------------------------------
// HEALTH
// -----------------------------------------------------------------------------

/** Queue keys whose non-zero value means someone has to act. */
export const STUCK_KEYS = [
  "selfies_overdue",
  "reports_overdue",
  "deletions_overdue",
  "purge_claims_stuck",
  "badge_permits_lingering",
  "subscriptions_unswept",
  "matches_unswept",
] as const;

export function queueLabel(key: string): string {
  switch (key) {
    case "selfies_overdue":
      return "Selfies waiting over 24 h";
    case "reports_overdue":
      return "Reports open over 24 h";
    case "deletions_overdue":
      return "Deletions past their purge date";
    case "purge_claims_stuck":
      return "Purges claimed but not finished";
    case "badge_permits_lingering":
      return "Badge permits left behind";
    case "subscriptions_unswept":
      return "Expired subscriptions not swept";
    case "matches_unswept":
      return "Expired matches not swept";
    default:
      return key;
  }
}

export type Tone = "good" | "quiet" | "bad";

/** Red when the last run failed or anything failed today; grey when paused or never ran. */
export function cronTone(job: CronJob): Tone {
  if (job.last_status === "failed" || job.failed_24h > 0) return "bad";
  if (!job.active || job.last_status === "never") return "quiet";
  return "good";
}

export type HealthState = "clear" | "incomplete" | "attention";

/**
 * The verdict. "attention" wins over everything; "incomplete" means a part of
 * the report could not be read (the server's errors list is non-empty or a
 * section came back empty), so "clear" is only claimed when every section is
 * present and quiet. A missing section must never read as healthy.
 */
export function healthState(h: Health): HealthState {
  const hasFiniteCount = (group: Counts, key: string): boolean =>
    typeof group[key] === "number" && Number.isFinite(group[key]);

  const playExpiry = h.cron.find((j) => j.name === "umelike-play-expiry");
  const attention =
    STUCK_KEYS.some((k) => n(h.queues, k) > 0) ||
    h.cron.some((j) => cronTone(j) === "bad") ||
    (playExpiry !== undefined && !playExpiry.active) ||
    n(h.net, "http_failures_6h") > 0 ||
    n(h.storage, "verification_objects_stale") > 0;
  if (attention) return "attention";

  // Non-empty objects are not enough: every essential count must exist.
  // Missing counts should never silently turn into healthy zeroes.
  const incomplete =
    !Number.isFinite(Date.parse(h.generated_at)) ||
    h.errors.length > 0 ||
    h.cron.length === 0 ||
    !playExpiry ||
    STUCK_KEYS.some((k) => !hasFiniteCount(h.queues, k)) ||
    !hasFiniteCount(h.storage, "verification_objects_stale") ||
    !hasFiniteCount(h.net, "http_failures_6h") ||
    Object.keys(h.system).length === 0;
  return incomplete ? "incomplete" : "clear";
}

// -----------------------------------------------------------------------------
// FORMATTING
// -----------------------------------------------------------------------------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** '5 Nov' for a day bucket, 'w/c 3 Nov' for a week bucket. Buckets arrive as YYYY-MM-DD. */
export function bucketLabel(iso: string, bucket: "day" | "week"): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const text = `${d} ${MONTHS[m - 1] ?? ""}`;
  return bucket === "week" ? `w/c ${text}` : text;
}

export function hours(h: number | null): string {
  if (h === null) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h < 10 ? h.toFixed(1) : Math.round(h)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

export function clock(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function ago(iso: string | null): string {
  if (!iso) return "never ran";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  const s = Math.max(0, (Date.now() - t.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 172800) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
