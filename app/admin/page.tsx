"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AdminSignIn } from "@/components/AdminSignIn";
import { SiteFrame } from "@/components/SiteFrame";
import { adminSupabase } from "@/lib/adminSupabase";
import {
  STUCK_KEYS,
  ago,
  bucketLabel,
  clock,
  cronTone,
  healthState,
  hours,
  loadHealth,
  loadRole,
  loadSeries,
  loadSnapshot,
  n,
  num,
  queueLabel,
  rowValue,
  seriesPeak,
  seriesTotal,
  type Health,
  type Role,
  type Series,
  type Snapshot,
} from "@/lib/metrics";

/*
 * /admin — the launch numbers, for the people who run umelike.
 *
 * The same three staff RPCs the app's Numbers screen reads
 * (mod_metrics_snapshot, mod_metrics_series, mod_health), rendered for a
 * laptop. Every figure is an aggregate; no member is ever named. The server
 * decides who may call them — ume_require_admin — so this page can only
 * ever show what the signed-in account is allowed to see, and a member who
 * finds the URL sees a sign-in, then "not on the moderation team".
 *
 * Session: the admin client keeps it in sessionStorage, so it survives a
 * reload and dies with the tab. Thirty idle minutes also sign you out.
 * While the tab is visible the numbers refresh themselves every minute.
 */

type Screen = "checking" | "auth" | "denied" | "loading" | "ready" | "error";
type Bucket = "day" | "week";

const REFRESH_MS = 60_000;
const IDLE_MS = 30 * 60_000;

const METRICS: ReadonlyArray<readonly [string, string]> = [
  ["signups", "Signups"],
  ["onboarded", "Onboarded"],
  ["selfies", "Selfies"],
  ["approved", "Approved"],
  ["likes", "Likes"],
  ["matches", "Matches"],
  ["messages", "Messages"],
  ["actors", "Active"],
  ["reports", "Reports"],
  ["packs", "Packs"],
  ["platinum_new", "Platinum"],
  ["deletions", "Deletions"],
];

const GOOD = "#4f8a5b";
const BAD = "#8f3d37";
const GOLD = "#cb7e28";
const BERRY = "#9b5267";
const PLUM = "#2d2230";
const MAUVE = "#695969";

const card = `
  rounded-[26px]
  border
  border-white/50
  bg-white/[0.26]
  px-7
  py-6
  shadow-[0_20px_60px_rgba(58,38,58,0.10)]
  backdrop-blur-[32px]
  backdrop-saturate-[145%]
`;

const pill = `
  inline-flex
  items-center
  justify-center
  rounded-full
  border
  px-4
  py-2
  text-[12px]
  font-medium
  backdrop-blur-xl
  transition
  duration-300
  disabled:cursor-default
  disabled:opacity-40
`;

const pillLight = `${pill} border-[#49394c]/10 bg-white/70 text-[#352a38] shadow-[0_5px_20px_rgba(61,42,61,0.08)] hover:bg-white/90`;
const pillBerry = `${pill} border-[#9b5267]/40 bg-[#9b5267]/10 text-[#814255] hover:bg-[#9b5267]/20`;
const chipOn = `${pill} border-[#9b5267]/50 bg-[#9b5267]/10 text-[#814255]`;
const chipOff = `${pill} border-[#49394c]/10 bg-white/40 text-[#5f4d60] hover:bg-white/70`;

export default function AdminPage() {
  const [screen, setScreen] = useState<Screen>("checking");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(null);

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  const [bucket, setBucket] = useState<Bucket>("day");
  const [metric, setMetric] = useState("signups");

  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const bucketRef = useRef<Bucket>("day");
  // Invalidates in-flight responses on sign-out or when a newer load starts.
  const loadEpoch = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------
  // DATA
  // ---------------------------------------------------------------------

  const load = useCallback(async (first: boolean) => {
    const requestEpoch = ++loadEpoch.current;
    const client = adminSupabase();
    if (first) setScreen("loading");
    else setRefreshing(true);
    setError("");

    try {
      const b = bucketRef.current;
      const [s, t, h] = await Promise.all([
        loadSnapshot(client),
        loadSeries(client, b, b === "day" ? 14 : 8),
        loadHealth(client),
      ]);
      if (requestEpoch !== loadEpoch.current) return;
      setSnapshot(s);
      setSeries(t);
      setHealth(h);
      setScreen("ready");
    } catch (err) {
      if (requestEpoch !== loadEpoch.current) return;
      const message = err instanceof Error ? err.message : String(err);
      if (/not authorised|not authenticated/i.test(message)) {
        setScreen("denied");
        return;
      }
      setError(message);
      // A failed refresh must not leave an old green verdict on screen.
      setHealth(null);
      if (first) setScreen("error");
    } finally {
      if (requestEpoch === loadEpoch.current) setRefreshing(false);
    }
  }, []);

  const gate = useCallback(async () => {
    const client = adminSupabase();
    try {
      const r = await loadRole(client);
      if (!r) {
        // Not staff: drop the session straight away, then say so.
        await client.auth.signOut();
        setRole(null);
        setScreen("denied");
        return;
      }
      setRole(r);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setScreen("error");
    }
  }, [load]);

  const signOut = useCallback(async () => {
    loadEpoch.current += 1;
    const { error: signOutError } = await adminSupabase().auth.signOut();
    if (signOutError) {
      setError("Sign-out failed. Close this tab and try again.");
      setScreen("error");
      return;
    }
    setSnapshot(null);
    setSeries(null);
    setHealth(null);
    setRole(null);
    setScreen("auth");
  }, []);

  // ---------------------------------------------------------------------
  // SESSION
  // ---------------------------------------------------------------------

  useEffect(() => {
    let active = true;
    const client = adminSupabase();

    void (async () => {
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!active) return;
      if (!session) {
        setScreen("auth");
        return;
      }
      setEmail(session.user.email ?? "");
      await gate();
    })();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        loadEpoch.current += 1;
        setScreen((current) => (current === "denied" ? "denied" : "auth"));
        setSnapshot(null);
        setSeries(null);
        setHealth(null);
        setRole(null);
        return;
      }
      if (session) setEmail(session.user.email ?? "");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [gate]);

  // Refresh every minute while the tab is visible and the numbers are up.
  useEffect(() => {
    if (screen !== "ready") return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load(false);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [screen, load]);

  // Thirty idle minutes end the session.
  useEffect(() => {
    if (screen !== "ready" && screen !== "loading") return;

    const arm = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => void signOut(), IDLE_MS);
    };

    arm();
    const events: Array<keyof DocumentEventMap> = ["pointerdown", "keydown", "scroll", "visibilitychange"];
    events.forEach((e) => document.addEventListener(e, arm, { passive: true }));

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      events.forEach((e) => document.removeEventListener(e, arm));
    };
  }, [screen, signOut]);

  // ---------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------

  async function changeBucket(next: Bucket) {
    if (next === bucket) return;
    const requestEpoch = loadEpoch.current;
    setBucket(next);
    bucketRef.current = next;
    try {
      const nextSeries = await loadSeries(adminSupabase(), next, next === "day" ? 14 : 8);
      if (requestEpoch !== loadEpoch.current || bucketRef.current !== next) return;
      setSeries(nextSeries);
    } catch (err) {
      if (requestEpoch === loadEpoch.current && bucketRef.current === next) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }

  async function copyJson() {
    if (!snapshot || !health) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify({ snapshot, series, health }, null, 2),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy — your browser blocked clipboard access.");
    }
  }

  // ---------------------------------------------------------------------
  // SCREENS
  // ---------------------------------------------------------------------

  if (screen === "checking" || screen === "loading") {
    return (
      <SiteFrame>
        <div className={`${card} text-center`}>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-[#9b5267]/20 border-t-[#9b5267]" />
          <p className="mt-5 text-[13px] text-[#695969]">
            {screen === "checking" ? "Checking your session…" : "Counting…"}
          </p>
        </div>
      </SiteFrame>
    );
  }

  if (screen === "auth") {
    return (
      <SiteFrame>
        <AdminSignIn
          onSignedIn={() => {
            void (async () => {
              const {
                data: { session },
              } = await adminSupabase().auth.getSession();
              setEmail(session?.user.email ?? "");
              await gate();
            })();
          }}
        />
      </SiteFrame>
    );
  }

  if (screen === "denied") {
    return (
      <SiteFrame>
        <div className={`${card} text-center`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b5267]">
            Moderation team only
          </p>
          <h1 className="font-display mt-3 text-[28px] font-medium tracking-[-0.035em] text-[#2d2230]">
            This account isn&apos;t on the team
          </h1>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#695969]">
            The numbers are only shown to staff accounts. You have been signed out of this page;
            nothing else has changed.
          </p>
          <button type="button" onClick={() => setScreen("auth")} className={`${pillLight} mt-5 w-full min-h-[48px]`}>
            Sign in with another email
          </button>
        </div>
      </SiteFrame>
    );
  }

  if (screen === "error" || !snapshot) {
    return (
      <SiteFrame>
        <div className={`${card} text-center`}>
          <h1 className="font-display text-[28px] font-medium tracking-[-0.035em] text-[#2d2230]">
            The numbers didn&apos;t load
          </h1>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#695969]">
            Nothing has been changed. Check the connection and try again.
          </p>
          {error && <p className="mt-3 break-words text-[12px] text-[#8f3d37]">{error}</p>}
          <div className="mt-5 flex justify-center gap-3">
            <button type="button" onClick={() => void load(true)} className={pillLight}>
              Try again
            </button>
            <button type="button" onClick={() => void signOut()} className={pillBerry}>
              Sign out
            </button>
          </div>
        </div>
      </SiteFrame>
    );
  }

  const s = snapshot;

  return (
    <SiteFrame wide animatedBackground={false}>
      {/* HEADER ROW */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b5267]">
            {role === "admin" ? "Admin" : "Moderator"} · {email}
          </p>
          <h1 className="font-display mt-2 text-[34px] font-medium leading-[1.05] tracking-[-0.04em] text-[#2d2230] sm:text-[40px]">
            Numbers
          </h1>
          <p className="mt-2 text-[12px] text-[#725f70]/80">
            {s.timezone} · updated {clock(s.generated_at)}
            {refreshing ? " · refreshing…" : " · refreshes every minute while this tab is open"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load(false)} disabled={refreshing} className={pillLight}>
            Refresh
          </button>
          <button type="button" onClick={() => void copyJson()} className={pillLight}>
            {copied ? "Copied" : "Copy as JSON"}
          </button>
          <button type="button" onClick={() => void signOut()} className={pillBerry}>
            Sign out
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-[12px] text-[#8f3d37]">{error}</p>}

      {/* TODAY */}
      <section className={card}>
        <SectionLabel text="Last 24 hours" />
        <div className="mt-4 grid grid-cols-4 gap-y-6 sm:grid-cols-8">
          <Big label="New" value={n(s.members, "new_24h")} color={GOLD} />
          <Big label="Active" value={n(s.members, "active_24h")} color={GOOD} />
          <Big label="Likes" value={n(s.activity, "likes_24h")} color={BERRY} />
          <Big label="Matches" value={n(s.activity, "matches_24h")} color={BERRY} />
          <Big label="Messages" value={n(s.activity, "messages_24h")} color={PLUM} />
          <Big
            label="Selfies"
            value={n(s.verification, "pending")}
            color={n(s.verification, "pending") > 0 ? GOLD : GOOD}
            hint="pending review"
          />
          <Big
            label="Reports"
            value={n(s.safety, "reports_open")}
            color={n(s.safety, "reports_open") > 0 ? BAD : GOOD}
            hint="open"
          />
          <Big
            label="Locked"
            value={n(s.members, "locked")}
            color={n(s.members, "locked") > 0 ? BAD : MAUVE}
            hint="by the gate"
          />
        </div>
      </section>

      {/* GROUPS */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Group
          title="Members"
          cells={[
            ["Total", n(s.members, "total")],
            ["Onboarded", n(s.members, "onboarded")],
            ["Verified", n(s.members, "verified")],
            ["Locked", n(s.members, "locked")],
            ["Paused", n(s.members, "paused")],
            ["Deleting", n(s.members, "deleting")],
            ["New 7d", n(s.members, "new_7d")],
            ["Active 7d", n(s.members, "active_7d")],
            ["Push on", n(s.members, "push_enabled")],
          ]}
          warn={["Locked", "Deleting"]}
        />

        <Group
          title="Verification"
          trailing={
            s.verification.gate_enabled === true
              ? { text: "gate on", color: GOOD }
              : { text: "gate off — nobody is locked", color: GOLD }
          }
          cells={[
            ["Pending", n(s.verification, "pending")],
            ["Submitted 24h", n(s.verification, "submitted_24h")],
            ["Approved 24h", n(s.verification, "approved_24h")],
            ["Rejected 24h", n(s.verification, "rejected_24h")],
            ["Approved 7d", n(s.verification, "approved_7d")],
            ["Rejected 7d", n(s.verification, "rejected_7d")],
            ["Revoked 7d", n(s.verification, "revoked_7d")],
            ["Reviewers", n(s.verification, "reviewers_enabled")],
          ]}
          warn={["Pending", "Revoked 7d"]}
          lines={[
            [
              "Oldest pending",
              hours(num(s.verification, "oldest_pending_hours")),
              (num(s.verification, "oldest_pending_hours") ?? 0) > 24 ? BAD : PLUM,
            ],
            ["Median time to review, 7d", hours(num(s.verification, "median_review_hours_7d")), PLUM],
          ]}
        />

        <Group
          title="Activity"
          cells={[
            ["Likes 24h", n(s.activity, "likes_24h")],
            ["Likes 7d", n(s.activity, "likes_7d")],
            ["Passes 24h", n(s.activity, "passes_24h")],
            ["Matches 24h", n(s.activity, "matches_24h")],
            ["Matches 7d", n(s.activity, "matches_7d")],
            ["Open matches", n(s.activity, "matches_open")],
            ["Messages 24h", n(s.activity, "messages_24h")],
            ["Messages 7d", n(s.activity, "messages_7d")],
            ["Chats 24h", n(s.activity, "conversations_24h")],
            ["Refreshes 24h", n(s.activity, "refreshes_24h")],
          ]}
        />

        <Group
          title="Safety"
          cells={[
            ["Open reports", n(s.safety, "reports_open")],
            ["Reports 24h", n(s.safety, "reports_24h")],
            ["Resolved 24h", n(s.safety, "resolved_24h")],
            ["Blocks 24h", n(s.safety, "blocks_24h")],
            ["Filtered 24h", n(s.safety, "filtered_24h")],
            ["Actions 24h", n(s.safety, "actions_24h")],
            ["Suspended", n(s.safety, "suspended")],
            ["Banned", n(s.safety, "banned")],
            ["Signup flags", n(s.safety, "signup_flags")],
            ["Holds", n(s.safety, "holds_active")],
          ]}
          warn={["Open reports", "Banned", "Holds"]}
          lines={[
            [
              "Oldest open report",
              hours(num(s.safety, "reports_oldest_hours")),
              (num(s.safety, "reports_oldest_hours") ?? 0) > 24 ? BAD : PLUM,
            ],
          ]}
        />

        <Group
          title="Money"
          cells={[
            ["Platinum", n(s.money, "platinum_active")],
            ["Play active", n(s.money, "platinum_play_active")],
            ["Platinum new 7d", n(s.money, "platinum_new_7d")],
            ["Packs 24h", n(s.money, "packs_24h")],
            ["Packs 7d", n(s.money, "packs_7d")],
            ["Credits sold 7d", n(s.money, "credits_sold_7d")],
            ["Credits held", n(s.money, "credits_outstanding")],
            ["Credits spent 24h", n(s.money, "credits_spent_24h")],
          ]}
          lines={[
            ["Rupee figures live in Play Console; this is counts only.", "", MAUVE],
          ]}
        />

        <Trend
          series={series}
          bucket={bucket}
          metric={metric}
          onBucket={(b) => void changeBucket(b)}
          onMetric={setMetric}
        />
      </div>

      {/* HEALTH */}
      <div className="mt-4">
        <HealthCard health={health} />
      </div>

      <p className="mt-5 px-2 text-[11px] leading-[1.6] text-[#725f70]/70">
        Counts exclude reviewer accounts and practice bots
        {n(s.system, "bots_present") > 0 ? ` (${n(s.system, "bots_present")} bot(s) still present)` : ""}.
        {s.system.migrations_applied != null
          ? ` Schema: ${s.system.migrations_applied} migrations, last ${s.system.migration_last}.`
          : ""}{" "}
        Database {num(s.system, "db_size_mb") ?? "?"} MB. The session ends when this tab closes or after
        thirty idle minutes.
      </p>
    </SiteFrame>
  );
}

// =============================================================================
// PIECES
// =============================================================================

function SectionLabel({ text, trailing }: { text: string; trailing?: { text: string; color: string } }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#725f70]/80">{text}</p>
      {trailing && (
        <p className="text-[11px] font-semibold" style={{ color: trailing.color }}>
          {trailing.text}
        </p>
      )}
    </div>
  );
}

function Big({ label, value, color, hint }: { label: string; value: number; color: string; hint?: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-[30px] font-medium leading-none tracking-[-0.03em]" style={{ color }}>
        {value}
      </div>
      <div className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#5f4d60]">{label}</div>
      {hint && <div className="text-[10px] text-[#725f70]/70">{hint}</div>}
    </div>
  );
}

type Line = readonly [string, string, string];

function Group({
  title,
  cells,
  warn = [],
  lines = [],
  trailing,
}: {
  title: string;
  cells: ReadonlyArray<readonly [string, number]>;
  warn?: ReadonlyArray<string>;
  lines?: ReadonlyArray<Line>;
  trailing?: { text: string; color: string };
}) {
  return (
    <section className={card}>
      <SectionLabel text={title} trailing={trailing} />
      <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-5">
        {cells.map(([label, value]) => {
          const hot = warn.includes(label) && value > 0;
          return (
            <div key={label}>
              <div
                className="font-display text-[24px] font-medium leading-none tracking-[-0.03em]"
                style={{ color: hot ? GOLD : PLUM }}
              >
                {value}
              </div>
              <div className="mt-1 truncate text-[11px] font-medium text-[#5f4d60]">{label}</div>
            </div>
          );
        })}
      </div>
      {lines.length > 0 && (
        <div className="mt-5 space-y-1 border-t border-[#49394c]/10 pt-4">
          {lines.map(([label, value, color]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 text-[12.5px]">
              <span className="text-[#695969]">{label}</span>
              <span className="font-semibold" style={{ color }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Trend({
  series,
  bucket,
  metric,
  onBucket,
  onMetric,
}: {
  series: Series | null;
  bucket: Bucket;
  metric: string;
  onBucket: (b: Bucket) => void;
  onMetric: (m: string) => void;
}) {
  const peak = series ? seriesPeak(series, metric) : 1;
  const total = series ? seriesTotal(series, metric) : 0;
  const metricLabel = METRICS.find(([k]) => k === metric)?.[1] ?? metric;

  return (
    <section className={`${card} lg:col-span-2`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel text="Trend" />
        <div className="flex gap-2">
          <button type="button" onClick={() => onBucket("day")} className={bucket === "day" ? chipOn : chipOff}>
            14 days
          </button>
          <button type="button" onClick={() => onBucket("week")} className={bucket === "week" ? chipOn : chipOff}>
            8 weeks
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {METRICS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onMetric(key)}
            className={`${metric === key ? chipOn : chipOff} !px-3 !py-1.5 !text-[11px]`}
          >
            {label}
          </button>
        ))}
      </div>

      {!series || series.rows.length === 0 ? (
        <p className="mt-8 text-center text-[13px] text-[#695969]">No data yet.</p>
      ) : (
        <>
          <div className="mt-6 flex h-[160px] items-end gap-[6px]">
            {series.rows.map((row, i) => {
              const v = rowValue(row, metric);
              const h = v === 0 ? 2 : Math.max(4, Math.round((160 * v) / peak));
              const last = i === series.rows.length - 1;
              return (
                <div
                  key={row.bucket}
                  className="group relative flex-1"
                  title={`${bucketLabel(row.bucket, series.bucket)}: ${v}`}
                >
                  <div
                    className="w-full rounded-[4px] transition-[height] duration-300"
                    style={{
                      height: `${h}px`,
                      background: v === 0 ? "rgba(73,57,76,0.12)" : last ? BERRY : "rgba(155,82,103,0.5)",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-[#725f70]/80">
            <span>{bucketLabel(series.rows[0].bucket, series.bucket)}</span>
            <span>
              {metricLabel}: {total} in window · peak {peak}
            </span>
            <span>{bucketLabel(series.rows[series.rows.length - 1].bucket, series.bucket)}</span>
          </div>
        </>
      )}
    </section>
  );
}

function HealthCard({ health }: { health: Health | null }) {
  if (!health) {
    return (
      <section className={card}>
        <SectionLabel text="Health" />
        <p className="mt-4 text-[13px] text-[#695969]">Health not loaded.</p>
      </section>
    );
  }

  const state = healthState(health);
  const verdictColor = state === "clear" ? GOOD : state === "incomplete" ? GOLD : BAD;
  const verdictText =
    state === "clear"
      ? "All clear"
      : state === "incomplete"
        ? "Health check incomplete"
        : "Something needs a look";
  const stuck = STUCK_KEYS.filter((k) => n(health.queues, k) > 0);
  const q = health.queues;

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel text="Health" />
        <p className="text-[11px] text-[#725f70]/80">{clock(health.generated_at)}</p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Dot color={verdictColor} />
        <p className="font-display text-[22px] font-medium tracking-[-0.02em]" style={{ color: verdictColor }}>
          {verdictText}
        </p>
      </div>
      {state === "incomplete" && (
        <p className="mt-2 text-[12.5px] text-[#695969]">
          Part of the report could not be read, so nothing below is vouched for. The server&apos;s own
          notes are at the bottom of this card.
        </p>
      )}

      {stuck.length > 0 && (
        <div className="mt-4 space-y-1">
          {stuck.map((k) => (
            <HealthLine key={k} label={queueLabel(k)} value={`${n(q, k)}`} color={BAD} />
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#725f70]/80">Scheduled jobs</p>
          {health.cron.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-[#695969]">No jobs visible.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-[0.1em] text-[#725f70]/70">
                  <th className="pb-2 font-semibold"> </th>
                  <th className="pb-2 font-semibold">Job</th>
                  <th className="pb-2 font-semibold">Schedule</th>
                  <th className="pb-2 font-semibold">Last run</th>
                  <th className="pb-2 text-right font-semibold">Today</th>
                </tr>
              </thead>
              <tbody>
                {health.cron.map((j) => {
                  const tone = cronTone(j);
                  const color = tone === "good" ? GOOD : tone === "bad" ? BAD : MAUVE;
                  return (
                    <tr key={j.name} className="border-t border-[#49394c]/10">
                      <td className="py-2 pr-2">
                        <Dot color={color} />
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 font-medium text-[#2d2230]">{j.name.replace(/^umelike-/, "")}</td>
                      <td className="whitespace-nowrap py-2 pr-3 font-mono text-[11px] text-[#695969]">{j.schedule}</td>
                      <td className="py-2 pr-3" style={{ color }}>
                        {j.active ? `${j.last_status} · ${ago(j.last_start)}` : `paused · ${ago(j.last_start)}`}
                      </td>
                      <td className="py-2 text-right text-[#695969]">
                        {j.runs_24h}
                        {j.failed_24h > 0 ? <span style={{ color: BAD }}> · {j.failed_24h} failed</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>

        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#725f70]/80">
            Storage · network · database
          </p>
          <div className="mt-3 space-y-1">
            <HealthLine label="Verification photos waiting" value={`${n(health.storage, "verification_objects")}`} color={PLUM} />
            <HealthLine
              label="Verification photos not cleaned up"
              value={`${n(health.storage, "verification_objects_stale")}`}
              color={n(health.storage, "verification_objects_stale") > 0 ? BAD : PLUM}
            />
            <HealthLine label="Profile photos" value={`${n(health.storage, "profile_photo_objects")}`} color={PLUM} />
            <HealthLine
              label="Web calls failed, 6h"
              value={`${n(health.net, "http_failures_6h")} of ${n(health.net, "http_responses_6h")}`}
              color={n(health.net, "http_failures_6h") > 0 ? BAD : PLUM}
            />
            <HealthLine
              label="Database"
              value={`${num(health.system, "db_size_mb") ?? "?"} MB · ${health.system.migrations_applied ?? "?"} migrations · Postgres ${health.system.postgres ?? "?"}`}
              color={PLUM}
            />
            <HealthLine label="Unread notices, 7d" value={`${n(q, "notices_unread_7d")}`} color={PLUM} />
            <HealthLine
              label="Gate"
              value={q.gate_enabled === true ? `on · ${n(q, "reviewers_enabled")} reviewer(s)` : "off"}
              color={q.gate_enabled === true ? GOOD : GOLD}
            />
            {n(q, "bots_present") > 0 && (
              <HealthLine label="Practice bots still present" value={`${n(q, "bots_present")}`} color={GOLD} />
            )}
          </div>
        </div>
      </div>

      {health.errors.length > 0 && (
        <div className="mt-5 space-y-1 border-t border-[#49394c]/10 pt-4">
          {health.errors.map((e) => (
            <p key={e} className="break-words text-[11.5px]" style={{ color: BAD }}>
              {e}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

function HealthLine({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[12.5px]">
      <span className="text-[#695969]">{label}</span>
      <span className="text-right font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-[9px] w-[9px] rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
      aria-hidden="true"
    />
  );
}
