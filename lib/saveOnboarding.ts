import { supabase } from "@/lib/supabase";

export type OnboardingPrompt = {
  prompt: string;
  answer: string;
};

export type SaveOnboardingInput = {
  name: string;
  dob: string;
  age: number;

  gender: string;
  orientation: string;

  interestedIn: string;
  relationshipGoal: string;

  neighborhood: string;
  distanceKm: number;

  bio: string;

  interests: string[];

  prompts: OnboardingPrompt[];

  photos: File[];
};

const PHOTO_BUCKET =
  "profile-photos";


function canonicalInterestedIn(
  value: string,
): string[] {
  switch (value.trim().toLowerCase()) {
    case "women":
      return ["Women"];

    case "men":
      return ["Men"];

    case "nonbinary":
    case "non-binary":
      return ["Nonbinary"];

    case "everyone":
    default:
      return [
        "Women",
        "Men",
        "Nonbinary",
      ];
  }
}

export async function saveOnboardingProfile(
  input: SaveOnboardingInput,
) {
  // =========================================================================
  // CONFIRM USER
  // =========================================================================

  const {
    data: {
      user,
    },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    throw new Error(
      "Your login session could not be verified. Please sign in again.",
    );
  }

  const userId =
    user.id;

  // =========================================================================
  // VALIDATE
  // =========================================================================

  if (
    input.name.trim().length <
    2
  ) {
    throw new Error(
      "Please enter a valid name.",
    );
  }

  if (
    input.age < 18
  ) {
    throw new Error(
      "You must be at least 18 to use UmeLike.",
    );
  }

  if (
    input.photos.length <
    1
  ) {
    throw new Error(
      "Please add at least one profile photo.",
    );
  }

  if (
    input.photos.length >
    6
  ) {
    throw new Error(
      "You can upload up to six profile photos.",
    );
  }

  // =========================================================================
  // PREPARE DATA
  // =========================================================================

  const cleanName =
    input.name.trim();

  const cleanNeighborhood =
    input.neighborhood.trim();

  const cleanBio =
    input.bio.trim();

  const cleanPrompts =
    input.prompts.map(
      (item) => ({
        prompt:
          item.prompt.trim(),

        answer:
          item.answer.trim(),
      }),
    );

  const firstPrompt =
    cleanPrompts[0] ??
    null;

  // =========================================================================
  // PROFILE
  //
  // onboarding_complete remains FALSE until absolutely everything succeeds.
  // =========================================================================

  const {
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .upsert(
        {
          id:
            userId,

          name:
            cleanName,

          age:
            input.age,

          gender:
            input.gender,

          orientation:
            input.orientation,

          looking:
            input.interestedIn,

          goal:
            input.relationshipGoal,

          bio:
            cleanBio,

          neighborhood:
            cleanNeighborhood,

          pref_interested:
            input.interestedIn,

          // P5D6/P7 canonical multi-select preference used by the app.
          // Keep pref_interested above for legacy compatibility.
          pref_interested_in:
            canonicalInterestedIn(
              input.interestedIn,
            ),

          pref_neighborhood:
            cleanNeighborhood,

          pref_distance_km:
            input.distanceKm,

          interests:
            input.interests,

          values_view:
            input.interests.join(
              " · ",
            ),

          chip_text:
            input.interests[0] ??
            null,

          prompts:
            cleanPrompts,

          prompt_label:
            firstPrompt
              ? "Profile prompt"
              : null,

          prompt_title:
            firstPrompt?.prompt ??
            null,

          prompt_body:
            firstPrompt?.answer ??
            null,

          paused:
            false,

          onboarding_complete:
            false,
        },
        {
          onConflict:
            "id",
        },
      );

  if (profileError) {
    console.error(
      "Profile save error:",
      profileError,
    );

    throw new Error(
      "We couldn't save your profile details. Please try again.",
    );
  }

  // =========================================================================
  // PRIVATE DATE OF BIRTH
  // =========================================================================

  const {
    error: privateError,
  } =
    await supabase
      .from(
        "profile_private",
      )
      .upsert(
        {
          user_id:
            userId,

          date_of_birth:
            input.dob,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "user_id",
        },
      );

  if (privateError) {
    console.error(
      "Private profile error:",
      privateError,
    );

    throw new Error(
      "We couldn't save your birthday. Please try again.",
    );
  }

  // =========================================================================
  // FIND EXISTING PHOTO RECORDS
  // =========================================================================

  const {
    data:
      existingPhotos,
    error:
      existingPhotosError,
  } =
    await supabase
      .from(
        "profile_photos",
      )
      .select(
        "storage_path",
      )
      .eq(
        "user_id",
        userId,
      );

  if (
    existingPhotosError
  ) {
    console.error(
      "Existing photo lookup error:",
      existingPhotosError,
    );

    throw new Error(
      "We couldn't prepare your photos. Please try again.",
    );
  }

  // =========================================================================
  // REMOVE OLD FILES
  // =========================================================================

  const oldPaths =
    new Set<string>();

  for (
    const row of
    existingPhotos ?? []
  ) {
    if (
      row.storage_path
    ) {
      oldPaths.add(
        row.storage_path,
      );
    }
  }

  /*
   * Also clean deterministic photo paths from a previous failed attempt.
   * They may exist in Storage even if their database rows were never inserted.
   */
  for (
    let index = 0;
    index < 6;
    index += 1
  ) {
    oldPaths.add(
      `${userId}/photo${index}.jpg`,
    );
  }

  if (
    oldPaths.size > 0
  ) {
    const {
      error:
        storageRemoveError,
    } =
      await supabase.storage
        .from(
          PHOTO_BUCKET,
        )
        .remove(
          Array.from(
            oldPaths,
          ),
        );

    if (
      storageRemoveError
    ) {
      console.error(
        "Storage cleanup error:",
        storageRemoveError,
      );

      throw new Error(
        "We couldn't prepare your photo uploads. Please try again.",
      );
    }
  }

  // =========================================================================
  // REMOVE OLD PHOTO DATABASE ROWS
  // =========================================================================

  const {
    error:
      deleteRowsError,
  } =
    await supabase
      .from(
        "profile_photos",
      )
      .delete()
      .eq(
        "user_id",
        userId,
      );

  if (
    deleteRowsError
  ) {
    console.error(
      "Photo row cleanup error:",
      deleteRowsError,
    );

    throw new Error(
      "We couldn't update your profile photos. Please try again.",
    );
  }

  // =========================================================================
  // UPLOAD NEW PHOTOS
  // =========================================================================

  const photoRows: {
    user_id: string;
    storage_path: string;
    position: number;
  }[] = [];

  for (
    let index = 0;
    index <
    input.photos.length;
    index += 1
  ) {
    const file =
      input.photos[index];

    const jpeg =
      await compressImageToJpeg(
        file,
      );

    const storagePath =
      `${userId}/photo${index}.jpg`;

    const {
      error:
        uploadError,
    } =
      await supabase.storage
        .from(
          PHOTO_BUCKET,
        )
        .upload(
          storagePath,
          jpeg,
          {
            contentType:
              "image/jpeg",

            cacheControl:
              "3600",

            upsert:
              true,
          },
        );

    if (
      uploadError
    ) {
      console.error(
        `Photo ${index} upload error:`,
        uploadError,
      );

      throw new Error(
        `Photo ${index + 1} could not be uploaded. Please try again.`,
      );
    }

    photoRows.push({
      user_id:
        userId,

      storage_path:
        storagePath,

      position:
        index,
    });
  }

  // =========================================================================
  // SAVE PHOTO METADATA
  // =========================================================================

  const {
    error:
      photoRowsError,
  } =
    await supabase
      .from(
        "profile_photos",
      )
      .insert(
        photoRows,
      );

  if (
    photoRowsError
  ) {
    console.error(
      "Photo metadata error:",
      photoRowsError,
    );

    throw new Error(
      "Your photos uploaded, but we couldn't finish your profile. Please try again.",
    );
  }

  // =========================================================================
  // COMPLETE ONBOARDING
  //
  // This is deliberately LAST.
  // =========================================================================

  const {
    error:
      completeError,
  } =
    await supabase
      .from("profiles")
      .update({
        onboarding_complete:
          true,
      })
      .eq(
        "id",
        userId,
      );

  if (
    completeError
  ) {
    console.error(
      "Completion error:",
      completeError,
    );

    throw new Error(
      "Your profile was saved, but we couldn't finish onboarding. Please try again.",
    );
  }

  return {
    userId,
  };
}

// =============================================================================
// IMAGE COMPRESSION
// =============================================================================

async function compressImageToJpeg(
  file: File,
): Promise<Blob> {
  if (
    !file.type.startsWith(
      "image/",
    )
  ) {
    throw new Error(
      "One of the selected files is not an image.",
    );
  }

  let bitmap:
    ImageBitmap;

  try {
    bitmap =
      await createImageBitmap(
        file,
      );
  } catch (
    error
  ) {
    console.error(
      "Image decode error:",
      error,
    );

    throw new Error(
      `We couldn't read ${file.name}. Try using a JPG, PNG, or WebP image.`,
    );
  }

  const maxDimension =
    1600;

  const largestSide =
    Math.max(
      bitmap.width,
      bitmap.height,
    );

  const scale =
    largestSide >
    maxDimension
      ? maxDimension /
        largestSide
      : 1;

  const width =
    Math.max(
      1,
      Math.round(
        bitmap.width *
          scale,
      ),
    );

  const height =
    Math.max(
      1,
      Math.round(
        bitmap.height *
          scale,
      ),
    );

  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width =
    width;

  canvas.height =
    height;

  const context =
    canvas.getContext(
      "2d",
    );

  if (!context) {
    bitmap.close();

    throw new Error(
      "Your browser could not prepare the image.",
    );
  }

  /*
   * JPEG does not support transparency.
   */
  context.fillStyle =
    "#ffffff";

  context.fillRect(
    0,
    0,
    width,
    height,
  );

  context.drawImage(
    bitmap,
    0,
    0,
    width,
    height,
  );

  bitmap.close();

  const blob =
    await new Promise<
      Blob | null
    >((resolve) => {
      canvas.toBlob(
        resolve,
        "image/jpeg",
        0.86,
      );
    });

  if (!blob) {
    throw new Error(
      `We couldn't prepare ${file.name} for upload.`,
    );
  }

  return blob;
}