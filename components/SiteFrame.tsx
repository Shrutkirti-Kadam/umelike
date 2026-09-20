"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import { GlowBackdrop } from "@/components/GlowBackdrop";
import { supabase } from "@/lib/supabase";

type SiteFrameProps = {
  children: React.ReactNode;
  wide?: boolean;
  animatedBackground?: boolean;
};

export function SiteFrame({
  children,
  wide = false,
  animatedBackground = true,
}: SiteFrameProps) {
  const [signedIn, setSignedIn] =
    useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(
        ({
          data: {
            session,
          },
        }) => {
          if (active) {
            setSignedIn(
              Boolean(session),
            );
          }
        },
      );

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session,
        ) => {
          if (active) {
            setSignedIn(
              Boolean(session),
            );
          }
        },
      );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#f4eadc] text-[#2d2230]">
      {animatedBackground && (
        <GlowBackdrop />
      )}

      <header className="absolute left-0 top-0 z-20 w-full px-7 py-7 sm:px-10 sm:py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
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
          </Link>

          {signedIn && (
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

      <section
        className="
          relative
          z-10
          flex
          min-h-dvh
          items-start
          justify-center
          px-4
          pb-24
          pt-28
          sm:px-6
          lg:px-10
        "
      >
        <div
          className={
            wide
              ? "w-full max-w-[1180px]"
              : "w-full max-w-[440px]"
          }
        >
          {children}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 w-full px-6 pb-7 text-center text-[12px] text-[#725f70]/65">
      <nav className="mb-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
        <Link
          href="/privacy"
          className="transition hover:text-[#9b5267]"
        >
          Privacy
        </Link>

        <Link
          href="/terms"
          className="transition hover:text-[#9b5267]"
        >
          Terms
        </Link>

        <Link
          href="/delete-account"
          className="transition hover:text-[#9b5267]"
        >
          Delete account
        </Link>
      </nav>

      A quieter place to meet someone.
    </footer>
  );
}

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