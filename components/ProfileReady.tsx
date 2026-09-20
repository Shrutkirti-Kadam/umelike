"use client";

type ProfileReadyProps = {
  email: string;
  onHome: () => void;
};

export function ProfileReady({
  email,
  onHome,
}: ProfileReadyProps) {
  return (
    <div className="w-full max-w-[440px] animate-[readyIn_550ms_cubic-bezier(.22,1,.36,1)_both]">
      <div
        className="
          relative
          overflow-hidden
          rounded-[30px]
          border
          border-white/55
          bg-white/[0.30]
          px-7
          py-10
          text-center
          shadow-[0_24px_80px_rgba(58,38,58,0.13),inset_0_1px_0_rgba(255,255,255,0.6)]
          backdrop-blur-[36px]
          backdrop-saturate-[150%]
          sm:px-10
          sm:py-11
        "
      >
        <div
          className="
            mx-auto
            flex
            h-[64px]
            w-[64px]
            items-center
            justify-center
            rounded-full
            bg-[#2f2532]
            text-[25px]
            text-[#f7eee6]
            shadow-[0_12px_34px_rgba(47,37,50,0.20)]
          "
        >
          ✓
        </div>

        <p className="mt-7 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#9b5267]">
          Profile ready
        </p>

        <h1
          className="
            mt-3
            font-display
            text-[40px]
            font-medium
            leading-[1.05]
            tracking-[-0.045em]
            text-[#2d2230]
            sm:text-[46px]
          "
        >
          You&apos;re already
          <br />
          good to go
        </h1>

        <p className="mx-auto mt-5 max-w-[340px] text-[14px] leading-6 text-[#695969]">
          Your UmeLike profile is ready.
          Open the app and sign in with the
          same account to start discovering.
        </p>

        <div
          className="
            mt-7
            rounded-[17px]
            border
            border-white/45
            bg-white/30
            px-4
            py-3
            backdrop-blur-xl
          "
        >
          <p className="text-[11px] uppercase tracking-[0.1em] text-[#786878]/60">
            Signed in as
          </p>

          <p className="mt-1 truncate text-[13px] font-medium text-[#443546]">
            {email}
          </p>
        </div>

        <button
          type="button"
          className="
            mt-7
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
          "
        >
          Open UmeLike
        </button>

        <button
          type="button"
          onClick={onHome}
          className="
            mx-auto
            mt-4
            block
            text-[12.5px]
            font-medium
            text-[#715c70]
            transition
            hover:text-[#9b5267]
          "
        >
          Back to home
        </button>

        <p className="mt-6 text-[11px] leading-5 text-[#786878]/60">
          App download and deep-link support
          will be connected before launch.
        </p>
      </div>

      <style jsx>{`
        @keyframes readyIn {
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
    </div>
  );
}