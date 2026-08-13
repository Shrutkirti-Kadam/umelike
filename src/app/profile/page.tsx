import Link from "next/link";
import { redirect } from "next/navigation";
import type { Profile as ProfileRecord } from "@prisma/client";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BrandLockup } from "@/components/BrandName";
import {
  GENDER_OPTIONS,
  INTERESTED_IN_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/lib/profile-options";

export const dynamic = "force-dynamic";

type ProfileWithPrompts = ProfileRecord & {
  promptQuestions: string[];
  promptAnswers: string[];
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const profile = (await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })) as ProfileWithPrompts | null;
  if (!profile) redirect("/onboarding");

  const justSaved = searchParams.saved === "1";
  const age = profile.birthDate ? getAge(profile.birthDate) : null;
  const completion = getCompletion(profile);
  const mainPhoto = profile.photos[0] ?? session.user.image;
  const prompts = getProfilePrompts(profile);

  return (
    <main className="min-h-dvh px-6 py-10 sm:px-10">
      <div className="rise-in mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <BrandLockup
            markClassName="h-8 w-8"
            wordmarkClassName="font-display text-xl font-semibold tracking-tight"
          />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="ease-soft rounded-full px-4 py-2 text-sm font-medium text-mauve transition duration-300 hover:bg-plum/5 hover:text-plum"
            >
              Sign out
            </button>
          </form>
        </div>

        {justSaved && (
          <p
            role="status"
            className="rise-in mt-8 rounded-field border border-gold/40 bg-gold/15 px-4 py-3 text-sm font-medium"
          >
            Profile saved.
          </p>
        )}

        <section className="mt-8 rounded-soft border border-plum/5 bg-white/45 p-5 shadow-[0_8px_40px_rgba(50,34,48,0.05)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-plum">Profile completion</p>
              <p className="mt-1 text-sm text-mauve">
                {completion === 100
                  ? "Everything is ready."
                  : "Add the missing details to complete your profile."}
              </p>
            </div>
            <span className="font-display text-2xl font-semibold text-berry">
              {completion}%
            </span>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-blush"
            role="progressbar"
            aria-label="Profile completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completion}
          >
            <div
              className="h-full rounded-full bg-berry transition-[width] duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </section>

        <article className="mt-6 overflow-hidden rounded-soft border border-plum/5 bg-blush/60 shadow-[0_8px_40px_rgba(50,34,48,0.06)]">
          <div className="flex items-center gap-5 border-b border-plum/5 p-7 sm:p-9">
            {mainPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainPhoto}
                alt=""
                width={88}
                height={88}
                className="h-[88px] w-[88px] rounded-soft border-2 border-white object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-[88px] w-[88px] items-center justify-center rounded-soft bg-gold/30 font-display text-3xl font-semibold">
                {profile.fullName[0]}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
                {profile.fullName}
                {age !== null && <span className="font-normal text-mauve">, {age}</span>}
              </h1>
              <p className="mt-1 text-mauve">
                {profile.gender
                  ? optionLabel(GENDER_OPTIONS, profile.gender)
                  : "Gender not added"}
                {profile.pronouns ? ` · ${profile.pronouns}` : ""}
              </p>
              <p className="mt-1 truncate text-sm text-mauve/75">{session.user.email}</p>
            </div>
          </div>

          {profile.photos.length > 0 && (
            <section className="border-b border-plum/5 p-7 sm:p-9">
              <SectionTitle>Photos</SectionTitle>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {profile.photos.map((photo, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${photo}-${index}`}
                    src={photo}
                    alt={`${profile.fullName}'s profile photo ${index + 1}`}
                    className="aspect-[4/5] w-full rounded-field bg-white object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
            </section>
          )}

          <section className="border-b border-plum/5 p-7 sm:p-9">
            <SectionTitle>About</SectionTitle>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-plum">
              {profile.bio ?? "Add a short bio to tell people more about you."}
            </p>

            {profile.interests.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-berry/20 bg-white/55 px-3 py-1.5 text-sm text-berry-deep"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </section>

          <dl className="divide-y divide-plum/5 border-b border-plum/5">
            <Row
              label="Looking for"
              value={
                profile.relationshipIntent
                  ? optionLabel(RELATIONSHIP_OPTIONS, profile.relationshipIntent)
                  : "Not added"
              }
            />
            <Row
              label="Interested in"
              value={
                profile.interestedIn.length
                  ? profile.interestedIn
                      .map((value) => optionLabel(INTERESTED_IN_OPTIONS, value))
                      .join(", ")
                  : "Not added"
              }
            />
            <Row
              label="Area"
              value={profile.city}
              note={`Preferred distance: within ${profile.maxDistanceKm} km. Full address and postal code stay private.`}
            />
            <Row
              label="Phone"
              value={profile.phone}
              badge="Private"
              note="Only used for account verification."
            />
          </dl>

          {prompts.length > 0 && (
            <section className="space-y-4 p-7 sm:p-9">
              <SectionTitle>A few things about me</SectionTitle>
              {prompts.map((prompt) => (
                <PromptCard
                  key={prompt.question}
                  question={prompt.question}
                  answer={prompt.answer}
                />
              ))}
            </section>
          )}

          <div className="px-7 pb-7 sm:px-9 sm:pb-9">
            <Link
              href="/onboarding"
              className="ease-soft inline-block rounded-full border border-berry/40 px-6 py-3 text-sm font-medium text-berry transition duration-300 hover:bg-berry hover:text-ivory"
            >
              Edit profile
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl font-medium">{children}</h2>;
}

function PromptCard({ question, answer }: { question: string; answer: string | null }) {
  return (
    <div className="rounded-field border border-plum/5 bg-white/45 p-5">
      <p className="text-sm font-medium text-mauve">{question}</p>
      <p className="mt-2 leading-relaxed">{answer ?? "Not answered yet."}</p>
    </div>
  );
}

function Row({
  label,
  value,
  badge,
  note,
}: {
  label: string;
  value: string;
  badge?: string;
  note?: string;
}) {
  return (
    <div className="px-7 py-5 sm:px-9">
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-mauve">
        {label}
        {badge && (
          <span className="rounded-full bg-plum/5 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-plum/70">
            {badge}
          </span>
        )}
      </dt>
      <dd className="mt-1.5 text-lg">{value}</dd>
      {note && <p className="mt-1 text-sm text-mauve">{note}</p>}
    </div>
  );
}

function optionLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function getAge(birthDate: Date) {
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthdayHasPassed =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() >= birthDate.getUTCDate());
  if (!birthdayHasPassed) age -= 1;
  return age;
}

function getProfilePrompts(profile: ProfileWithPrompts) {
  const selected = profile.promptQuestions
    .map((question, index) => ({
      question,
      answer: profile.promptAnswers[index] ?? "",
    }))
    .filter((prompt) => prompt.question && prompt.answer);

  if (selected.length > 0) return selected;

  return [
    { question: "A perfect day looks like…", answer: profile.prompt1 ?? "" },
    { question: "Something I value deeply is…", answer: profile.prompt2 ?? "" },
    {
      question: "The quickest way to make me smile is…",
      answer: profile.prompt3 ?? "",
    },
  ].filter((prompt) => prompt.answer);
}

function getCompletion(profile: ProfileWithPrompts) {
  // `in` keeps this compatible with an editor that still has the previous
  // generated Prisma type cached while retaining the address completion check.
  const hasStreetAddress =
    "streetAddress" in profile &&
    typeof profile.streetAddress === "string" &&
    profile.streetAddress.trim().length > 0;

  const checks = [
    !!profile.fullName,
    !!profile.birthDate,
    !!profile.gender,
    profile.interestedIn.length > 0,
    !!profile.relationshipIntent,
    !!profile.bio,
    profile.interests.length >= 3,
    getProfilePrompts(profile).length > 0,
    profile.photos.length > 0,
    hasStreetAddress && !!profile.city && !!profile.postalCode,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
