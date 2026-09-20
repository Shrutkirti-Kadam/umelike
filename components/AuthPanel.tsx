"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type AuthPanelProps = {
  onBack: () => void;
  /**
   * When false, Supabase is told not to create a new user.
   * Used by /delete-account so the account-management route can never
   * become a sign-up path. Defaults to true, so onboarding is unchanged.
   */
  allowSignup?: boolean;
};

type AuthStep =
  | "email"
  | "code"
  | "success";

export function AuthPanel({
  onBack,
  allowSignup = true,
}: AuthPanelProps) {
  const [step, setStep] =
    useState<AuthStep>("email");

  const [email, setEmail] =
    useState("");

  const [code, setCode] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const cleanEmail =
    email.trim().toLowerCase();

  const validEmail =
    /^\S+@\S+\.\S+$/.test(
      cleanEmail,
    );

  const validCode =
    /^\d{6}$/.test(code);

  // ===========================================================================
  // EXISTING SESSION
  // ===========================================================================

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (session) {
          const savedEmail =
            session.user.email;

          if (savedEmail) {
            setEmail(
              savedEmail,
            );
          }

          setStep(
            "success",
          );
        }
      } catch (err) {
        console.error(
          "Could not restore Supabase session:",
          err,
        );
      } finally {
        if (active) {
          setCheckingSession(
            false,
          );
        }
      }
    }

    void loadSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          session,
        ) => {
          if (!active) {
            return;
          }

          if (session) {
            const savedEmail =
              session.user.email;

            if (savedEmail) {
              setEmail(
                savedEmail,
              );
            }

            setStep(
              "success",
            );

            setCheckingSession(
              false,
            );

            return;
          }

          if (
            event ===
            "SIGNED_OUT"
          ) {
            setEmail("");
            setCode("");
            setError("");
            setStep(
              "email",
            );
          }
        },
      );

    return () => {
      active = false;

      subscription.unsubscribe();
    };
  }, []);

  // ===========================================================================
  // SEND OTP
  // ===========================================================================

  async function sendCode() {
    if (
      busy ||
      !validEmail
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { error } =
        await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: allowSignup,
          },
        });

      if (error) {
        throw error;
      }

      setCode("");
      setStep(
        "code",
      );
    } catch (err) {
      console.error(err);

      setError(
        allowSignup
          ? "We couldn't send the code. Please try again."
          : "We couldn't send a code. Make sure you're using the email on your existing umelike account.",
      );
    } finally {
      setBusy(false);
    }
  }

  // ===========================================================================
  // VERIFY OTP
  // ===========================================================================

  async function verifyCode() {
    if (
      busy ||
      !validCode
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { error } =
        await supabase.auth.verifyOtp({
          email:
            cleanEmail,
          token:
            code,
          type:
            "email",
        });

      if (error) {
        throw error;
      }

      setStep(
        "success",
      );
    } catch (err) {
      console.error(err);

      setError(
        "That code is incorrect or has expired.",
      );
    } finally {
      setBusy(false);
    }
  }

  // ===========================================================================
  // RESEND OTP
  // ===========================================================================

  async function resendCode() {
    if (busy) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { error } =
        await supabase.auth.signInWithOtp({
          email:
            cleanEmail,
          options: {
            shouldCreateUser: allowSignup,
          },
        });

      if (error) {
        throw error;
      }

      setCode("");
    } catch (err) {
      console.error(err);

      setError(
        "We couldn't resend the code. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  // ===========================================================================
  // BACK
  // ===========================================================================

  function handleBack() {
    setError("");

    if (
      step ===
      "code"
    ) {
      setCode("");

      setStep(
        "email",
      );

      return;
    }

    onBack();
  }

  // ===========================================================================
  // CHECKING EXISTING SESSION
  // ===========================================================================

  if (
    checkingSession
  ) {
    return (
      <div className="w-full max-w-[430px] animate-[authIn_500ms_cubic-bezier(.22,1,.36,1)_both]">
        <div
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-white/55
            bg-white/[0.32]
            px-7
            py-10
            text-center
            shadow-[0_22px_70px_rgba(58,38,58,0.12),inset_0_1px_0_rgba(255,255,255,0.55)]
            backdrop-blur-[34px]
            backdrop-saturate-[145%]
            sm:px-9
            sm:py-11
          "
        >
          <div
            className="
              mx-auto
              h-8
              w-8
              animate-spin
              rounded-full
              border-[3px]
              border-[#9b5267]/20
              border-t-[#9b5267]
            "
          />

          <p className="mt-5 text-[13px] text-[#695969]">
            Checking your session…
          </p>
        </div>

        <AuthAnimation />
      </div>
    );
  }

  // ===========================================================================
  // SUCCESS
  // ===========================================================================

  if (
    step ===
    "success"
  ) {
    return (
      <div className="w-full max-w-[430px] animate-[authIn_500ms_cubic-bezier(.22,1,.36,1)_both]">
        <div
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-white/55
            bg-white/[0.32]
            px-7
            py-10
            text-center
            shadow-[0_22px_70px_rgba(58,38,58,0.12),inset_0_1px_0_rgba(255,255,255,0.55)]
            backdrop-blur-[34px]
            backdrop-saturate-[145%]
            sm:px-9
            sm:py-11
          "
        >
          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-[#2f2532]
              text-[22px]
              text-[#f7eee6]
              shadow-[0_10px_30px_rgba(47,37,50,0.18)]
            "
          >
            ✓
          </div>

          <h1
            className="
              mt-6
              font-display
              text-[36px]
              font-medium
              leading-[1.08]
              tracking-[-0.04em]
              text-[#2d2230]
            "
          >
            You&apos;re in.
          </h1>

          <p className="mt-4 text-[14px] leading-6 text-[#695969]">
            Signed in as
            <br />

            <strong className="font-medium text-[#443546]">
              {cleanEmail}
            </strong>
          </p>

          <p className="mt-6 text-[12px] leading-5 text-[#786878]/70">
            {allowSignup
              ? "Next, we'll build your UmeLike profile."
              : "Opening your account controls…"}
          </p>
        </div>

        <AuthAnimation />
      </div>
    );
  }

  // ===========================================================================
  // EMAIL / OTP
  // ===========================================================================

  const showingCode =
    step ===
    "code";

  return (
    <div className="w-full max-w-[430px] animate-[authIn_500ms_cubic-bezier(.22,1,.36,1)_both]">
      <div
        className="
          relative
          overflow-hidden
          rounded-[28px]
          border
          border-white/55
          bg-white/[0.32]
          px-7
          py-8
          shadow-[0_22px_70px_rgba(58,38,58,0.12),inset_0_1px_0_rgba(255,255,255,0.55)]
          backdrop-blur-[34px]
          backdrop-saturate-[145%]
          sm:px-9
          sm:py-9
        "
      >
        <button
          type="button"
          onClick={
            handleBack
          }
          className="
            mb-7
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            border
            border-[#47384a]/10
            bg-white/40
            text-lg
            text-[#5f4d60]
            backdrop-blur-xl
            transition
            hover:bg-white/70
          "
          aria-label="Go back"
        >
          ←
        </button>

        <h1
          className="
            font-display
            text-[34px]
            font-medium
            leading-[1.08]
            tracking-[-0.04em]
            text-[#2d2230]
            sm:text-[39px]
          "
        >
          {showingCode ? (
            <>
              Check your
              <br />
              inbox.
            </>
          ) : (
            <>
              Let&apos;s start with
              <br />
              your email.
            </>
          )}
        </h1>

        <p className="mt-4 text-[14px] leading-6 text-[#695969]">
          {showingCode ? (
            <>
              We sent a
              6-digit code
              to{" "}
              <span className="font-medium text-[#49394c]">
                {cleanEmail}
              </span>
              .
            </>
          ) : (
            <>
              We&apos;ll
              send you a
              6-digit sign-in
              code. No
              password needed.
            </>
          )}
        </p>

        <div className="mt-8">
          {!showingCode ? (
            <>
              <label
                htmlFor="email"
                className="
                  ml-1
                  block
                  text-[12px]
                  font-medium
                  text-[#5d4c5e]
                "
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                disabled={busy}
                onChange={(
                  event,
                ) => {
                  setEmail(
                    event
                      .target
                      .value,
                  );

                  setError("");
                }}
                onKeyDown={(
                  event,
                ) => {
                  if (
                    event.key ===
                      "Enter" &&
                    validEmail
                  ) {
                    void sendCode();
                  }
                }}
                className="
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
                "
              />

              <button
                type="button"
                disabled={
                  !validEmail ||
                  busy
                }
                onClick={() =>
                  void sendCode()
                }
                className="
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
                  duration-300
                  hover:-translate-y-[1px]
                  hover:bg-[#241c27]
                  active:translate-y-0
                  active:scale-[0.99]
                  disabled:cursor-not-allowed
                  disabled:opacity-30
                  disabled:shadow-none
                "
              >
                {busy
                  ? "Sending…"
                  : "Send me a code"}
              </button>
            </>
          ) : (
            <>
              <label
                htmlFor="code"
                className="
                  ml-1
                  block
                  text-[12px]
                  font-medium
                  text-[#5d4c5e]
                "
              >
                6-digit code
              </label>

              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                disabled={busy}
                onChange={(
                  event,
                ) => {
                  const digits =
                    event
                      .target
                      .value
                      .replace(
                        /\D/g,
                        "",
                      )
                      .slice(
                        0,
                        6,
                      );

                  setCode(
                    digits,
                  );

                  setError("");
                }}
                onKeyDown={(
                  event,
                ) => {
                  if (
                    event.key ===
                      "Enter" &&
                    validCode
                  ) {
                    void verifyCode();
                  }
                }}
                className="
                  mt-2
                  h-[62px]
                  w-full
                  rounded-[18px]
                  border
                  border-[#4a394b]/10
                  bg-white/45
                  px-5
                  text-center
                  text-[23px]
                  font-semibold
                  tracking-[0.34em]
                  text-[#332736]
                  shadow-[inset_0_1px_0_rgba(255,255,255,.7)]
                  outline-none
                  backdrop-blur-xl
                  transition
                  placeholder:text-[#796b79]/30
                  hover:border-[#9b5267]/20
                  focus:border-[#9b5267]/45
                  focus:bg-white/65
                  focus:ring-4
                  focus:ring-[#9b5267]/10
                  disabled:opacity-60
                "
              />

              <button
                type="button"
                disabled={
                  !validCode ||
                  busy
                }
                onClick={() =>
                  void verifyCode()
                }
                className="
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
                  duration-300
                  hover:-translate-y-[1px]
                  hover:bg-[#241c27]
                  active:translate-y-0
                  active:scale-[0.99]
                  disabled:cursor-not-allowed
                  disabled:opacity-30
                  disabled:shadow-none
                "
              >
                {busy
                  ? "Checking…"
                  : "Verify & continue"}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void resendCode()
                }
                className="
                  mx-auto
                  mt-4
                  block
                  text-[12.5px]
                  font-medium
                  text-[#715c70]
                  transition
                  hover:text-[#9b5267]
                  disabled:opacity-40
                "
              >
                Send another code
              </button>
            </>
          )}

          {error && (
            <p
              role="alert"
              className="
                mt-4
                rounded-[14px]
                border
                border-[#9b5267]/15
                bg-[#9b5267]/[0.07]
                px-4
                py-3
                text-center
                text-[12px]
                leading-5
                text-[#814255]
              "
            >
              {error}
            </p>
          )}
        </div>

        {!showingCode && allowSignup && (
          <p className="mt-5 text-center text-[11.5px] leading-5 text-[#786878]/70">
            By continuing,
            you confirm that
            you&apos;re at least
            18 years old.
          </p>
        )}
      </div>

      <AuthAnimation />
    </div>
  );
}

// =============================================================================
// TRANSITION
// =============================================================================

function AuthAnimation() {
  return (
    <style jsx>{`
      @keyframes authIn {
        from {
          opacity: 0;

          transform:
            translateY(12px)
            scale(0.985);
        }

        to {
          opacity: 1;

          transform:
            translateY(0)
            scale(1);
        }
      }
    `}</style>
  );
}