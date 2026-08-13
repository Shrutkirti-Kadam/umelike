export const GENDER_OPTIONS = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "non_binary", label: "Non-binary" },
  { value: "genderqueer", label: "Genderqueer" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const INTERESTED_IN_OPTIONS = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "non_binary_people", label: "Non-binary people" },
] as const;

export const RELATIONSHIP_OPTIONS = [
  { value: "life_partner", label: "A life partner" },
  { value: "long_term", label: "A long-term relationship" },
  { value: "serious_open", label: "Something serious, open to the pace" },
  { value: "short_term", label: "Short-term dating" },
  { value: "friendship", label: "Friendship" },
  { value: "figuring_it_out", label: "Still figuring it out" },
] as const;
