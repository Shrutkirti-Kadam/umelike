"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  saveOnboardingProfile,
} from "@/lib/saveOnboarding";

// =============================================================================
// TYPES
// =============================================================================

type OnboardingWizardProps = {
  email: string;
  onBack?: () => void;
  onComplete: () => void;
};

type PhotoItem = {
  id: string;
  file: File;
  preview: string;
};

type PromptAnswer = {
  prompt: string;
  answer: string;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const TOTAL_STEPS = 10;

const GENDER_OPTIONS = [
  "Woman",
  "Man",
  "Non-binary",
  "Self-describe",
];

const ORIENTATION_OPTIONS = [
  "Straight",
  "Gay",
  "Lesbian",
  "Bisexual",
  "Pansexual",
  "Asexual",
  "Queer",
  "Questioning",
];

const INTERESTED_OPTIONS = [
  {
    value: "Women",
    label: "Women",
    description:
      "Show me women",
  },
  {
    value: "Men",
    label: "Men",
    description:
      "Show me men",
  },
  {
    value: "Everyone",
    label: "Everyone",
    description:
      "I’m open to everyone",
  },
];

const RELATIONSHIP_OPTIONS = [
  "Long-term relationship",
  "Long-term, open to short",
  "Short-term, open to long",
  "Short-term relationship",
  "Figuring out my dating goals",
  "Friendship",
];

const INTEREST_OPTIONS = [
  "Travel",
  "Music",
  "Movies",
  "Books",
  "Gaming",
  "Fitness",
  "Cooking",
  "Photography",
  "Art",
  "Technology",
  "Football",
  "Cricket",
  "Coffee",
  "Food",
  "Nature",
  "Dogs",
  "Cats",
  "Fashion",
  "Comedy",
  "Night drives",
  "Hiking",
  "Dancing",
  "Writing",
  "Anime",
];

const PROMPT_OPTIONS = [
  "The way to win me over is...",
  "Together, we could...",
  "My simple pleasures...",
  "A life goal of mine...",
  "I’ll fall for you if...",
  "The hallmark of a good relationship is...",
  "Something I’d love to know about you is...",
  "My most irrational fear...",
  "I geek out on...",
  "My ideal Sunday looks like...",
  "We’ll get along if...",
  "I’m looking for someone who...",
];

// =============================================================================
// MAIN
// =============================================================================

export function OnboardingWizard({
  email,
  onBack,
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] =
    useState(0);

  const [
    reviewing,
    setReviewing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saveError,
    setSaveError,
  ] = useState("");

  // ---------------------------------------------------------------------------
  // BASIC INFO
  // ---------------------------------------------------------------------------

  const [name, setName] =
    useState("");

  const [dob, setDob] =
    useState("");

  // ---------------------------------------------------------------------------
  // IDENTITY
  // ---------------------------------------------------------------------------

  const [gender, setGender] =
    useState("");

  const [
    customGender,
    setCustomGender,
  ] = useState("");

  const [
    orientation,
    setOrientation,
  ] = useState("");

  // ---------------------------------------------------------------------------
  // DATING PREFERENCES
  // ---------------------------------------------------------------------------

  const [
    interestedIn,
    setInterestedIn,
  ] = useState("");

  const [
    relationshipGoal,
    setRelationshipGoal,
  ] = useState("");

  // ---------------------------------------------------------------------------
  // LOCATION
  // ---------------------------------------------------------------------------

  const [
    neighborhood,
    setNeighborhood,
  ] = useState("");

  const [
    distanceKm,
    setDistanceKm,
  ] = useState(25);

  // ---------------------------------------------------------------------------
  // PROFILE
  // ---------------------------------------------------------------------------

  const [bio, setBio] =
    useState("");

  const [
    interests,
    setInterests,
  ] = useState<string[]>([]);

  const [
    prompts,
    setPrompts,
  ] = useState<
    PromptAnswer[]
  >([
    {
      prompt:
        "The way to win me over is...",
      answer: "",
    },
    {
      prompt:
        "Together, we could...",
      answer: "",
    },
    {
      prompt:
        "My simple pleasures...",
      answer: "",
    },
  ]);

  const [photos, setPhotos] =
    useState<PhotoItem[]>([]);

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================

  const cleanName =
    name.trim();

  const cleanCustomGender =
    customGender.trim();

  const cleanNeighborhood =
    neighborhood.trim();

  const cleanBio =
    bio.trim();

  const age =
    useMemo(
      () => getAge(dob),
      [dob],
    );

  const maxDob =
    getMaxDateFor18Plus();

  const displayGender =
    gender ===
    "Self-describe"
      ? cleanCustomGender
      : gender;

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  const nameValid =
    cleanName.length >= 2 &&
    cleanName.length <= 40;

  const birthdayValid =
    age !== null &&
    age >= 18;

  const genderValid =
    gender.length > 0 &&
    (
      gender !==
        "Self-describe" ||
      cleanCustomGender.length >=
        2
    );

  const identityValid =
    genderValid &&
    orientation.length > 0;

  const interestedValid =
    interestedIn.length > 0;

  const relationshipValid =
    relationshipGoal.length > 0;

  const locationValid =
    cleanNeighborhood.length >=
      2 &&
    distanceKm >= 1;

  const bioValid =
    cleanBio.length >= 20 &&
    cleanBio.length <= 500;

  const interestsValid =
    interests.length >= 3;

  const promptsValid =
    prompts.every(
      (item) =>
        item.prompt.length >
          0 &&
        item.answer.trim()
          .length >= 10,
    ) &&
    new Set(
      prompts.map(
        (item) =>
          item.prompt,
      ),
    ).size ===
      prompts.length;

  const photosValid =
    photos.length >= 1;

  // ===========================================================================
  // NEXT
  // ===========================================================================

  function next() {
    if (
      step === 0 &&
      nameValid
    ) {
      setStep(1);
      return;
    }

    if (
      step === 1 &&
      birthdayValid
    ) {
      setStep(2);
      return;
    }

    if (
      step === 2 &&
      identityValid
    ) {
      setStep(3);
      return;
    }

    if (
      step === 3 &&
      interestedValid
    ) {
      setStep(4);
      return;
    }

    if (
      step === 4 &&
      relationshipValid
    ) {
      setStep(5);
      return;
    }

    if (
      step === 5 &&
      locationValid
    ) {
      setStep(6);
      return;
    }

    if (
      step === 6 &&
      bioValid
    ) {
      setStep(7);
      return;
    }

    if (
      step === 7 &&
      interestsValid
    ) {
      setStep(8);
      return;
    }

    if (
      step === 8 &&
      promptsValid
    ) {
      setStep(9);
      return;
    }

    if (
      step === 9 &&
      photosValid
    ) {
      setSaveError("");
      setReviewing(true);
    }
  }

  // ===========================================================================
  // BACK
  // ===========================================================================

  function back() {
    if (saving) {
      return;
    }

    if (reviewing) {
      setSaveError("");
      setReviewing(false);
      return;
    }

    if (step > 0) {
      setStep(
        (current) =>
          current - 1,
      );

      return;
    }

    onBack?.();
  }

  // ===========================================================================
  // INTERESTS
  // ===========================================================================

  function toggleInterest(
    value: string,
  ) {
    setInterests(
      (current) => {
        if (
          current.includes(
            value,
          )
        ) {
          return current.filter(
            (item) =>
              item !== value,
          );
        }

        if (
          current.length >=
          8
        ) {
          return current;
        }

        return [
          ...current,
          value,
        ];
      },
    );
  }

  // ===========================================================================
  // PROMPTS
  // ===========================================================================

  function updatePrompt(
    index: number,
    field:
      | "prompt"
      | "answer",
    value: string,
  ) {
    setPrompts(
      (current) =>
        current.map(
          (item, i) =>
            i === index
              ? {
                  ...item,
                  [field]:
                    value,
                }
              : item,
        ),
    );
  }

  // ===========================================================================
  // PHOTOS
  // ===========================================================================

  async function addPhotos(
    files:
      | FileList
      | null,
  ) {
    if (!files) {
      return;
    }

    const remaining =
      6 - photos.length;

    if (
      remaining <= 0
    ) {
      return;
    }

    const selected =
      Array.from(
        files,
      )
        .filter((file) =>
          file.type.startsWith(
            "image/",
          ),
        )
        .slice(
          0,
          remaining,
        );

    const items =
      await Promise.all(
        selected.map(
          async (
            file,
            index,
          ) => ({
            id: `${Date.now()}-${index}-${file.name}`,
            file,
            preview:
              await fileToDataUrl(
                file,
              ),
          }),
        ),
      );

    setPhotos(
      (current) => [
        ...current,
        ...items,
      ],
    );
  }

  function removePhoto(
    id: string,
  ) {
    setPhotos(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id,
        ),
    );
  }

  // ===========================================================================
  // FINISH PROFILE
  // ===========================================================================

  async function finishProfile() {
    if (
      saving ||
      age === null
    ) {
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      await saveOnboardingProfile({
        name:
          cleanName,

        dob,

        age,

        gender:
          displayGender,

        orientation,

        interestedIn,

        relationshipGoal,

        neighborhood:
          cleanNeighborhood,

        distanceKm,

        bio:
          cleanBio,

        interests,

        prompts,

        photos:
          photos.map(
            (photo) =>
              photo.file,
          ),
      });

      onComplete();
    } catch (error) {
      console.error(
        "Onboarding save failed:",
        error,
      );

      if (
        error instanceof
        Error
      ) {
        setSaveError(
          error.message,
        );
      } else {
        setSaveError(
          "Something went wrong while saving your profile. Please try again.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // ===========================================================================
  // REVIEW
  // ===========================================================================

  if (reviewing) {
    return (
      <ReviewStep
        email={email}
        name={cleanName}
        age={age}
        gender={
          displayGender
        }
        orientation={
          orientation
        }
        interestedIn={
          interestedIn
        }
        relationshipGoal={
          relationshipGoal
        }
        neighborhood={
          cleanNeighborhood
        }
        distanceKm={
          distanceKm
        }
        bio={cleanBio}
        interests={
          interests
        }
        prompts={prompts}
        photos={photos}
        onBack={back}
        onFinish={
          finishProfile
        }
        saving={saving}
        saveError={
          saveError
        }
      />
    );
  }

  // ===========================================================================
  // WIZARD
  // ===========================================================================

  return (
    <div className="w-full max-w-[540px]">
      <div
        className="
          relative
          overflow-hidden
          rounded-[30px]
          border
          border-white/55
          bg-white/[0.30]
          px-7
          py-8
          shadow-[0_24px_80px_rgba(58,38,58,0.13),inset_0_1px_0_rgba(255,255,255,0.6)]
          backdrop-blur-[36px]
          backdrop-saturate-[150%]
          sm:px-10
          sm:py-10
        "
      >
        <WizardHeader
          email={email}
          step={step}
          onBack={back}
        />

        <div
          key={step}
          className="animate-[stepIn_500ms_cubic-bezier(.22,1,.36,1)_both]"
        >
          {step === 0 && (
            <NameStep
              name={name}
              setName={
                setName
              }
              valid={
                nameValid
              }
              onContinue={
                next
              }
            />
          )}

          {step === 1 && (
            <BirthdayStep
              dob={dob}
              setDob={
                setDob
              }
              age={age}
              maxDob={
                maxDob
              }
              valid={
                birthdayValid
              }
              onContinue={
                next
              }
            />
          )}

          {step === 2 && (
            <IdentityStep
              gender={gender}
              setGender={
                setGender
              }
              customGender={
                customGender
              }
              setCustomGender={
                setCustomGender
              }
              orientation={
                orientation
              }
              setOrientation={
                setOrientation
              }
              valid={
                identityValid
              }
              onContinue={
                next
              }
            />
          )}

          {step === 3 && (
            <InterestedStep
              interestedIn={
                interestedIn
              }
              setInterestedIn={
                setInterestedIn
              }
              valid={
                interestedValid
              }
              onContinue={
                next
              }
            />
          )}

          {step === 4 && (
            <RelationshipStep
              value={
                relationshipGoal
              }
              setValue={
                setRelationshipGoal
              }
              valid={
                relationshipValid
              }
              onContinue={
                next
              }
            />
          )}

          {step === 5 && (
            <LocationStep
              neighborhood={
                neighborhood
              }
              setNeighborhood={
                setNeighborhood
              }
              distanceKm={
                distanceKm
              }
              setDistanceKm={
                setDistanceKm
              }
              valid={
                locationValid
              }
              onContinue={
                next
              }
            />
          )}

          {step === 6 && (
            <BioStep
              bio={bio}
              setBio={setBio}
              valid={
                bioValid
              }
              onContinue={
                next
              }
            />
          )}

          {step === 7 && (
            <InterestsStep
              selected={
                interests
              }
              toggle={
                toggleInterest
              }
              valid={
                interestsValid
              }
              onContinue={
                next
              }
            />
          )}

          {step === 8 && (
            <PromptsStep
              prompts={
                prompts
              }
              updatePrompt={
                updatePrompt
              }
              valid={
                promptsValid
              }
              onContinue={
                next
              }
            />
          )}

          {step === 9 && (
            <PhotosStep
              photos={
                photos
              }
              addPhotos={
                addPhotos
              }
              removePhoto={
                removePhoto
              }
              valid={
                photosValid
              }
              onContinue={
                next
              }
            />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes stepIn {
          from {
            opacity: 0;
            transform:
              translateY(10px)
              scale(0.992);
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

// =============================================================================
// HEADER
// =============================================================================

function WizardHeader({
  email,
  step,
  onBack,
}: {
  email: string;
  step: number;
  onBack: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="
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

        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-[#755f72]/55">
            Your profile
          </p>

          <p className="mt-1 max-w-[170px] truncate text-[11px] text-[#695969]/75">
            {email}
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-2">
        {Array.from(
          {
            length:
              TOTAL_STEPS,
          },
          (_, index) => (
            <div
              key={index}
              className={`
                h-[4px]
                flex-1
                rounded-full
                transition-all
                duration-500
                ${
                  index <= step
                    ? "bg-[#9b5267]"
                    : "bg-[#49394c]/10"
                }
              `}
            />
          ),
        )}
      </div>

      <p className="mt-3 text-right text-[10.5px] text-[#786878]/55">
        {step + 1} of{" "}
        {TOTAL_STEPS}
      </p>
    </>
  );
}

// =============================================================================
// STEP SHELL
// =============================================================================

function StepHeading({
  eyebrow,
  children,
  description,
}: {
  eyebrow: string;
  children:
    React.ReactNode;
  description: string;
}) {
  return (
    <div className="pt-7">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9b5267]">
        {eyebrow}
      </p>

      <h1
        className="
          mt-3
          font-display
          text-[38px]
          font-medium
          leading-[1.05]
          tracking-[-0.045em]
          text-[#2d2230]
          sm:text-[44px]
        "
      >
        {children}
      </h1>

      <p className="mt-4 max-w-[400px] text-[14px] leading-6 text-[#695969]">
        {description}
      </p>
    </div>
  );
}

// =============================================================================
// NAME
// =============================================================================

function NameStep({
  name,
  setName,
  valid,
  onContinue,
}: {
  name: string;
  setName: (
    value: string,
  ) => void;
  valid: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="First things first"
        description="This is the name people will see on your profile."
      >
        What should we
        <br />
        call you?
      </StepHeading>

      <div className="mt-8">
        <label
          htmlFor="profile-name"
          className="ml-1 block text-[12px] font-medium text-[#5d4c5e]"
        >
          Your name
        </label>

        <input
          id="profile-name"
          type="text"
          autoComplete="name"
          autoFocus
          maxLength={40}
          placeholder="Your first name"
          value={name}
          onChange={(event) =>
            setName(
              event.target.value,
            )
          }
          onKeyDown={(event) => {
            if (
              event.key ===
                "Enter" &&
              valid
            ) {
              onContinue();
            }
          }}
          className={inputClass}
        />

        <div className="mt-2 flex justify-between px-1">
          <p className="text-[11px] text-[#786878]/65">
            2–40 characters
          </p>

          <p className="text-[11px] text-[#786878]/65">
            {name.length}/40
          </p>
        </div>

        <ContinueButton
          disabled={!valid}
          onClick={
            onContinue
          }
        />
      </div>
    </div>
  );
}

// =============================================================================
// BIRTHDAY
// =============================================================================

function BirthdayStep({
  dob,
  setDob,
  age,
  maxDob,
  valid,
  onContinue,
}: {
  dob: string;
  setDob: (
    value: string,
  ) => void;
  age: number | null;
  maxDob: string;
  valid: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="The basics"
        description="You must be at least 18 to use UmeLike. Your exact birthday stays private — only your age is shown."
      >
        When were you
        <br />
        born?
      </StepHeading>

      <div className="mt-8">
        <label
          htmlFor="birth-date"
          className="ml-1 block text-[12px] font-medium text-[#5d4c5e]"
        >
          Date of birth
        </label>

        <input
          id="birth-date"
          type="date"
          max={maxDob}
          value={dob}
          onChange={(event) =>
            setDob(
              event.target.value,
            )
          }
          className={inputClass}
        />

        {age !== null && (
          <div
            className={`
              mt-4
              rounded-[16px]
              border
              px-4
              py-3
              text-[12px]
              leading-5
              ${
                valid
                  ? "border-[#5e8c72]/15 bg-[#5e8c72]/[0.07] text-[#466c57]"
                  : "border-[#9b5267]/15 bg-[#9b5267]/[0.07] text-[#814255]"
              }
            `}
          >
            {valid
              ? `You'll appear as ${age} on your profile.`
              : "You need to be at least 18 to create an UmeLike profile."}
          </div>
        )}

        <ContinueButton
          disabled={!valid}
          onClick={
            onContinue
          }
        />
      </div>
    </div>
  );
}

// =============================================================================
// IDENTITY
// =============================================================================

function IdentityStep({
  gender,
  setGender,
  customGender,
  setCustomGender,
  orientation,
  setOrientation,
  valid,
  onContinue,
}: {
  gender: string;
  setGender: (
    value: string,
  ) => void;
  customGender: string;
  setCustomGender: (
    value: string,
  ) => void;
  orientation: string;
  setOrientation: (
    value: string,
  ) => void;
  valid: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="About you"
        description="Choose what feels right to you. You’ll be able to change this later."
      >
        How do you
        <br />
        identify?
      </StepHeading>

      <div className="mt-8">
        <p className="ml-1 text-[12px] font-medium text-[#5d4c5e]">
          Gender
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {GENDER_OPTIONS.map(
            (option) => {
              const selected =
                gender ===
                option;

              return (
                <ChoiceButton
                  key={option}
                  selected={
                    selected
                  }
                  onClick={() => {
                    setGender(
                      option,
                    );

                    if (
                      option !==
                      "Self-describe"
                    ) {
                      setCustomGender(
                        "",
                      );
                    }
                  }}
                >
                  {option}
                </ChoiceButton>
              );
            },
          )}
        </div>

        {gender ===
          "Self-describe" && (
          <input
            type="text"
            maxLength={40}
            autoFocus
            placeholder="How do you identify?"
            value={
              customGender
            }
            onChange={(event) =>
              setCustomGender(
                event.target.value,
              )
            }
            className={inputClass}
          />
        )}
      </div>

      <div className="mt-8">
        <p className="ml-1 text-[12px] font-medium text-[#5d4c5e]">
          Sexual orientation
        </p>

        <div className="mt-3 flex flex-wrap gap-2.5">
          {ORIENTATION_OPTIONS.map(
            (option) => (
              <PillButton
                key={option}
                selected={
                  orientation ===
                  option
                }
                onClick={() =>
                  setOrientation(
                    option,
                  )
                }
              >
                {option}
              </PillButton>
            ),
          )}
        </div>
      </div>

      <ContinueButton
        disabled={!valid}
        onClick={
          onContinue
        }
      />
    </div>
  );
}

// =============================================================================
// INTERESTED IN
// =============================================================================

function InterestedStep({
  interestedIn,
  setInterestedIn,
  valid,
  onContinue,
}: {
  interestedIn: string;
  setInterestedIn: (
    value: string,
  ) => void;
  valid: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Your dating preferences"
        description="Choose who you’d like to see while discovering people on UmeLike."
      >
        Who would you
        <br />
        like to meet?
      </StepHeading>

      <div className="mt-8 space-y-3">
        {INTERESTED_OPTIONS.map(
          (option) => {
            const selected =
              interestedIn ===
              option.value;

            return (
              <LargeChoice
                key={
                  option.value
                }
                title={
                  option.label
                }
                description={
                  option.description
                }
                selected={
                  selected
                }
                onClick={() =>
                  setInterestedIn(
                    option.value,
                  )
                }
              />
            );
          },
        )}
      </div>

      <ContinueButton
        disabled={!valid}
        onClick={
          onContinue
        }
      />
    </div>
  );
}

// =============================================================================
// RELATIONSHIP
// =============================================================================

function RelationshipStep({
  value,
  setValue,
  valid,
  onContinue,
}: {
  value: string;
  setValue: (
    value: string,
  ) => void;
  valid: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Intentions"
        description="Being clear about what you want makes it easier to meet someone who wants the same thing."
      >
        What are you
        <br />
        looking for?
      </StepHeading>

      <div className="mt-8 space-y-2.5">
        {RELATIONSHIP_OPTIONS.map(
          (option) => (
            <LargeChoice
              key={option}
              title={option}
              selected={
                value === option
              }
              onClick={() =>
                setValue(
                  option,
                )
              }
            />
          ),
        )}
      </div>

      <ContinueButton
        disabled={!valid}
        onClick={
          onContinue
        }
      />
    </div>
  );
}

// =============================================================================
// LOCATION
// =============================================================================

function LocationStep({
  neighborhood,
  setNeighborhood,
  distanceKm,
  setDistanceKm,
  valid,
  onContinue,
}: {
  neighborhood: string;
  setNeighborhood: (
    value: string,
  ) => void;
  distanceKm: number;
  setDistanceKm: (
    value: number,
  ) => void;
  valid: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Around you"
        description="We only need your general area — not your street or exact address."
      >
        Where should we
        <br />
        look for people?
      </StepHeading>

      <div className="mt-8">
        <label
          htmlFor="neighborhood"
          className="ml-1 block text-[12px] font-medium text-[#5d4c5e]"
        >
          Neighborhood or locality
        </label>

        <input
          id="neighborhood"
          type="text"
          maxLength={80}
          placeholder="e.g. Bandra West"
          value={
            neighborhood
          }
          onChange={(event) =>
            setNeighborhood(
              event.target.value,
            )
          }
          className={inputClass}
        />
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#5d4c5e]">
              Maximum distance
            </p>

            <p className="mt-1 text-[11px] text-[#786878]/65">
              You can change
              this later.
            </p>
          </div>

          <p className="font-display text-[26px] font-medium text-[#814255]">
            {distanceKm}
            <span className="ml-1 font-body text-[12px] font-medium">
              km
            </span>
          </p>
        </div>

        <input
          type="range"
          min={1}
          max={100}
          step={1}
          value={
            distanceKm
          }
          onChange={(event) =>
            setDistanceKm(
              Number(
                event.target
                  .value,
              ),
            )
          }
          className="mt-5 w-full accent-[#9b5267]"
        />

        <div className="mt-2 flex justify-between text-[10.5px] text-[#786878]/55">
          <span>1 km</span>
          <span>100 km</span>
        </div>
      </div>

      <ContinueButton
        disabled={!valid}
        onClick={
          onContinue
        }
      />
    </div>
  );
}

// =============================================================================
// BIO
// =============================================================================

function BioStep({
  bio,
  setBio,
  valid,
  onContinue,
}: {
  bio: string;
  setBio: (
    value: string,
  ) => void;
  valid: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="In your own words"
        description="A few genuine lines are better than trying to sound perfect."
      >
        Tell people a little
        <br />
        about you
      </StepHeading>

      <div className="mt-8">
        <textarea
          rows={6}
          maxLength={500}
          placeholder="I’m happiest when..."
          value={bio}
          onChange={(event) =>
            setBio(
              event.target.value,
            )
          }
          className="
            w-full
            resize-none
            rounded-[20px]
            border
            border-[#4a394b]/10
            bg-white/45
            px-5
            py-4
            text-[14px]
            leading-6
            text-[#332736]
            outline-none
            backdrop-blur-xl
            transition
            placeholder:text-[#796b79]/45
            hover:border-[#9b5267]/20
            focus:border-[#9b5267]/45
            focus:bg-white/65
            focus:ring-4
            focus:ring-[#9b5267]/10
          "
        />

        <div className="mt-2 flex justify-between px-1">
          <p
            className={`text-[11px] ${
              bio.trim()
                  .length >= 20
                ? "text-[#786878]/65"
                : "text-[#9b5267]/70"
            }`}
          >
            At least 20
            characters
          </p>

          <p className="text-[11px] text-[#786878]/65">
            {bio.length}/500
          </p>
        </div>
      </div>

      <ContinueButton
        disabled={!valid}
        onClick={
          onContinue
        }
      />
    </div>
  );
}

// =============================================================================
// INTERESTS
// =============================================================================

function InterestsStep({
  selected,
  toggle,
  valid,
  onContinue,
}: {
  selected: string[];
  toggle: (
    value: string,
  ) => void;
  valid: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="The things you enjoy"
        description="Choose at least 3. Pick the things you’d genuinely enjoy talking about with someone."
      >
        What are you
        <br />
        into?
      </StepHeading>

      <div className="mt-7 flex flex-wrap gap-2.5">
        {INTEREST_OPTIONS.map(
          (interest) => (
            <PillButton
              key={interest}
              selected={selected.includes(
                interest,
              )}
              onClick={() =>
                toggle(
                  interest,
                )
              }
            >
              {interest}
            </PillButton>
          ),
        )}
      </div>

      <div className="mt-5 flex justify-between text-[11px] text-[#786878]/65">
        <span>
          Minimum 3
        </span>

        <span>
          {selected.length}/8
        </span>
      </div>

      <ContinueButton
        disabled={!valid}
        onClick={
          onContinue
        }
      />
    </div>
  );
}

// =============================================================================
// PROMPTS
// =============================================================================

function PromptsStep({
  prompts,
  updatePrompt,
  valid,
  onContinue,
}: {
  prompts: PromptAnswer[];
  updatePrompt: (
    index: number,
    field:
      | "prompt"
      | "answer",
    value: string,
  ) => void;
  valid: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Give people something to start with"
        description="Answer three prompts. A specific answer usually makes for a much better conversation."
      >
        Let your personality
        <br />
        do some talking
      </StepHeading>

      <div className="mt-7 space-y-5">
        {prompts.map(
          (
            item,
            index,
          ) => (
            <div
              key={index}
              className="
                rounded-[20px]
                border
                border-white/45
                bg-white/30
                p-4
                backdrop-blur-xl
              "
            >
              <select
                value={
                  item.prompt
                }
                onChange={(event) =>
                  updatePrompt(
                    index,
                    "prompt",
                    event.target
                      .value,
                  )
                }
                className="
                  h-[48px]
                  w-full
                  rounded-[14px]
                  border
                  border-[#4a394b]/10
                  bg-white/55
                  px-4
                  text-[12.5px]
                  font-medium
                  text-[#49394c]
                  outline-none
                  focus:border-[#9b5267]/40
                "
              >
                {PROMPT_OPTIONS.map(
                  (prompt) => (
                    <option
                      key={
                        prompt
                      }
                      value={
                        prompt
                      }
                    >
                      {prompt}
                    </option>
                  ),
                )}
              </select>

              <textarea
                rows={3}
                maxLength={180}
                placeholder="Write your answer..."
                value={
                  item.answer
                }
                onChange={(event) =>
                  updatePrompt(
                    index,
                    "answer",
                    event.target
                      .value,
                  )
                }
                className="
                  mt-3
                  w-full
                  resize-none
                  rounded-[14px]
                  border
                  border-[#4a394b]/10
                  bg-white/45
                  px-4
                  py-3
                  text-[13px]
                  leading-5
                  text-[#332736]
                  outline-none
                  transition
                  placeholder:text-[#796b79]/45
                  focus:border-[#9b5267]/40
                  focus:bg-white/65
                "
              />

              <p className="mt-1 text-right text-[10px] text-[#786878]/55">
                {
                  item.answer
                    .length
                }
                /180
              </p>
            </div>
          ),
        )}
      </div>

      {!valid && (
        <p className="mt-4 text-center text-[11px] leading-5 text-[#786878]/65">
          Use three different
          prompts and write at
          least 10 characters
          for each answer.
        </p>
      )}

      <ContinueButton
        disabled={!valid}
        onClick={
          onContinue
        }
      />
    </div>
  );
}

// =============================================================================
// PHOTOS
// =============================================================================

function PhotosStep({
  photos,
  addPhotos,
  removePhoto,
  valid,
  onContinue,
}: {
  photos: PhotoItem[];
  addPhotos: (
    files:
      | FileList
      | null,
  ) => Promise<void>;
  removePhoto: (
    id: string,
  ) => void;
  valid: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Last one"
        description="Add photos that actually look like you. Your first photo will become your main profile photo."
      >
        Put a face
        <br />
        to the profile
      </StepHeading>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map(
          (
            photo,
            index,
          ) => (
            <div
              key={
                photo.id
              }
              className="
                group
                relative
                aspect-[4/5]
                overflow-hidden
                rounded-[20px]
                border
                border-white/50
                bg-white/30
                shadow-[0_8px_24px_rgba(50,35,48,0.08)]
              "
              style={{
                backgroundImage: `url("${photo.preview}")`,
                backgroundSize:
                  "cover",
                backgroundPosition:
                  "center",
              }}
            >
              {index === 0 && (
                <span
                  className="
                    absolute
                    left-2.5
                    top-2.5
                    rounded-full
                    bg-[#2f2532]/85
                    px-2.5
                    py-1
                    text-[9px]
                    font-medium
                    text-white
                    backdrop-blur-md
                  "
                >
                  Main
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  removePhoto(
                    photo.id,
                  )
                }
                className="
                  absolute
                  right-2.5
                  top-2.5
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  bg-black/45
                  text-[13px]
                  text-white
                  backdrop-blur-md
                  transition
                  hover:bg-black/65
                "
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ),
        )}

        {photos.length <
          6 && (
          <label
            className="
              flex
              aspect-[4/5]
              cursor-pointer
              flex-col
              items-center
              justify-center
              rounded-[20px]
              border
              border-dashed
              border-[#9b5267]/25
              bg-white/25
              text-center
              backdrop-blur-xl
              transition
              hover:border-[#9b5267]/45
              hover:bg-white/45
            "
          >
            <span
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-[#9b5267]/10
                text-[22px]
                text-[#9b5267]
              "
            >
              +
            </span>

            <span className="mt-3 text-[11px] font-medium text-[#695969]">
              Add photo
            </span>

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(
                event,
              ) => {
                void addPhotos(
                  event.target
                    .files,
                );

                event.target.value =
                  "";
              }}
            />
          </label>
        )}
      </div>

      <div className="mt-4 flex justify-between text-[11px] text-[#786878]/65">
        <span>
          At least 1 photo
        </span>

        <span>
          {photos.length}/6
        </span>
      </div>

      <ContinueButton
        disabled={!valid}
        onClick={
          onContinue
        }
        label="Review my profile"
      />
    </div>
  );
}

// =============================================================================
// REVIEW
// =============================================================================

function ReviewStep({
  email,
  name,
  age,
  gender,
  orientation,
  interestedIn,
  relationshipGoal,
  neighborhood,
  distanceKm,
  bio,
  interests,
  prompts,
  photos,
  onBack,
  onFinish,
  saving,
  saveError,
}: {
  email: string;
  name: string;
  age: number | null;
  gender: string;
  orientation: string;
  interestedIn: string;
  relationshipGoal: string;
  neighborhood: string;
  distanceKm: number;
  bio: string;
  interests: string[];
  prompts: PromptAnswer[];
  photos: PhotoItem[];
  onBack: () => void;
  onFinish: () => void;
  saving: boolean;
  saveError: string;
}) {
  return (
    <div className="w-full max-w-[620px]">
      <div
        className="
          max-h-[78vh]
          overflow-y-auto
          rounded-[30px]
          border
          border-white/55
          bg-white/[0.30]
          px-7
          py-8
          shadow-[0_24px_80px_rgba(58,38,58,0.13)]
          backdrop-blur-[36px]
          sm:px-10
          sm:py-10
        "
      >
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="
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
            transition
            hover:bg-white/65
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
          aria-label="Go back"
        >
          ←
        </button>

        <p className="mt-7 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9b5267]">
          Almost there
        </p>

        <h1 className="mt-3 font-display text-[42px] font-medium leading-[1.04] tracking-[-0.045em] text-[#2d2230]">
          This is you
        </h1>

        <p className="mt-4 text-[14px] leading-6 text-[#695969]">
          Give everything one
          last look before we
          save it to UmeLike.
        </p>

        {photos[0] && (
          <div
            className="
              mt-8
              aspect-[4/3]
              w-full
              rounded-[24px]
              bg-white/30
              bg-cover
              bg-center
              shadow-[0_12px_36px_rgba(45,34,48,0.12)]
            "
            style={{
              backgroundImage: `url("${photos[0].preview}")`,
            }}
          />
        )}

        <div className="mt-7">
          <h2 className="font-display text-[34px] font-medium tracking-[-0.04em] text-[#2d2230]">
            {name}
            {age !== null &&
              `, ${age}`}
          </h2>

          <p className="mt-2 text-[13px] text-[#695969]">
            {neighborhood}
          </p>

          <p className="mt-1 text-[11px] text-[#786878]/60">
            {email}
          </p>
        </div>

        <ReviewSection title="About">
          <p>
            {bio}
          </p>
        </ReviewSection>

        <ReviewSection title="Identity">
          <ReviewTag>
            {gender}
          </ReviewTag>

          <ReviewTag>
            {orientation}
          </ReviewTag>
        </ReviewSection>

        <ReviewSection title="Looking for">
          <p>
            {relationshipGoal}
          </p>

          <p className="mt-1 text-[12px] text-[#786878]/70">
            Interested in{" "}
            {interestedIn.toLowerCase()}
            {" · "}
            within{" "}
            {distanceKm} km
          </p>
        </ReviewSection>

        <ReviewSection title="Interests">
          <div className="flex flex-wrap gap-2">
            {interests.map(
              (interest) => (
                <ReviewTag
                  key={
                    interest
                  }
                >
                  {interest}
                </ReviewTag>
              ),
            )}
          </div>
        </ReviewSection>

        <ReviewSection title="Prompts">
          <div className="space-y-4">
            {prompts.map(
              (
                prompt,
                index,
              ) => (
                <div
                  key={
                    index
                  }
                  className="
                    rounded-[18px]
                    border
                    border-white/40
                    bg-white/25
                    p-4
                  "
                >
                  <p className="text-[11px] font-medium text-[#9b5267]">
                    {
                      prompt.prompt
                    }
                  </p>

                  <p className="mt-2 text-[13px] leading-5 text-[#49394c]">
                    {
                      prompt.answer
                    }
                  </p>
                </div>
              ),
            )}
          </div>
        </ReviewSection>

        {photos.length > 1 && (
          <ReviewSection title="Photos">
            <div className="grid grid-cols-3 gap-2">
              {photos
                .slice(1)
                .map(
                  (
                    photo,
                  ) => (
                    <div
                      key={
                        photo.id
                      }
                      className="aspect-[4/5] rounded-[14px] bg-cover bg-center"
                      style={{
                        backgroundImage: `url("${photo.preview}")`,
                      }}
                    />
                  ),
                )}
            </div>
          </ReviewSection>
        )}

        {saveError && (
          <div
            className="
              mt-8
              rounded-[18px]
              border
              border-[#9b5267]/20
              bg-[#9b5267]/[0.08]
              px-5
              py-4
              text-center
            "
          >
            <p className="text-[12px] font-medium text-[#814255]">
              We couldn&apos;t finish your profile
            </p>

            <p className="mt-2 text-[11px] leading-5 text-[#786878]/80">
              {saveError}
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={() =>
            void onFinish()
          }
          className="
            mt-8
            flex
            h-[58px]
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
            disabled:opacity-55
          "
        >
          {saving ? (
            <span className="flex items-center gap-3">
              <span
                className="
                  h-4
                  w-4
                  animate-spin
                  rounded-full
                  border-2
                  border-white/30
                  border-t-white
                "
              />

              Saving your profile…
            </span>
          ) : (
            "Finish profile"
          )}
        </button>

        <p className="mt-3 text-center text-[10.5px] leading-5 text-[#786878]/55">
          Your profile becomes visible only after everything has been saved successfully.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// REVIEW HELPERS
// =============================================================================

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="mt-7 border-t border-[#49394c]/10 pt-6">
      <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.13em] text-[#786878]/60">
        {title}
      </p>

      <div className="text-[13px] leading-6 text-[#49394c]">
        {children}
      </div>
    </section>
  );
}

function ReviewTag({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span
      className="
        mr-2
        inline-flex
        rounded-full
        border
        border-[#9b5267]/15
        bg-[#9b5267]/[0.07]
        px-3
        py-1.5
        text-[11px]
        font-medium
        text-[#714254]
      "
    >
      {children}
    </span>
  );
}

// =============================================================================
// CHOICE BUTTONS
// =============================================================================

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        min-h-[52px]
        rounded-[17px]
        border
        px-4
        text-[13px]
        font-medium
        backdrop-blur-xl
        transition
        duration-200
        ${
          selected
            ? "border-[#9b5267]/45 bg-[#9b5267]/[0.12] text-[#733e51] shadow-[0_7px_20px_rgba(155,82,103,0.09)]"
            : "border-white/45 bg-white/35 text-[#5f4d60] hover:border-[#9b5267]/25 hover:bg-white/55"
        }
      `}
    >
      {children}
    </button>
  );
}

function PillButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-full
        border
        px-4
        py-2.5
        text-[12.5px]
        font-medium
        backdrop-blur-xl
        transition
        duration-200
        ${
          selected
            ? "border-[#9b5267]/45 bg-[#9b5267]/[0.12] text-[#733e51] shadow-[0_6px_18px_rgba(155,82,103,0.08)]"
            : "border-white/45 bg-white/35 text-[#5f4d60] hover:border-[#9b5267]/25 hover:bg-white/55"
        }
      `}
    >
      {children}
    </button>
  );
}

function LargeChoice({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        min-h-[64px]
        w-full
        items-center
        justify-between
        rounded-[19px]
        border
        px-5
        text-left
        backdrop-blur-xl
        transition
        duration-200
        ${
          selected
            ? "border-[#9b5267]/45 bg-[#9b5267]/[0.12] shadow-[0_8px_26px_rgba(155,82,103,0.10)]"
            : "border-white/45 bg-white/35 hover:-translate-y-[1px] hover:border-[#9b5267]/20 hover:bg-white/55"
        }
      `}
    >
      <div>
        <p
          className={`text-[14px] font-medium ${
            selected
              ? "text-[#733e51]"
              : "text-[#443546]"
          }`}
        >
          {title}
        </p>

        {description && (
          <p className="mt-1 text-[11px] text-[#786878]/65">
            {description}
          </p>
        )}
      </div>

      <div
        className={`
          flex
          h-[23px]
          w-[23px]
          shrink-0
          items-center
          justify-center
          rounded-full
          border
          ${
            selected
              ? "border-[#9b5267] bg-[#9b5267]"
              : "border-[#59485a]/20 bg-white/30"
          }
        `}
      >
        {selected && (
          <span className="text-[11px] font-semibold text-white">
            ✓
          </span>
        )}
      </div>
    </button>
  );
}

// =============================================================================
// CONTINUE
// =============================================================================

function ContinueButton({
  disabled,
  onClick,
  label = "Continue",
}: {
  disabled: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="
        mt-6
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
      {label}
    </button>
  );
}

// =============================================================================
// INPUT CLASS
// =============================================================================

const inputClass = `
  mt-2
  h-[58px]
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
  placeholder:text-[#796b79]/45
  hover:border-[#9b5267]/20
  focus:border-[#9b5267]/45
  focus:bg-white/65
  focus:ring-4
  focus:ring-[#9b5267]/10
`;

// =============================================================================
// DATE HELPERS
// =============================================================================

function getAge(
  value: string,
): number | null {
  if (!value) {
    return null;
  }

  const birthDate =
    new Date(
      `${value}T00:00:00`,
    );

  if (
    Number.isNaN(
      birthDate.getTime(),
    )
  ) {
    return null;
  }

  const today =
    new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const birthdayPassed =
    today.getMonth() >
      birthDate.getMonth() ||
    (
      today.getMonth() ===
        birthDate.getMonth() &&
      today.getDate() >=
        birthDate.getDate()
    );

  if (!birthdayPassed) {
    age -= 1;
  }

  return age;
}

function getMaxDateFor18Plus() {
  const today =
    new Date();

  const maxDate =
    new Date(
      today.getFullYear() -
        18,
      today.getMonth(),
      today.getDate(),
    );

  const year =
    maxDate.getFullYear();

  const month =
    String(
      maxDate.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      maxDate.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

// =============================================================================
// FILE HELPERS
// =============================================================================

function fileToDataUrl(
  file: File,
): Promise<string> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const reader =
        new FileReader();

      reader.onload =
        () => {
          if (
            typeof reader.result ===
            "string"
          ) {
            resolve(
              reader.result,
            );
            return;
          }

          reject(
            new Error(
              "Could not read image.",
            ),
          );
        };

      reader.onerror =
        () => {
          reject(
            reader.error ??
              new Error(
                "Could not read image.",
              ),
          );
        };

      reader.readAsDataURL(
        file,
      );
    },
  );
}