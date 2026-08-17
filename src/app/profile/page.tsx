import Link from "next/link";
import { redirect } from "next/navigation";
import type { Profile as ProfileRecord } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BrandLockup } from "@/components/BrandName";
import { LiveStats } from "@/components/dashboard/LiveStats";
import { UserMenu } from "@/components/dashboard/UserMenu";
import {
  INTERESTED_IN_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/lib/profile-options";

export const dynamic = "force-dynamic";

const DEFAULT_LAUNCH_DATE = "2026-10-01T00:00:00+05:30";

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

  const [profileRecord, registeredUsers] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.user.count(),
  ]);
  const profile = profileRecord as ProfileWithPrompts | null;
  if (!profile) redirect("/onboarding");

  const prompts = getProfilePrompts(profile);
  const completion = getCompletion(profile);
  const age = profile.birthDate ? getAge(profile.birthDate) : null;
  const mainPhoto = profile.photos[0] ?? session.user.image;
  const displayName = profile.fullName || session.user.name || "Your account";
  const firstName = displayName.trim().split(/\s+/)[0];
  const relationshipIntent = profile.relationshipIntent
    ? optionLabel(RELATIONSHIP_OPTIONS, profile.relationshipIntent)
    : null;
  const interestedIn = profile.interestedIn.map((value) =>
    optionLabel(INTERESTED_IN_OPTIONS, value)
  );
  const launchDate = getLaunchDate();

  const checklist = [
    {
      label: "Profile photo",
      detail: `${profile.photos.length} of 5 photos added`,
      complete: profile.photos.length > 0,
    },
    {
      label: "Profile prompts",
      detail: `${prompts.length} of 5 prompts answered`,
      complete: prompts.length > 0,
    },
    {
      label: "About you",
      detail: `${profile.interests.length} interests and a personal bio`,
      complete: !!profile.bio && profile.interests.length >= 3,
    },
    {
      label: "Dating preferences",
      detail: relationshipIntent ?? "Add what you are looking for",
      complete: !!relationshipIntent && interestedIn.length > 0,
    },
    {
      label: "Location",
      detail: profile.city || "Add your locality",
      complete: !!profile.city && !!profile.postalCode && !!profile.streetAddress,
    },
  ];

  return (
    <main className="account-dashboard">
      <header className="account-header">
        <div className="account-header__inner">
          <Link className="account-brand" href="/profile" aria-label="umelike dashboard">
            <BrandLockup
              markClassName="h-9 w-9"
              wordmarkClassName="font-display text-xl font-semibold tracking-tight"
            />
          </Link>

          <nav className="account-tabs" aria-label="Account sections">
            <Link href="#overview" aria-current="page">Overview</Link>
            <Link href="#profile-preview">Profile</Link>
            <Link href="/onboarding">Edit profile</Link>
          </nav>

          <UserMenu
            name={displayName}
            email={session.user.email ?? undefined}
            image={mainPhoto ?? undefined}
          />
        </div>
      </header>

      <div className="account-shell" id="overview">
        {searchParams.saved === "1" && (
          <div className="account-save-notice" role="status">
            <span aria-hidden="true">✓</span>
            Your profile changes were saved successfully.
          </div>
        )}

        <section className="account-intro" aria-labelledby="account-title">
          <div>
            <p className="account-kicker">Personal dashboard</p>
            <h1 id="account-title">Welcome back, {firstName}.</h1>
            <p>
              Track UmeLike&apos;s progress and keep your profile ready for launch.
            </p>
          </div>
          <div className="account-intro__actions">
            <Link className="button button--secondary" href="#profile-preview">
              View profile
            </Link>
            <Link className="button button--primary" href="/onboarding">
              {completion < 100 ? "Complete profile" : "Edit profile"}
            </Link>
          </div>
        </section>

        <LiveStats
          initialRegisteredUsers={registeredUsers}
          launchDateIso={launchDate.toISOString()}
          initialNowIso={new Date().toISOString()}
        />

        <section className="account-content-grid" aria-label="Profile overview">
          <article className="account-card profile-summary" id="profile-preview">
            <div className="account-card__header">
              <div>
                <p className="account-card__eyebrow">Profile preview</p>
                <h2>How you will appear</h2>
              </div>
              <Link href="/onboarding">Edit</Link>
            </div>

            <div className="profile-summary__identity">
              <ProfileAvatar name={displayName} image={mainPhoto ?? undefined} />
              <div>
                <h3>
                  {displayName}
                  {age !== null && <span>, {age}</span>}
                </h3>
                <p>
                  {profile.city}
                  {profile.pronouns ? ` · ${profile.pronouns}` : ""}
                </p>
              </div>
            </div>

            <div className="profile-summary__completion">
              <div>
                <span>Profile completion</span>
                <strong>{completion}%</strong>
              </div>
              <div
                className="account-progress"
                role="progressbar"
                aria-label="Profile completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completion}
              >
                <span style={{ width: `${completion}%` }} />
              </div>
              <p>
                {completion === 100
                  ? "Your profile has all of the recommended details."
                  : "Add the remaining details before UmeLike launches."}
              </p>
            </div>

            <div className="profile-summary__section">
              <h4>About</h4>
              <p>{profile.bio ?? "Add a bio to tell people more about you."}</p>
            </div>

            {profile.interests.length > 0 && (
              <ul className="account-chip-list" aria-label="Interests">
                {profile.interests.map((interest) => (
                  <li key={interest}>{interest}</li>
                ))}
              </ul>
            )}

            <dl className="profile-summary__details">
              <div>
                <dt>Looking for</dt>
                <dd>{relationshipIntent ?? "Not added"}</dd>
              </div>
              <div>
                <dt>Interested in</dt>
                <dd>{interestedIn.length ? interestedIn.join(", ") : "Not added"}</dd>
              </div>
            </dl>

            {prompts[0] && (
              <div className="profile-summary__prompt">
                <span>{prompts[0].question}</span>
                <p>{prompts[0].answer}</p>
              </div>
            )}
          </article>

          <aside className="account-card profile-checklist">
            <div className="account-card__header">
              <div>
                <p className="account-card__eyebrow">Profile setup</p>
                <h2>Your checklist</h2>
              </div>
              <span className="profile-checklist__score">
                {checklist.filter((item) => item.complete).length}/{checklist.length}
              </span>
            </div>

            <div className="profile-checklist__items">
              {checklist.map((item) => (
                <div className="profile-checklist__item" key={item.label}>
                  <span
                    className={item.complete ? "is-complete" : ""}
                    aria-hidden="true"
                  >
                    {item.complete ? "✓" : "·"}
                  </span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <small>{item.complete ? "Done" : "To do"}</small>
                </div>
              ))}
            </div>

            <Link className="profile-checklist__action" href="/onboarding">
              Review profile details <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}

function ProfileAvatar({ name, image }: { name: string; image?: string }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={`${name}'s profile`} referrerPolicy="no-referrer" />
    );
  }

  return <div aria-hidden="true">{getInitials(name)}</div>;
}

function getLaunchDate() {
  const configured = new Date(process.env.APP_LAUNCH_DATE ?? DEFAULT_LAUNCH_DATE);
  return Number.isNaN(configured.getTime()) ? new Date(DEFAULT_LAUNCH_DATE) : configured;
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

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
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
    !!profile.streetAddress && !!profile.city && !!profile.postalCode,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
