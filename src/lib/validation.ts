import { z } from "zod";
import {
  GENDER_OPTIONS,
  INTERESTED_IN_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/lib/profile-options";

const genderValues = GENDER_OPTIONS.map((option) => option.value);
const interestedInValues = INTERESTED_IN_OPTIONS.map((option) => option.value);
const relationshipValues = RELATIONSHIP_OPTIONS.map((option) => option.value);
const MAX_SAVED_PHOTO_LENGTH = 1_250_000;

const profilePhotoSchema = z
  .string()
  .max(MAX_SAVED_PHOTO_LENGTH, "That photo is too large. Choose a smaller image.")
  .refine(
    (value) => {
      if (
        value.startsWith("data:image/jpeg;base64,") ||
        value.startsWith("data:image/png;base64,") ||
        value.startsWith("data:image/webp;base64,")
      ) {
        return true;
      }

      // Existing profiles may still contain HTTPS photo links from the
      // URL-based uploader that preceded direct uploads.
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Choose a valid JPG, PNG, or WebP photo." }
  );

function isAtLeast18(date: Date) {
  const today = new Date();
  const cutoff = new Date(
    Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate())
  );
  return date <= cutoff;
}

/**
 * Onboarding form rules.
 * Phone: digits with optional leading +, 7–15 digits after stripping
 * spaces, dashes, dots and parentheses (loose E.164).
 */
export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your name — at least 2 characters.")
    .max(80, "That name looks too long (80 characters max)."),

  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s().\-]/g, ""))
    .pipe(
      z
        .string()
        .regex(
          /^\+?\d{7,15}$/,
          "Enter a phone number with 7–15 digits. A country code like +91 is fine."
        )
    ),

  birthDate: z
    .string()
    .trim()
    .min(1, "Enter your date of birth.")
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), {
      message: "Enter a valid date of birth.",
    })
    .transform((value) => new Date(`${value}T00:00:00.000Z`))
    .refine((date) => date >= new Date("1900-01-01T00:00:00.000Z"), {
      message: "Enter a valid date of birth.",
    })
    .refine(isAtLeast18, {
      message: "You must be at least 18 to use umelike.",
    }),

  gender: z
    .string()
    .refine((value) => genderValues.includes(value as (typeof genderValues)[number]), {
      message: "Choose how you describe your gender.",
    }),

  pronouns: z
    .string()
    .trim()
    .max(30, "Keep pronouns under 30 characters.")
    .transform((value) => value || null),

  interestedIn: z
    .array(z.string())
    .min(1, "Choose at least one group you'd like to meet.")
    .refine(
      (values) =>
        values.every((value) =>
          interestedInValues.includes(value as (typeof interestedInValues)[number])
        ),
      { message: "Choose a valid preference." }
    ),

  relationshipIntent: z.string().refine(
    (value) =>
      relationshipValues.includes(value as (typeof relationshipValues)[number]),
    { message: "Choose what you're looking for." }
  ),

  bio: z
    .string()
    .trim()
    .min(20, "Share a little more — at least 20 characters.")
    .max(500, "Keep your bio under 500 characters."),

  interests: z
    .string()
    .transform((value) =>
      Array.from(
        new Set(
          value
            .split(",")
            .map((interest) => interest.trim())
            .filter(Boolean)
        )
      )
    )
    .refine((values) => values.length >= 3, {
      message: "Add at least 3 interests, separated by commas.",
    })
    .refine((values) => values.length <= 10, {
      message: "Choose up to 10 interests.",
    })
    .refine((values) => values.every((value) => value.length <= 30), {
      message: "Keep each interest under 30 characters.",
    }),

  prompt1: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters for this prompt.")
    .max(200, "Keep this answer under 200 characters."),

  prompt2: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters for this prompt.")
    .max(200, "Keep this answer under 200 characters."),

  prompt3: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters for this prompt.")
    .max(200, "Keep this answer under 200 characters."),

  photos: z
    .array(profilePhotoSchema)
    .max(5, "Add up to 5 photos."),

  streetAddress: z
    .string()
    .trim()
    .min(10, "Enter your complete residential address.")
    .max(180, "Keep your address under 180 characters."),

  city: z
    .string()
    .trim()
    .min(2, "Enter your sub-city or locality.")
    .max(60, "That locality name looks too long."),

  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9\s\-]{1,9}$/, "Enter a valid postal code."),

  maxDistanceKm: z.coerce
    .number()
    .int()
    .min(5, "Choose a distance of at least 5 km.")
    .max(500, "Choose a distance up to 500 km."),

});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileErrors = Partial<Record<keyof ProfileInput, string>>;
