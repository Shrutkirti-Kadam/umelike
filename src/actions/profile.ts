"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema, type ProfileErrors } from "@/lib/validation";

export type SaveProfileState = { errors: ProfileErrors };

/**
 * Validates the onboarding form and upserts the profile.
 * On success, redirects to /profile?saved=1 — the confirmation keeps the
 * same verb as the button ("Save your profile" → "Profile saved").
 */
export async function saveProfile(
  _prev: SaveProfileState,
  formData: FormData
): Promise<SaveProfileState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    birthDate: formData.get("birthDate"),
    gender: formData.get("gender"),
    pronouns: formData.get("pronouns"),
    interestedIn: formData.getAll("interestedIn"),
    relationshipIntent: formData.get("relationshipIntent"),
    bio: formData.get("bio"),
    interests: formData.get("interests"),
    prompt1: formData.get("prompt1"),
    prompt2: formData.get("prompt2"),
    prompt3: formData.get("prompt3"),
    photos: formData
      .getAll("photos")
      .filter((value): value is string => typeof value === "string" && !!value.trim()),
    city: formData.get("city"),
    postalCode: formData.get("postalCode"),
    maxDistanceKm: formData.get("maxDistanceKm"),
  });

  if (!parsed.success) {
    const errors: ProfileErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ProfileErrors;
      if (!errors[key]) errors[key] = issue.message;
    }
    return { errors };
  }

  const data = parsed.data;

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  redirect("/profile?saved=1");
}
