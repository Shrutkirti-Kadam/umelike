-- Store the chosen prompt text alongside its answer. The legacy prompt
-- columns remain temporarily so profiles created by older deployments can
-- be migrated without losing what people wrote.
ALTER TABLE "Profile"
ADD COLUMN "promptQuestions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "promptAnswers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Profile"
SET
  "promptQuestions" = ARRAY_REMOVE(ARRAY[
    CASE WHEN NULLIF(BTRIM("prompt1"), '') IS NOT NULL THEN 'My ideal Sunday looks like…' END,
    CASE WHEN NULLIF(BTRIM("prompt2"), '') IS NOT NULL THEN 'A green flag I really appreciate is…' END,
    CASE WHEN NULLIF(BTRIM("prompt3"), '') IS NOT NULL THEN 'One small thing that always makes my day better is…' END
  ], NULL),
  "promptAnswers" = ARRAY_REMOVE(ARRAY[
    NULLIF(BTRIM("prompt1"), ''),
    NULLIF(BTRIM("prompt2"), ''),
    NULLIF(BTRIM("prompt3"), '')
  ], NULL)
WHERE
  NULLIF(BTRIM("prompt1"), '') IS NOT NULL OR
  NULLIF(BTRIM("prompt2"), '') IS NOT NULL OR
  NULLIF(BTRIM("prompt3"), '') IS NOT NULL;
