export const MEAL_TYPES = [
  "breakfast",
  "midMorningSnack",
  "lunch",
  "preWorkout",
  "postWorkout",
  "dinner",
  "eveningSnack",
] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  midMorningSnack: "Mid-Morning Snack",
  lunch: "Lunch",
  preWorkout: "Pre-Workout",
  postWorkout: "Post-Workout",
  dinner: "Dinner",
  eveningSnack: "Evening Snack",
};

export const MEAL_TYPE_ORDER: Record<string, number> = {
  breakfast: 1,
  midMorningSnack: 2,
  lunch: 3,
  preWorkout: 4,
  postWorkout: 5,
  dinner: 6,
  eveningSnack: 7,
};

export type ComplianceTag = {
  tag: string;
  label: string;
  target: number; // days per week
  appliesTo: "both" | "western" | "asian";
};

export const COMPLIANCE_TAGS: ComplianceTag[] = [
  { tag: "fattyFish", label: "Fatty fish (salmon/mackerel/sardines)", target: 3, appliesTo: "both" },
  { tag: "darkLeafyGreens", label: "Dark leafy greens", target: 7, appliesTo: "both" },
  { tag: "vitC", label: "Vit C source (pepper/broccoli/citrus/kimchi)", target: 7, appliesTo: "both" },
  { tag: "zincSource", label: "Zinc (pumpkin seeds or beef)", target: 5, appliesTo: "both" },
  { tag: "brazilNuts", label: "Brazil nuts (2–3 for selenium)", target: 7, appliesTo: "both" },
  { tag: "vitE", label: "Vit E (almonds or sunflower seeds)", target: 7, appliesTo: "both" },
  { tag: "organReplacement", label: "Oysters/clams/mussels (liver replacement)", target: 1, appliesTo: "both" },
  { tag: "fermentedK2", label: "Fermented K2 (natto/miso/kimchi)", target: 7, appliesTo: "asian" },
  { tag: "iodine", label: "Iodine (nori/wakame/hijiki)", target: 7, appliesTo: "asian" },
];

export const AVAILABLE_TAGS = [
  "fattyFish",
  "darkLeafyGreens",
  "vitC",
  "zincSource",
  "brazilNuts",
  "vitE",
  "organReplacement",
  "fermentedK2",
  "iodine",
  "probiotic",
  "chromium",
];
