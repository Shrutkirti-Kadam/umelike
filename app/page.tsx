"use client";

import {
  useEffect,
  useState,
} from "react";

import { AuthPanel } from "@/components/AuthPanel";
import { SiteFooter } from "@/components/SiteFrame";
import { GlowBackdrop } from "@/components/GlowBackdrop";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { ProfileReady } from "@/components/ProfileReady";
import { supabase } from "@/lib/supabase";

type Screen =
  | "landing"
  | "auth"
  | "checking"
  | "onboarding"
  | "ready";

export default function Home() {
  const [screen, setScreen] =
    useState<Screen>("checking");

  const [
    sessionEmail,
    setSessionEmail,
  ] = useState<string | null>(
    null,
  );

  // ===========================================================================
  // CHECK PROFILE
  // ===========================================================================

  async function routeSignedInUser(
    userId: string,
    email: string,
  ) {
    setSessionEmail(email);

    setScreen("checking");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(
          "onboarding_complete",
        )
        .eq(
          "id",
          userId,
        )
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (
        data?.onboarding_complete ===
        true
      ) {
        setScreen("ready");
        return;
      }

      setScreen("onboarding");
    } catch (error) {
      console.error(
        "Could not check profile:",
        error,
      );

      /*
       * Fail safely into onboarding instead
       * of trapping the user on a loading screen.
       */
      setScreen("onboarding");
    }
  }

  // ===========================================================================
  // SESSION
  // ===========================================================================

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (!session) {
        setSessionEmail(null);
        setScreen("landing");
        return;
      }

      await routeSignedInUser(
        session.user.id,
        session.user.email ?? "",
      );
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

          if (
            event === "SIGNED_OUT"
          ) {
            setSessionEmail(null);
            setScreen("landing");
            return;
          }

          if (session) {
            void routeSignedInUser(
              session.user.id,
              session.user.email ?? "",
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
  // GET STARTED
  // ===========================================================================

  async function handleGetStarted() {
    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (!session) {
      setScreen("auth");
      return;
    }

    await routeSignedInUser(
      session.user.id,
      session.user.email ?? "",
    );
  }

  // ===========================================================================
  // HOME
  // ===========================================================================

  function goHome() {
    setScreen("landing");
  }

  async function signOut() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Could not sign out:",
        error,
      );

      return;
    }

    setSessionEmail(null);
    setScreen("landing");
  }

  // ===========================================================================
  // UI
  // ===========================================================================

  const showFooter =
    screen === "landing";

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f4eadc] text-[#2d2230]">
      <GlowBackdrop />

      {/* ================================================================
          BRAND
      ================================================================= */}

      <header className="absolute left-0 top-0 z-20 w-full px-7 py-7 sm:px-10 sm:py-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goHome}
            className="flex items-center gap-3"
            aria-label="Go to UmeLike home"
          >
            <UMark />

            <span className="font-display text-[22px] font-semibold tracking-[-0.035em]">
              ume
              <span className="text-[#9b5267]">
                like
              </span>
            </span>
          </button>

          {sessionEmail && (
            <button
              type="button"
              onClick={() =>
                void signOut()
              }
              className="
                rounded-full
                border
                border-white/50
                bg-white/35
                px-4
                py-2
                text-[12px]
                font-medium
                text-[#5f4d60]
                shadow-[0_5px_20px_rgba(61,42,61,0.08)]
                backdrop-blur-xl
                transition
                hover:bg-white/60
                hover:text-[#9b5267]
              "
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      {/* ================================================================
          MAIN CONTENT
      ================================================================= */}

      <section className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-28">
        {screen ===
          "checking" && (
          <CheckingCard />
        )}

        {screen ===
          "landing" && (
          <LandingContent
            onGetStarted={
              () =>
                void handleGetStarted()
            }
          />
        )}

        {screen === "auth" && (
          <AuthPanel
            onBack={goHome}
          />
        )}

        {screen ===
          "onboarding" &&
          sessionEmail && (
            <OnboardingWizard
              email={
                sessionEmail
              }
              onBack={goHome}
              onComplete={() =>
                setScreen(
                  "ready",
                )
              }
            />
          )}

        {screen ===
          "ready" &&
          sessionEmail && (
            <ProfileReady
              email={
                sessionEmail
              }
              onHome={goHome}
            />
          )}
      </section>

      {/* ================================================================
          FOOTER
      ================================================================= */}

      {showFooter && (
        <div className="absolute bottom-0 left-0 w-full">
          <SiteFooter />
        </div>
      )}
    </main>
  );
}

// =============================================================================
// CHECKING
// =============================================================================

function CheckingCard() {
  return (
    <div className="w-full max-w-[360px]">
      <div
        className="
          rounded-[26px]
          border
          border-white/50
          bg-white/[0.26]
          px-8
          py-9
          text-center
          shadow-[0_20px_60px_rgba(58,38,58,0.10)]
          backdrop-blur-[32px]
          backdrop-saturate-[145%]
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
          Getting things ready…
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// LANDING
// =============================================================================

function LandingContent({
  onGetStarted,
}: {
  onGetStarted: () => void;
}) {
  return (
    <div
      className="
        w-full
        max-w-[680px]
        -translate-y-4
        text-center
        sm:-translate-y-6
        animate-[landingIn_650ms_cubic-bezier(.22,1,.36,1)_both]
      "
    >
      <h1
        className="
          font-display
          text-[44px]
          font-medium
          leading-[1.05]
          tracking-[-0.045em]
          text-[#2d2230]
          sm:text-[58px]
          md:text-[68px]
        "
      >
        Meet someone who
        <br />
        feels like{" "}
        <em className="font-normal text-[#9b5267]">
          your own
        </em>
      </h1>

      <p className="mx-auto mt-7 max-w-[510px] text-[16px] leading-[1.7] text-[#695969] sm:text-[17px]">
        <span className="font-medium text-[#453747]">
          umelike
        </span>{" "}
        is a quieter way to meet
        people. One honest profile,
        real intentions, and none of
        the noise.
      </p>

      <button
        type="button"
        onClick={
          onGetStarted
        }
        className="
          mt-10
          inline-flex
          min-h-[56px]
          items-center
          justify-center
          rounded-full
          border
          border-[#49394c]/10
          bg-white/75
          px-8
          text-[15px]
          font-medium
          text-[#352a38]
          shadow-[0_5px_30px_rgba(61,42,61,0.10)]
          backdrop-blur-xl
          transition
          duration-300
          hover:-translate-y-[1px]
          hover:bg-white/90
          hover:shadow-[0_8px_38px_rgba(61,42,61,0.14)]
          active:translate-y-0
          active:scale-[0.985]
        "
      >
        Get started
      </button>

      <p className="mt-4 text-[13px] text-[#725f70]/70">
        Take a minute. Make it
        yours.
      </p>

      <style jsx>{`
        @keyframes landingIn {
          from {
            opacity: 0;

            transform:
              translateY(8px)
              scale(0.99);
          }

          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// U MARK
// =============================================================================

function UMark() {
  return (
    <div
      className="
        flex
        h-[38px]
        w-[38px]
        items-center
        justify-center
        rounded-[11px]
        bg-[#2f2532]
        shadow-[0_5px_18px_rgba(45,34,48,0.16)]
      "
    >
      <svg
        viewBox="0 0 48 48"
        width="24"
        height="24"
        aria-hidden="true"
      >
        <path
          d="M14 13v13.5C14 34 18.2 38 24 38s10-4 10-11.5V13"
          fill="none"
          stroke="#f6eee5"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}