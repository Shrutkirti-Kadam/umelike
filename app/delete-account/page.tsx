"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthPanel } from "@/components/AuthPanel";
import { SiteFrame } from "@/components/SiteFrame";
import { supabase } from "@/lib/supabase";

/*
 * /delete-account
 *
 * The page Google Play requires: delete your account without the app.
 * Also download your data first, and change your mind within 14 days.
 *
 * Sign-in is the site's own AuthPanel with allowSignup={false}, so an
 * unknown email is refused rather than turned into a new account.
 *
 * Every action is an RPC the app already calls — same rules, same grace
 * period, same export limit. The website is just another client.
 */

type Screen = "checking" | "auth" | "account" | "done" | "error" | "purge";

type AccountState = {
  state: "active" | "pending_deletion" | "purge_due";
  purge_at?: string | null;
  days_left?: number | null;
};

const card = `
  rounded-[26px]
  border
  border-white/50
  bg-white/[0.26]
  px-8
  py-8
  shadow-[0_20px_60px_rgba(58,38,58,0.10)]
  backdrop-blur-[32px]
  backdrop-saturate-[145%]
`;

const pill = `
  inline-flex
  min-h-[52px]
  w-full
  items-center
  justify-center
  rounded-full
  border
  px-6
  text-[14px]
  font-medium
  backdrop-blur-xl
  transition
  duration-300
  hover:-translate-y-[1px]
  active:translate-y-0
  active:scale-[0.985]
  disabled:cursor-default
  disabled:opacity-40
  disabled:hover:translate-y-0
`;

const pillLight = `${pill} border-[#49394c]/10 bg-white/75 text-[#352a38] shadow-[0_5px_30px_rgba(61,42,61,0.10)] hover:bg-white/90`;
const pillBerry = `${pill} border-[#9b5267]/40 bg-[#9b5267]/10 text-[#814255] hover:bg-[#9b5267]/16`;
const pillDanger = `${pill} border-[#b4514a]/40 bg-[#b4514a]/10 text-[#8f3d37] hover:bg-[#b4514a]/16`;

function fmt(iso?: string | null) {
  if (!iso) return "the scheduled date";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "the scheduled date";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DeleteAccountPage() {
  const router = useRouter();

  const [screen, setScreen] = useState<Screen>("checking");
  const [email, setEmail] = useState<string>("");
  const [account, setAccount] = useState<AccountState | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [purgeAt, setPurgeAt] = useState<string | null>(null);

  // ---------------------------------------------------------------------
  // SESSION → ACCOUNT STATE
  // ---------------------------------------------------------------------

  const loadAccount = useCallback(async () => {
    setError("");

    const { data, error } =
      await supabase.rpc("my_account_state");

    if (error || !data || typeof data !== "object") {
      setError("We couldn't load your account. Please try again.");
      setScreen("error");
      return;
    }

    const next =
      data as AccountState;

    if (
      next.state !== "active" &&
      next.state !== "pending_deletion" &&
      next.state !== "purge_due"
    ) {
      setError("We couldn't confirm your account state. Please try again.");
      setScreen("error");
      return;
    }

    setAccount(next);

    if (next.state === "purge_due") {
      setScreen("purge");
      return;
    }

    setScreen("account");
  }, []);

  useEffect(() => {
    let active = true;

    async function boot() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session) {
        setScreen("auth");
        return;
      }

      setEmail(session.user.email ?? "");
      await loadAccount();
    }

    void boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "SIGNED_OUT") {
        // After a deletion request we show the done screen; otherwise
        // a sign-out returns to the sign-in panel.
        setScreen((current) => (current === "done" ? "done" : "auth"));
        setAccount(null);
        return;
      }

      if (session && event === "SIGNED_IN") {
        setEmail(session.user.email ?? "");
        void loadAccount();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadAccount]);

  // ---------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------

  async function download() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");

    const { data, error } = await supabase.rpc("request_data_export");

    setBusy(false);

    if (error) {
      setError("We couldn't build your export. Please try again.");
      return;
    }

    if (data?.state === "rate_limited") {
      const at =
        data.retry_at
          ? new Date(data.retry_at)
          : null;

      setError(
        at && !Number.isNaN(at.getTime())
          ? `You can download again after ${at.toLocaleString()}.`
          : "You can download your data once a day.",
      );
      return;
    }

    if (
      data?.state !== "ready" ||
      !data.data ||
      typeof data.data !== "object"
    ) {
      setError("We couldn't build your export. Please try again.");
      return;
    }

    const json = JSON.stringify(data.data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `umelike-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setNotice("Your data is downloading.");
  }

  async function requestDeletion() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");

    const { data, error } = await supabase.rpc("request_account_deletion", {
      p_reason: reason.trim() || null,
    });

    if (error) {
      setBusy(false);
      setError("We couldn't delete your account right now. Please try again.");
      return;
    }

    setPurgeAt(data?.purge_at ?? null);
    setScreen("done");
    setConfirm(false);

    // Signed out on purpose. The deletion request has already succeeded
    // server-side, so a local sign-out failure must not be reported as a
    // deletion failure.
    const {
      error: signOutError,
    } =
      await supabase.auth.signOut();

    if (signOutError) {
      setNotice(
        "Deletion is scheduled, but this browser could not finish signing out. Use Sign out above or close this page.",
      );
    }

    setBusy(false);
  }

  async function cancelDeletion() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "cancel_account_deletion",
      );

    setBusy(false);

    if (error || !data || typeof data !== "object") {
      setError("We couldn't restore your account. Please try again.");
      return;
    }

    if (
      data.state === "cancelled" ||
      data.state === "none"
    ) {
      setNotice("Your account is active again.");
      await loadAccount();
      return;
    }

    if (data.state === "purge_due") {
      setAccount({
        state: "purge_due",
        purge_at: data.purge_at ?? account?.purge_at ?? null,
        days_left: 0,
      });
      setScreen("purge");
      return;
    }

    setError("We couldn't confirm that your account was restored. Please try again.");
  }

  // ---------------------------------------------------------------------
  // SCREENS
  // ---------------------------------------------------------------------

  if (screen === "checking") {
    return (
      <SiteFrame>
        <div className={`${card} text-center`}>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-[#9b5267]/20 border-t-[#9b5267]" />
          <p className="mt-5 text-[13px] text-[#695969]">Getting things ready…</p>
        </div>
      </SiteFrame>
    );
  }

  if (screen === "error") {
    return (
      <SiteFrame>
        <div className={`${card} text-center`}>
          <h1 className="font-display text-[28px] font-medium tracking-[-0.035em] text-[#2d2230]">
            We couldn&apos;t load your account
          </h1>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#695969]">
            Nothing has been changed. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => void loadAccount()}
            className={`${pillLight} mt-5`}
          >
            Try again
          </button>
          {error && (
            <p className="mt-4 text-[12px] text-[#8f3d37]">
              {error}
            </p>
          )}
        </div>
      </SiteFrame>
    );
  }

  if (screen === "purge") {
    return (
      <SiteFrame>
        <div className={card}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b5267]">
            Restoration period ended
          </p>
          <h1 className="font-display mt-3 text-[28px] font-medium leading-[1.15] tracking-[-0.035em] text-[#2d2230]">
            Your account can no longer be restored
          </h1>
          <p className="mt-4 text-[14px] leading-[1.7] text-[#453747]">
            The 14-day restoration period ended on{" "}
            <strong className="font-semibold">
              {fmt(account?.purge_at)}
            </strong>
            . Your account is waiting for permanent deletion.
          </p>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#695969]">
            If you believe this is a mistake, contact privacy@umelike.in.
          </p>
        </div>
      </SiteFrame>
    );
  }

  if (screen === "auth") {
    return (
      <SiteFrame>
        <div className="mb-6 text-center">
          <h1 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.04em] text-[#2d2230] sm:text-[36px]">
            Your umelike account
          </h1>
          <p className="mt-3 text-[14px] leading-[1.7] text-[#695969]">
            Download your data or delete your account — without the app.
            Sign in with the email you use on umelike.
          </p>
        </div>

        <AuthPanel onBack={() => router.push("/")} allowSignup={false} />

        <p className="mt-5 text-center text-[12px] text-[#725f70]/70">
          This page only signs in to accounts that already exist. It never creates one.
        </p>
      </SiteFrame>
    );
  }

  if (screen === "done") {
    return (
      <SiteFrame>
        <div className={card}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b5267]">
            Deletion requested
          </p>
          <h1 className="font-display mt-3 text-[28px] font-medium leading-[1.15] tracking-[-0.035em] text-[#2d2230]">
            Your profile is gone from umelike
          </h1>
          <p className="mt-4 text-[14px] leading-[1.7] text-[#453747]">
            Nothing is permanently destroyed yet. If you change your mind, sign in — here or in
            the app — before <strong className="font-semibold">{fmt(purgeAt)}</strong> and everything
            comes back exactly as it was.
          </p>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#695969]">
            After that date your profile, photos, matches and messages are permanently erased.
            Safety reports, if any, are kept without your profile attached — our{" "}
            <a href="/privacy" className="text-[#9b5267] underline-offset-2 hover:underline">
              Privacy Policy
            </a>{" "}
            explains why.
          </p>
          <p className="mt-6 text-center text-[12px] text-[#725f70]/70">
            {notice || "You have been signed out."}
          </p>
        </div>
      </SiteFrame>
    );
  }

  // screen === "account"
  if (!account) {
    return (
      <SiteFrame>
        <div className={`${card} text-center`}>
          <p className="text-[13px] text-[#695969]">
            We couldn&apos;t confirm your account state.
          </p>
          <button
            type="button"
            onClick={() => void loadAccount()}
            className={`${pillLight} mt-5`}
          >
            Try again
          </button>
        </div>
      </SiteFrame>
    );
  }

  const pending =
    account.state === "pending_deletion";

  return (
    <SiteFrame>
      <div className="mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b5267]">
          Signed in as {email}
        </p>
        <h1 className="font-display mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.04em] text-[#2d2230] sm:text-[36px]">
          {pending ? "Deletion is scheduled" : "Your umelike account"}
        </h1>
      </div>

      {pending && (
        <div className={`${card} mb-4 border-[#9b5267]/30`}>
          <p className="text-[14px] leading-[1.7] text-[#453747]">
            Your profile is hidden and your account will be permanently erased on{" "}
            <strong className="font-semibold">{fmt(account?.purge_at)}</strong>
            {account?.days_left != null &&
              ` — ${account.days_left} ${account.days_left === 1 ? "day" : "days"} from now`}
            .
          </p>
          <p className="mt-2 text-[13px] text-[#695969]">
            Restore it now and everything comes back exactly as it was.
          </p>
          <button type="button" onClick={() => void cancelDeletion()} disabled={busy} className={`${pillLight} mt-5`}>
            {busy ? "Restoring…" : "Restore my account"}
          </button>
        </div>
      )}

      <div className={`${card} mb-4`}>
        <h2 className="font-display text-[20px] font-medium tracking-[-0.02em] text-[#2d2230]">
          Download my data
        </h2>
        <p className="mt-2 text-[13px] leading-[1.7] text-[#695969]">
          A JSON file with your account, profile, preferences, matches, messages and history.
          Once a day.
        </p>
        <button type="button" onClick={() => void download()} disabled={busy} className={`${pillLight} mt-5`}>
          {busy ? "Preparing…" : "Download"}
        </button>
      </div>

      {!pending && (
        <div className={card}>
          <h2 className="font-display text-[20px] font-medium tracking-[-0.02em] text-[#2d2230]">
            Delete my account
          </h2>

          <ul className="mt-4 space-y-3 text-[13px] leading-[1.6]">
            <li className="flex gap-3">
              <span className="mt-[7px] h-2 w-2 flex-none rounded-full bg-[#cb7e28]" />
              <span>
                <strong className="block font-medium text-[#2d2230]">You have 14 days to change your mind</strong>
                <span className="text-[#695969]">Your profile disappears straight away. Sign back in within 14 days and everything comes back.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-[7px] h-2 w-2 flex-none rounded-full bg-[#b4514a]" />
              <span>
                <strong className="block font-medium text-[#2d2230]">Your matches and chats are deleted</strong>
                <span className="text-[#695969]">For both sides. The people you matched with lose the conversation too.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-[7px] h-2 w-2 flex-none rounded-full bg-[#b4514a]" />
              <span>
                <strong className="block font-medium text-[#2d2230]">Your photos are permanently erased</strong>
                <span className="text-[#695969]">Profile photos and any verification selfie are deleted from storage, not just hidden.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-[7px] h-2 w-2 flex-none rounded-full bg-[#9b5267]" />
              <span>
                <strong className="block font-medium text-[#2d2230]">Safety reports are kept</strong>
                <span className="text-[#695969]">If anyone reported you, that report stays on file without your profile. We keep it to protect other members.</span>
              </span>
            </li>
          </ul>

          {!confirm ? (
            <button type="button" onClick={() => setConfirm(true)} disabled={busy} className={`${pillDanger} mt-6`}>
              Delete my account
            </button>
          ) : (
            <div className="mt-6 space-y-3">
              <label className="block text-[12px] text-[#695969]" htmlFor="reason">
                Why are you leaving? Optional — it genuinely helps.
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 1000))}
                disabled={busy}
                placeholder="Anything at all."
                className="min-h-[84px] w-full resize-y rounded-[18px] border border-white/60 bg-white/50 px-4 py-3 text-[14px] text-[#2d2230] placeholder:text-[#695969]/60 backdrop-blur-xl focus:border-[#9b5267]/50 focus:outline-none"
              />
              <button type="button" onClick={() => void requestDeletion()} disabled={busy} className={pillDanger}>
                {busy ? "Deleting…" : "Yes, delete my account"}
              </button>
              <button type="button" onClick={() => setConfirm(false)} disabled={busy} className={pillBerry}>
                Keep my account
              </button>
            </div>
          )}
        </div>
      )}

      {notice && <p className="mt-4 text-center text-[13px] text-[#695969]">{notice}</p>}
      {error && <p className="mt-4 text-center text-[13px] text-[#8f3d37]">{error}</p>}
    </SiteFrame>
  );
}
