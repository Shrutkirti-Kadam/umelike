import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/OnboardingForm";
import { BrandLockup } from "@/components/BrandName";

export const dynamic = "force-dynamic";

/**
 * Onboarding — shown right after first sign-in.
 * Pre-fills from the Google account so the form never starts blank.
 * Also doubles as "edit profile": if a profile exists, its values load
 * and the copy shifts from "finish" to "update".
 */
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  const editing = !!profile;

  const defaults = {
    fullName: profile?.fullName ?? session.user.name ?? "",
    phone: profile?.phone ?? "",
    birthDate: profile?.birthDate?.toISOString().slice(0, 10) ?? "",
    gender: profile?.gender ?? "",
    pronouns: profile?.pronouns ?? "",
    interestedIn: profile?.interestedIn ?? [],
    relationshipIntent: profile?.relationshipIntent ?? "",
    bio: profile?.bio ?? "",
    interests: profile?.interests.join(", ") ?? "",
    prompt1: profile?.prompt1 ?? "",
    prompt2: profile?.prompt2 ?? "",
    prompt3: profile?.prompt3 ?? "",
    photos: profile?.photos ?? [],
    streetAddress: profile?.streetAddress ?? "",
    city: profile?.city ?? "",
    postalCode: profile?.postalCode ?? "",
    maxDistanceKm: String(profile?.maxDistanceKm ?? 50),
  };

  return (
    <main className="min-h-dvh px-6 py-10 sm:px-10">
      <div className="rise-in mx-auto max-w-2xl">
        <BrandLockup
          markClassName="h-8 w-8"
          wordmarkClassName="font-display text-xl font-semibold tracking-tight"
        />

        <div className="mt-10 rounded-soft border border-plum/5 bg-blush/60 p-7 shadow-[0_8px_40px_rgba(50,34,48,0.06)] sm:p-9">
          {/* Google identity, carried in — the form doesn't start cold */}
          <div className="flex items-center gap-4">
            {session.user.image ? (
              // Plain <img>: Google avatars come from an external host and
              // this stays free of next/image remote-domain config.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                width={52}
                height={52}
                className="rounded-full border-2 border-white shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gold/30 font-display text-lg font-semibold">
                {(session.user.name ?? "K")[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium">{session.user.name}</p>
              <p className="truncate text-sm text-mauve">{session.user.email}</p>
            </div>
          </div>

          <h1 className="mt-8 font-display text-3xl font-medium tracking-tight">
            {editing ? "Update your profile" : "Tell us a little about you"}
          </h1>
          <p className="mt-2 leading-relaxed text-mauve">
            {editing
              ? "Change anything below, then save."
              : "Build a profile that feels honest, specific, and like you."}
          </p>

          <OnboardingForm defaults={defaults} />
        </div>
      </div>
    </main>
  );
}
