"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveProfile, type SaveProfileState } from "@/actions/profile";
import {
  GENDER_OPTIONS,
  INTERESTED_IN_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/lib/profile-options";

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
  prompt1: string;
  prompt2: string;
  prompt3: string;
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

        <TextareaField
          label="A perfect day looks like…"
          name="prompt1"
          defaultValue={defaults.prompt1}
          error={e.prompt1}
          maxLength={200}
        />
        <TextareaField
          label="Something I value deeply is…"
          name="prompt2"
          defaultValue={defaults.prompt2}
          error={e.prompt2}
          maxLength={200}
        />
        <TextareaField
          label="The quickest way to make me smile is…"
          name="prompt3"
          defaultValue={defaults.prompt3}
          error={e.prompt3}
          maxLength={200}
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
  return (
    <fieldset className="space-y-6 rounded-soft border border-plum/5 bg-white/35 p-5 sm:p-6">
      <legend className="px-2 font-display text-xl font-medium text-plum">
        {title}
      </legend>
      <p className="-mt-2 text-sm leading-relaxed text-mauve">{description}</p>
      {children}
    </fieldset>
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
