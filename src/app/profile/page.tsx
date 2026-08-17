import Link from "next/link";
import { redirect } from "next/navigation";
import type { Profile as ProfileRecord } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BrandLockup } from "@/components/BrandName";
import { UserMenu } from "@/components/dashboard/UserMenu";
import {
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

  const age = profile.birthDate ? getAge(profile.birthDate) : null;
  const prompts = getProfilePrompts(profile);
  const completion = getCompletion(profile);
  const mainPhoto = profile.photos[0] ?? session.user.image;
  const displayName = profile.fullName || session.user.name || "Your account";
  const firstName = displayName.trim().split(/\s+/)[0];
  const relationshipIntent = profile.relationshipIntent
    ? optionLabel(RELATIONSHIP_OPTIONS, profile.relationshipIntent)
    : null;
  const interestedIn = profile.interestedIn.map((value) =>
    optionLabel(INTERESTED_IN_OPTIONS, value)
  );
  const status = getProfileStatus(completion);

  return (
    <main className="profile-dashboard">
      <div className="profile-ambient" aria-hidden="true">
        <span className="profile-ambient__glow profile-ambient__glow--one" />
        <span className="profile-ambient__glow profile-ambient__glow--two" />
        <span className="profile-ambient__glow profile-ambient__glow--three" />
        <span className="profile-ambient__grain" />
      </div>

      <nav className="profile-nav" aria-label="Authenticated navigation">
        <Link href="/profile" aria-label="umelike profile home">
          <BrandLockup
            markClassName="h-9 w-9"
            wordmarkClassName="font-display text-xl font-semibold tracking-tight text-[#F5F1EA]"
          />
        </Link>

        <div className="profile-nav__links">
          <Link href="/profile" aria-current="page">
            Profile
          </Link>
          <Link href="/onboarding">Edit profile</Link>
        </div>

        <UserMenu
          name={displayName}
          email={session.user.email ?? undefined}
          image={mainPhoto ?? undefined}
        />
      </nav>

      {searchParams.saved === "1" && (
        <div className="profile-saved" role="status">
          <span aria-hidden="true">✓</span>
          Your profile changes were saved.
        </div>
      )}

      <section className="profile-hero" aria-labelledby="profile-hero-title">
        <div className="profile-hero__copy rise-in">
          <p className="profile-eyebrow">Welcome back, {firstName}</p>
          <h1 id="profile-hero-title">
            Make your profile
            <br />
            <em>feel like you.</em>
          </h1>
          <p className="profile-hero__intro">
            A thoughtful profile makes room for the right kind of connection.
            See what is shining and what you can refine.
          </p>
          <Link href="/onboarding" className="profile-primary-cta">
            {completion < 100 ? "Continue your profile" : "Edit your profile"}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="profile-stage">
          <div className="profile-orbit profile-orbit--one" aria-hidden="true" />
          <div className="profile-orbit profile-orbit--two" aria-hidden="true" />

          <article
            id="profile-preview"
            className="profile-preview-card"
            aria-label={`${displayName}'s profile preview`}
          >
            <div className="profile-preview-card__bar">
              <span>Profile preview</span>
              <span className="profile-preview-card__live">
                <i aria-hidden="true" /> Saved
              </span>
            </div>

            <div className="profile-preview-card__photo">
              {mainPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mainPhoto}
                  alt={`${displayName}'s main profile photo`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="profile-preview-card__fallback" aria-hidden="true">
                  <span>{getInitials(displayName)}</span>
                </div>
              )}
              <div className="profile-preview-card__photo-shade" />
              <div className="profile-preview-card__identity">
                <h2>
                  {displayName}
                  {age !== null && <span>, {age}</span>}
                </h2>
                <p>
                  {profile.city}
                  {profile.pronouns ? ` · ${profile.pronouns}` : ""}
                </p>
              </div>
            </div>

            <div className="profile-preview-card__body">
              {relationshipIntent && (
                <p className="profile-intention">
                  <span aria-hidden="true">♡</span>
                  {relationshipIntent}
                </p>
              )}

              {profile.bio && <p className="profile-bio">{profile.bio}</p>}

              {profile.interests.length > 0 && (
                <ul className="profile-interest-list" aria-label="Interests">
                  {profile.interests.slice(0, 3).map((interest) => (
                    <li key={interest}>{interest}</li>
                  ))}
                  {profile.interests.length > 3 && (
                    <li aria-label={`${profile.interests.length - 3} more interests`}>
                      +{profile.interests.length - 3}
                    </li>
                  )}
                </ul>
              )}

              {prompts[0] && (
                <div className="profile-prompt-preview">
                  <p>{prompts[0].question}</p>
                  <blockquote>{prompts[0].answer}</blockquote>
                </div>
              )}
            </div>
          </article>

          <aside className="profile-float-card profile-float-card--completion">
            <span className="profile-float-card__icon" aria-hidden="true">✦</span>
            <div>
              <p>Profile completion</p>
              <strong>{completion}%</strong>
            </div>
            <div
              className="profile-mini-progress"
              role="progressbar"
              aria-label="Profile completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completion}
            >
              <span style={{ width: `${completion}%` }} />
            </div>
          </aside>

          <aside className="profile-float-card profile-float-card--photos">
            <span className="profile-float-card__label">Photos</span>
            <strong>{profile.photos.length} / 5</strong>
            <p>{profile.photos.length ? "moments added" : "ready for your first"}</p>
          </aside>

          <aside className="profile-float-card profile-float-card--prompts">
            <span className="profile-float-card__label">Prompts</span>
            <strong>{prompts.length} / 5</strong>
            <p>{prompts.length === 1 ? "answer shared" : "answers shared"}</p>
          </aside>

          <aside className="profile-float-card profile-float-card--status">
            <span className="profile-status-dot" aria-hidden="true" />
            <div>
              <span className="profile-float-card__label">Profile status</span>
              <strong>{status}</strong>
            </div>
          </aside>
        </div>
      </section>

      <section className="profile-next" aria-labelledby="profile-next-title">
        <div className="profile-next__heading">
          <div>
            <p className="profile-eyebrow">Your profile, piece by piece</p>
            <h2 id="profile-next-title">Make a profile worth stopping for.</h2>
          </div>
          <p>
            Keep each part honest, specific, and unmistakably yours. Every card
            below opens your existing profile editor.
          </p>
        </div>

        <div className="profile-action-grid" id="profile-details">
          <ProfileActionCard
            number="01"
            title="Photos"
            description={`${profile.photos.length} of 5 added`}
            state={profile.photos.length > 0 ? "Added" : "Add photos"}
          />
          <ProfileActionCard
            number="02"
            title="Prompts"
            description={`${prompts.length} of 5 answered`}
            state={prompts.length > 0 ? "Answered" : "Add an answer"}
          />
          <ProfileActionCard
            number="03"
            title="About you"
            description={`${profile.interests.length} interests shared`}
            state={profile.bio && profile.interests.length >= 3 ? "Ready" : "Keep going"}
          />
          <ProfileActionCard
            number="04"
            title="Preferences"
            description={
              relationshipIntent && interestedIn.length
                ? relationshipIntent
                : "Tell us what feels right"
            }
            state={relationshipIntent && interestedIn.length ? "Set" : "Add details"}
          />
        </div>
      </section>

      <footer className="profile-footer">
        <BrandLockup
          markClassName="h-7 w-7"
          wordmarkClassName="font-display text-lg font-semibold text-[#F5F1EA]"
        />
        <p>Your details stay private until you choose otherwise.</p>
      </footer>
    </main>
  );
}

function ProfileActionCard({
  number,
  title,
  description,
  state,
}: {
  number: string;
  title: string;
  description: string;
  state: string;
}) {
  return (
    <Link href="/onboarding" className="profile-action-card">
      <span className="profile-action-card__number">{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="profile-action-card__footer">
        <span>{state}</span>
        <i aria-hidden="true">↗</i>
      </div>
    </Link>
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

function getProfileStatus(completion: number) {
  if (completion === 100) return "Ready to shine";
  if (completion >= 80) return "Looking strong";
  if (completion >= 60) return "Coming together";
  return "Needs a little love";
}
