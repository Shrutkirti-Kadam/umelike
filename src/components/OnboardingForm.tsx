"use client";

import { useId, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveProfile, type SaveProfileState } from "@/actions/profile";
import {
  GENDER_OPTIONS,
  INTERESTED_IN_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/lib/profile-options";
import {
  MAX_PROFILE_PROMPTS,
  PROFILE_PROMPTS,
  PROMPTS_PER_PAGE,
} from "@/lib/prompt-options";

type SelectedPrompt = {
  question: string;
  answer: string;
};

type Defaults = {
  fullName: string;
  phone: string;
  birthDate: string;
  gender: string;
  pronouns: string;
  interestedIn: string[];
  relationshipIntent: string;
  bio: string;
  interests: string;
  photos: string[];
  streetAddress: string;
  city: string;
  postalCode: string;
  maxDistanceKm: string;
};

const initialState: SaveProfileState = { errors: {} };

export function OnboardingForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction] = useFormState(saveProfile, initialState);
  const e = state.errors;

  return (
    <form action={formAction} noValidate className="mt-8 space-y-8">
      <ProfileSection
        title="The essentials"
        description="The basics people will use to understand who you are."
      >
        <Field
          label="Full name"
          name="fullName"
          type="text"
          autoComplete="name"
          defaultValue={defaults.fullName}
          error={e.fullName}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Date of birth"
            name="birthDate"
            type="date"
            autoComplete="bday"
            defaultValue={defaults.birthDate}
            error={e.birthDate}
            hint="You must be 18 or older. Your exact date stays private; only your age is shown."
          />
          <SelectField
            label="Gender"
            name="gender"
            defaultValue={defaults.gender}
            options={GENDER_OPTIONS}
            placeholder="Select your gender"
            error={e.gender}
          />
        </div>

        <Field
          label="Pronouns"
          name="pronouns"
          type="text"
          autoComplete="off"
          defaultValue={defaults.pronouns}
          placeholder="For example: she/her"
          error={e.pronouns}
          hint="Optional."
          required={false}
        />

        <CheckboxGroup
          label="Who would you like to meet?"
          name="interestedIn"
          options={INTERESTED_IN_OPTIONS}
          defaultValues={defaults.interestedIn}
          error={e.interestedIn}
        />
      </ProfileSection>

      <ProfileSection
        title="What you're looking for"
        description="Being clear here helps everyone arrive with the same expectations."
      >
        <SelectField
          label="Relationship intention"
          name="relationshipIntent"
          defaultValue={defaults.relationshipIntent}
          options={RELATIONSHIP_OPTIONS}
          placeholder="Choose what feels closest"
          error={e.relationshipIntent}
        />
      </ProfileSection>

      <ProfileSection
        title="Your story"
        description="A few specific details make it easier for someone to start a real conversation."
      >
        <TextareaField
          label="About you"
          name="bio"
          defaultValue={defaults.bio}
          placeholder="What should someone know about the life you're building?"
          error={e.bio}
          maxLength={500}
          hint="20–500 characters."
        />

        <Field
          label="Interests"
          name="interests"
          type="text"
          autoComplete="off"
          defaultValue={defaults.interests}
          placeholder="Cooking, live music, hiking"
          error={e.interests}
          hint="Add 3–10 interests, separated by commas."
        />

        <PromptPicker
          questionError={e.promptQuestions}
          answerError={e.promptAnswers}
        />
      </ProfileSection>

      <ProfileSection
        title="Photos"
        description="Choose up to five photos from your device. Your first photo is your main one."
      >
        <PhotoUploader defaultPhotos={defaults.photos} error={e.photos} />
      </ProfileSection>

      <ProfileSection
        title="Your area"
        description="We collect your full address privately. Only your sub-city or locality appears on your profile."
      >
        <Field
          label="Full residential address"
          name="streetAddress"
          type="text"
          autoComplete="street-address"
          defaultValue={defaults.streetAddress}
          placeholder="Flat, building, street, locality and city"
          error={e.streetAddress}
          hint="Private. This is never shown on your profile."
        />

        <div className="grid gap-6 sm:grid-cols-[1.6fr_1fr]">
          <Field
            label="Sub-city / locality"
            name="city"
            type="text"
            autoComplete="address-level3"
            defaultValue={defaults.city}
            placeholder="For example: Sanpada or Vashi"
            error={e.city}
            hint="This is the only part of your address shown to others."
          />
          <Field
            label="Postal code"
            name="postalCode"
            type="text"
            autoComplete="postal-code"
            defaultValue={defaults.postalCode}
            error={e.postalCode}
          />
        </div>

        <SelectField
          label="Preferred matching distance"
          name="maxDistanceKm"
          defaultValue={defaults.maxDistanceKm}
          options={[
            { value: "10", label: "Within 10 km" },
            { value: "25", label: "Within 25 km" },
            { value: "50", label: "Within 50 km" },
            { value: "100", label: "Within 100 km" },
            { value: "200", label: "Within 200 km" },
            { value: "500", label: "Within 500 km" },
          ]}
          error={e.maxDistanceKm}
        />

        <p className="text-sm leading-relaxed text-mauve">
          Your full address and postal code stay private and are used only to
          support nearby introductions.
        </p>
      </ProfileSection>

      <ProfileSection
        title="Private account details"
        description="These details are never part of your public profile."
      >
        <Field
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          defaultValue={defaults.phone}
          error={e.phone}
          hint="Used only to verify your account."
        />
      </ProfileSection>

      <SaveButton />
    </form>
  );
}

function PromptPicker({
  questionError,
  answerError,
}: {
  questionError?: string;
  answerError?: string;
}) {
  const [selected, setSelected] = useState<SelectedPrompt[]>([]);
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(PROFILE_PROMPTS.length / PROMPTS_PER_PAGE);
  const visiblePrompts = PROFILE_PROMPTS.slice(
    page * PROMPTS_PER_PAGE,
    (page + 1) * PROMPTS_PER_PAGE
  );
  const message = answerError ?? questionError;
  const atLimit = selected.length >= MAX_PROFILE_PROMPTS;

  function togglePrompt(question: string) {
    setSelected((current) => {
      if (current.some((prompt) => prompt.question === question)) {
        return current.filter((prompt) => prompt.question !== question);
      }
      if (current.length >= MAX_PROFILE_PROMPTS) return current;
      return [...current, { question, answer: "" }];
    });
  }

  function updateAnswer(question: string, answer: string) {
    setSelected((current) =>
      current.map((prompt) =>
        prompt.question === question ? { ...prompt, answer } : prompt
      )
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-soft border border-berry/15 bg-gradient-to-br from-white/70 to-blush/55 shadow-[0_10px_30px_rgba(50,34,48,0.05)]">
        <div className="flex flex-col gap-2 border-b border-plum/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-medium text-plum">
              Choose your prompts
            </h3>
            <p className="mt-0.5 text-sm leading-relaxed text-mauve">
              Pick at least one and up to four. Five choices are shown at a time.
            </p>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              atLimit
                ? "bg-berry text-white"
                : "border border-berry/20 bg-white/70 text-berry-deep"
            }`}
          >
            {selected.length} / {MAX_PROFILE_PROMPTS} selected
          </span>
        </div>

        <div
          className="grid gap-2.5 p-4 sm:p-5"
          role="group"
          aria-label={`Prompt choices, page ${page + 1} of ${totalPages}`}
          aria-describedby={message ? "prompts-error" : undefined}
        >
          {visiblePrompts.map((question, index) => {
            const isSelected = selected.some((prompt) => prompt.question === question);
            const isUnavailable = atLimit && !isSelected;

            return (
              <button
                key={question}
                type="button"
                aria-pressed={isSelected}
                disabled={isUnavailable}
                onClick={() => togglePrompt(question)}
                className={`ease-soft group flex min-h-16 items-center gap-3 rounded-field border px-4 py-3 text-left transition duration-300 ${
                  isSelected
                    ? "border-berry bg-berry text-white shadow-[0_7px_18px_rgba(162,89,107,0.18)]"
                    : isUnavailable
                      ? "cursor-not-allowed border-plum/5 bg-white/35 text-mauve/45"
                      : "border-plum/10 bg-white/65 text-plum hover:-translate-y-0.5 hover:border-berry/45 hover:bg-white"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-berry/10 text-berry-deep group-hover:bg-berry/15"
                  }`}
                >
                  {isSelected ? "✓" : page * PROMPTS_PER_PAGE + index + 1}
                </span>
                <span className="text-sm font-medium leading-snug sm:text-[15px]">
                  {question}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-plum/5 px-4 py-3 sm:px-5">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            className="rounded-full px-3 py-2 text-sm font-medium text-mauve transition hover:bg-plum/5 hover:text-plum disabled:cursor-not-allowed disabled:opacity-35"
          >
            ← Previous
          </button>

          <div
            className="flex items-center gap-2"
            aria-label={`Page ${page + 1} of ${totalPages}`}
          >
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPage(index)}
                aria-label={`Show prompt page ${index + 1}`}
                aria-current={page === index ? "page" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  page === index ? "w-6 bg-berry" : "w-2 bg-berry/25 hover:bg-berry/45"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            disabled={page === totalPages - 1}
            onClick={() =>
              setPage((current) => Math.min(totalPages - 1, current + 1))
            }
            className="rounded-full px-3 py-2 text-sm font-medium text-mauve transition hover:bg-plum/5 hover:text-plum disabled:cursor-not-allowed disabled:opacity-35"
          >
            Next →
          </button>
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="mt-5 space-y-4">
          {selected.map((prompt, index) => {
            const inputId = `prompt-answer-${index}`;
            return (
              <div
                key={prompt.question}
                className="rounded-soft border border-plum/5 bg-white/55 p-4 shadow-[0_6px_20px_rgba(50,34,48,0.035)] sm:p-5"
              >
                <input type="hidden" name="promptQuestions" value={prompt.question} />
                <div className="flex items-start justify-between gap-4">
                  <label
                    htmlFor={inputId}
                    className="font-display text-lg font-medium leading-snug text-plum"
                  >
                    {prompt.question}
                  </label>
                  <button
                    type="button"
                    onClick={() => togglePrompt(prompt.question)}
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-mauve transition hover:bg-berry/10 hover:text-berry-deep"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  id={inputId}
                  name="promptAnswers"
                  required
                  minLength={10}
                  maxLength={200}
                  rows={3}
                  value={prompt.answer}
                  onChange={(event) => updateAnswer(prompt.question, event.target.value)}
                  placeholder="Write something honest and specific…"
                  aria-invalid={!!answerError}
                  aria-describedby={message ? "prompts-error" : undefined}
                  className={`${controlClass(answerError)} mt-3 resize-y`}
                />
                <p className="mt-2 text-right text-xs text-mauve/75">
                  {prompt.answer.length}/200
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-field border border-dashed border-berry/25 bg-berry/[0.035] px-4 py-4 text-center text-sm text-mauve">
          Choose a prompt above and its answer space will appear here.
        </div>
      )}

      {message && <ErrorMessage id="prompts-error" message={message} />}
    </div>
  );
}

const MAX_PHOTOS = 5;
const MAX_SOURCE_PHOTO_BYTES = 12 * 1024 * 1024;
const MAX_SAVED_PHOTO_BYTES = 900 * 1024;
const SUPPORTED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function PhotoUploader({
  defaultPhotos,
  error,
}: {
  defaultPhotos: string[];
  error?: string;
}) {
  const [photos, setPhotos] = useState(() => defaultPhotos.slice(0, MAX_PHOTOS));
  const [uploadError, setUploadError] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;

    const available = MAX_PHOTOS - photos.length;
    if (available <= 0) {
      setUploadError("You can add up to 5 photos.");
      return;
    }

    const selected = Array.from(files).slice(0, available);
    if (files.length > available) {
      setUploadError(`Only the first ${available} selected photo${available === 1 ? "" : "s"} can be added.`);
    } else {
      setUploadError(undefined);
    }

    setProcessing(true);
    try {
      const compressed: string[] = [];
      for (const file of selected) {
        if (!SUPPORTED_PHOTO_TYPES.has(file.type)) {
          throw new Error("Choose JPG, PNG, or WebP images.");
        }
        if (file.size > MAX_SOURCE_PHOTO_BYTES) {
          throw new Error(`${file.name} is over 12 MB. Choose a smaller photo.`);
        }
        compressed.push(await preparePhoto(file));
      }
      setPhotos((current) => [...current, ...compressed].slice(0, MAX_PHOTOS));
    } catch (caught) {
      setUploadError(
        caught instanceof Error ? caught.message : "One of those photos could not be added."
      );
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
    setUploadError(undefined);
  }

  function makeMain(index: number) {
    setPhotos((current) => {
      const next = [...current];
      const [selected] = next.splice(index, 1);
      return [selected, ...next];
    });
  }

  const message = uploadError ?? error;

  return (
    <div>
      {photos.map((photo, index) => (
        <input key={`saved-photo-${index}`} type="hidden" name="photos" value={photo} />
      ))}

      <input
        ref={inputRef}
        id="profile-photos"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        aria-describedby={message ? "photos-error" : "photos-hint"}
        onChange={(event) => void addPhotos(event.target.files)}
      />

      <label
        htmlFor="profile-photos"
        className={`ease-soft flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-soft border border-dashed px-6 py-8 text-center transition duration-300 ${
          processing || photos.length >= MAX_PHOTOS
            ? "cursor-not-allowed border-plum/10 bg-white/35 opacity-65"
            : "border-berry/35 bg-white/55 hover:border-berry/60 hover:bg-white/75"
        }`}
        onClick={(event) => {
          if (processing || photos.length >= MAX_PHOTOS) event.preventDefault();
        }}
      >
        <span
          aria-hidden
          className="flex h-11 w-11 items-center justify-center rounded-full bg-berry/10 text-2xl font-light text-berry"
        >
          +
        </span>
        <span className="mt-3 font-medium text-plum">
          {processing
            ? "Preparing your photos…"
            : photos.length >= MAX_PHOTOS
              ? "All five photo spots are filled"
              : photos.length
                ? "Add more photos"
                : "Choose photos from your device"}
        </span>
        <span id="photos-hint" className="mt-1 text-sm leading-relaxed text-mauve">
          JPG, PNG, or WebP · up to 12 MB each · {photos.length}/{MAX_PHOTOS} added
        </span>
      </label>

      {photos.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={`${photo.slice(0, 48)}-${index}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-field bg-blush shadow-[0_6px_24px_rgba(50,34,48,0.08)]"
            >
              {/* Data URLs are generated locally; HTTPS URLs preserve older profiles. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`Profile photo ${index + 1} preview`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-plum/75 via-plum/20 to-transparent p-3 pt-10">
                {index === 0 ? (
                  <span className="rounded-full bg-ivory/95 px-2.5 py-1 text-[11px] font-semibold text-plum shadow-sm">
                    Main photo
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeMain(index)}
                    className="rounded-full bg-ivory/90 px-2.5 py-1 text-[11px] font-semibold text-plum shadow-sm transition hover:bg-white"
                  >
                    Make main
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label={`Remove profile photo ${index + 1}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ivory/90 text-lg leading-none text-plum shadow-sm transition hover:bg-white hover:text-berry"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && <ErrorMessage id="photos-error" message={message} />}
      <p className="mt-4 text-sm leading-relaxed text-mauve">
        Photos are resized before saving. Use images you own or have permission to share.
      </p>
    </div>
  );
}

async function preparePhoto(file: File) {
  const image = await loadImage(file);
  let result = await renderImage(image, 1440, 0.82);

  if (result.size > MAX_SAVED_PHOTO_BYTES) {
    result = await renderImage(image, 1120, 0.72);
  }
  if (result.size > MAX_SAVED_PHOTO_BYTES) {
    result = await renderImage(image, 900, 0.62);
  }
  if (result.size > MAX_SAVED_PHOTO_BYTES) {
    throw new Error(`${file.name} could not be reduced enough. Choose a less detailed photo.`);
  }

  return blobToDataUrl(result);
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(source);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error(`${file.name} could not be read as an image.`));
    };
    image.src = source;
  });
}

function renderImage(image: HTMLImageElement, maxDimension: number, quality: number) {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare photos for upload.");

  context.fillStyle = "#FBF6EE";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("A photo could not be prepared."))),
      "image/jpeg",
      quality
    );
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("A photo could not be prepared."));
    reader.readAsDataURL(blob);
  });
}

function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <header className="px-1 sm:px-2">
        <h2
          id={headingId}
          className="font-display text-xl font-medium leading-tight text-plum"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-mauve">{description}</p>
      </header>

      <div className="space-y-6 rounded-soft border border-plum/5 bg-white/35 p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  required = true,
  ...input
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  defaultValue: string;
  error?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-plum">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={controlClass(error)}
        {...input}
      />
      <FieldMessage error={error} errorId={errorId} hint={hint} hintId={hintId} />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-plum">
        {label}
      </label>
      <select
        id={name}
        name={name}
        required
        defaultValue={defaultValue}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={controlClass(error)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <ErrorMessage id={errorId} message={error} />}
    </div>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  error,
  hint,
  placeholder,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  maxLength: number;
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-plum">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        required
        rows={4}
        maxLength={maxLength}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`${controlClass(error)} resize-y`}
      />
      <FieldMessage error={error} errorId={errorId} hint={hint} hintId={hintId} />
    </div>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
  defaultValues,
  error,
}: {
  label: string;
  name: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  defaultValues: string[];
  error?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <div>
      <p className="text-sm font-medium text-plum">{label}</p>
      <div
        className="mt-3 grid gap-3 sm:grid-cols-3"
        role="group"
        aria-describedby={error ? errorId : undefined}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-field border border-plum/10 bg-white/60 px-4 py-3 text-sm transition hover:border-berry/40"
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={defaultValues.includes(option.value)}
              className="h-4 w-4 accent-berry"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && <ErrorMessage id={errorId} message={error} />}
    </div>
  );
}

function FieldMessage({
  error,
  errorId,
  hint,
  hintId,
}: {
  error?: string;
  errorId: string;
  hint?: string;
  hintId: string;
}) {
  if (error) return <ErrorMessage id={errorId} message={error} />;
  if (hint) {
    return (
      <p id={hintId} className="mt-2 text-sm leading-relaxed text-mauve">
        {hint}
      </p>
    );
  }
  return null;
}

function ErrorMessage({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="mt-2 text-sm text-berry">
      {message}
    </p>
  );
}

function controlClass(error?: string) {
  return `ease-soft mt-2 w-full rounded-field border bg-white/70 px-4 py-3.5 text-plum shadow-[0_1px_8px_rgba(50,34,48,0.04)] outline-none transition duration-300 placeholder:text-mauve/50 focus:bg-white ${
    error
      ? "border-berry/70"
      : "border-plum/10 hover:border-plum/20 focus:border-gold"
  }`;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="ease-soft w-full rounded-full bg-berry px-7 py-4 text-base font-medium text-ivory shadow-[0_4px_24px_rgba(162,89,107,0.35)] transition duration-300 hover:scale-[1.01] hover:bg-berry-deep active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save your profile"}
    </button>
  );
}
