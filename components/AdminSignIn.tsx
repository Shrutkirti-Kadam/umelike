"use client";

import { useState } from "react";

import { adminSupabase } from "@/lib/adminSupabase";

/*
 * Sign-in for /admin: the same 6-digit email code members use, against the
 * admin client (session in sessionStorage, gone when the tab closes), and
 * never a sign-up — shouldCreateUser is false, so an email that is not an
 * existing umelike account is refused.
 *
 * This is deliberately not the site's AuthPanel. AuthPanel is bound to the
 * shared client whose session lives in localStorage; a staff session must
 * not. The markup follows AuthPanel's so the page looks like the rest of
 * the site.
 */

type Props = {
  onSignedIn: () => void;
};

const card = `
  rounded-[28px]
  border
  border-white/55
  bg-white/[0.32]
  px-7
  py-9
  shadow-[0_22px_70px_rgba(58,38,58,0.12),inset_0_1px_0_rgba(255,255,255,0.55)]
  backdrop-blur-[34px]
  backdrop-saturate-[145%]
  sm:px-9
`;

const input = `
  mt-2
  h-[56px]
  w-full
  rounded-[18px]
  border
  border-[#4a394b]/10
  bg-white/45
  px-5
  text-[15px]
  text-[#332736]
  shadow-[inset_0_1px_0_rgba(255,255,255,.7)]
  outline-none
  backdrop-blur-xl
  transition
  placeholder:text-[#796b79]/50
  hover:border-[#9b5267]/20
  focus:border-[#9b5267]/45
  focus:bg-white/65
  focus:ring-4
  focus:ring-[#9b5267]/10
  disabled:opacity-60
`;

const primary = `
  mt-5
  flex
  h-[56px]
  w-full
  items-center
  justify-center
  rounded-full
  bg-[#2f2532]
  px-6
  text-[14px]
  font-medium
  text-[#f7eee6]
  shadow-[0_10px_28px_rgba(47,37,50,0.20)]
  transition
  hover:bg-[#3a2e3e]
  disabled:cursor-default
  disabled:opacity-40
`;

export function AdminSignIn({ onSignedIn }: Props) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cleanEmail = email.trim().toLowerCase();
  const validEmail = /^\S+@\S+\.\S+$/.test(cleanEmail);
  const validCode = /^\d{6}$/.test(code);

  async function sendCode() {
    if (busy || !validEmail) return;
    setBusy(true);
    setError("");

    const { error } = await adminSupabase().auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: false },
    });

    setBusy(false);

    if (error) {
      setError("We couldn't send a code. Use the email on your umelike account.");
      return;
    }

    setCode("");
    setStep("code");
  }

  async function verifyCode() {
    if (busy || !validCode) return;
    setBusy(true);
    setError("");

    const { error } = await adminSupabase().auth.verifyOtp({
      email: cleanEmail,
      token: code,
      type: "email",
    });

    setBusy(false);

    if (error) {
      setError("That code is incorrect or has expired.");
      return;
    }

    onSignedIn();
  }

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div className={card}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b5267]">
          Moderation team
        </p>

        <h1 className="font-display mt-3 text-[32px] font-medium leading-[1.08] tracking-[-0.04em] text-[#2d2230]">
          {step === "code" ? "Check your inbox." : "Sign in to see the numbers."}
        </h1>

        <p className="mt-4 text-[14px] leading-6 text-[#695969]">
          {step === "code" ? (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-[#49394c]">{cleanEmail}</span>.
            </>
          ) : (
            <>Same code sign-in as the app. Only staff accounts get past this page.</>
          )}
        </p>

        <div className="mt-7">
          {step === "email" ? (
            <>
              <label htmlFor="admin-email" className="ml-1 block text-[12px] font-medium text-[#5d4c5e]">
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@umelike.in"
                value={email}
                disabled={busy}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && validEmail) void sendCode();
                }}
                className={input}
              />
              <button
                type="button"
                disabled={!validEmail || busy}
                onClick={() => void sendCode()}
                className={primary}
              >
                {busy ? "Sending…" : "Send code"}
              </button>
            </>
          ) : (
            <>
              <label htmlFor="admin-code" className="ml-1 block text-[12px] font-medium text-[#5d4c5e]">
                6-digit code
              </label>
              <input
                id="admin-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="••••••"
                value={code}
                disabled={busy}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && validCode) void verifyCode();
                }}
                className={`${input} tracking-[0.3em]`}
              />
              <button
                type="button"
                disabled={!validCode || busy}
                onClick={() => void verifyCode()}
                className={primary}
              >
                {busy ? "Checking…" : "Sign in"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="mt-3 w-full text-center text-[12px] text-[#725f70]/80 transition hover:text-[#9b5267]"
              >
                Use a different email
              </button>
            </>
          )}
        </div>

        {error && <p className="mt-4 text-[12px] text-[#8f3d37]">{error}</p>}
      </div>

      <p className="mt-5 text-center text-[12px] text-[#725f70]/70">
        This page never creates an account, and the session ends when you close the tab.
      </p>
    </div>
  );
}
