import { prisma } from "@/lib/prisma";

export type ItemSpec = {
  food: string;
  gramsMale: number;
  gramsFemale: number;
  notes?: string;
};

export type MealSpec = {
  mealType: string;
  title: string;
  description?: string;
  variant?: number;
  frequency?: string;
  notes?: string;
  items: ItemSpec[];
};

export const WESTERN_PLAN: MealSpec[] = [
  {
    mealType: "breakfast",
    title: "Power Scramble Bowl",
    frequency: "daily",
    items: [
      { food: "Eggs, whole", gramsMale: 200, gramsFemale: 100, notes: "4 (M) / 2 (F) eggs" },
      { food: "Spinach, raw", gramsMale: 60, gramsFemale: 60, notes: "2 cups sautéed" },
      { food: "Mushrooms, white", gramsMale: 35, gramsFemale: 35, notes: "½ cup" },
      { food: "Red bell pepper", gramsMale: 75, gramsFemale: 75, notes: "½ pepper" },
      { food: "Avocado", gramsMale: 75, gramsFemale: 75, notes: "½ avocado" },
      { food: "Whole wheat bread", gramsMale: 60, gramsFemale: 30, notes: "2 slices (M) / 1 (F)" },
      { food: "Greek yogurt, plain 2%", gramsMale: 245, gramsFemale: 245, notes: "1 cup side" },
    ],
  },
  {
    mealType: "midMorningSnack",
    title: "Almonds + Apple + Cottage Cheese",
    frequency: "daily",
    items: [
      { food: "Almonds", gramsMale: 28, gramsFemale: 28 },
      { food: "Apple, with skin", gramsMale: 182, gramsFemale: 182 },
      { food: "Cottage cheese, low-fat", gramsMale: 226, gramsFemale: 113, notes: "1 cup (M) / ½ cup (F)" },
    ],
  },
  {
    mealType: "lunch",
    title: "Salmon Power Bowl",
    variant: 1,
    frequency: "3x/week",
    items: [
      { food: "Salmon, wild", gramsMale: 227, gramsFemale: 142, notes: "8 oz (M) / 5 oz (F)" },
      { food: "Brown rice, cooked", gramsMale: 195, gramsFemale: 195 },
      { food: "Kale, raw", gramsMale: 134, gramsFemale: 134, notes: "2 cups massaged + lemon" },
      { food: "Pumpkin seeds", gramsMale: 28, gramsFemale: 28 },
      { food: "Sweet potato, baked", gramsMale: 200, gramsFemale: 200 },
    ],
  },
  {
    mealType: "lunch",
    title: "Grilled Chicken + Lentils",
    variant: 2,
    frequency: "1x/week",
    items: [
      { food: "Chicken breast, cooked", gramsMale: 227, gramsFemale: 142 },
      { food: "Lentils, cooked", gramsMale: 198, gramsFemale: 198 },
      { food: "Broccoli, raw", gramsMale: 182, gramsFemale: 182, notes: "2 cups steamed" },
      { food: "Tahini", gramsMale: 15, gramsFemale: 15, notes: "drizzle" },
    ],
  },
  {
    mealType: "lunch",
    title: "Sardine + White Bean Salad",
    variant: 3,
    frequency: "1x/week",
    items: [
      { food: "Sardines, canned in olive oil", gramsMale: 184, gramsFemale: 92, notes: "2 cans (M) / 1 (F)" },
      { food: "White beans, cooked", gramsMale: 179, gramsFemale: 179 },
      { food: "Whole wheat bread", gramsMale: 60, gramsFemale: 30 },
      { food: "Olive oil", gramsMale: 14, gramsFemale: 14 },
    ],
  },
  {
    mealType: "preWorkout",
    title: "Whey Shake + Banana",
    frequency: "daily",
    items: [
      { food: "Whey protein powder", gramsMale: 48, gramsFemale: 32, notes: "1.5 scoops (M) / 1 (F)" },
      { food: "Milk, whole", gramsMale: 244, gramsFemale: 244, notes: "1 cup" },
      { food: "Banana", gramsMale: 118, gramsFemale: 118 },
    ],
  },
  {
    mealType: "dinner",
    title: "Grass-Fed Beef + Broccoli Stir-Fry",
    variant: 1,
    frequency: "2x/week",
    items: [
      { food: "Sirloin, lean", gramsMale: 227, gramsFemale: 142 },
      { food: "Broccoli, raw", gramsMale: 182, gramsFemale: 182 },
      { food: "Red bell pepper", gramsMale: 150, gramsFemale: 150 },
      { food: "Quinoa, cooked", gramsMale: 185, gramsFemale: 185 },
      { food: "Olive oil", gramsMale: 14, gramsFemale: 14 },
    ],
  },
  {
    mealType: "dinner",
    title: "Oysters + Spinach + Sweet Potato (liver replacement)",
    description: "Pan-seared oysters over wilted spinach with mashed sweet potato — nutrient-density anchor replacing weekly liver",
    variant: 2,
    frequency: "1x/week",
    items: [
      { food: "Oysters, raw", gramsMale: 170, gramsFemale: 113, notes: "6 oz (M) / 4 oz (F) pan-seared" },
      { food: "Spinach, raw", gramsMale: 90, gramsFemale: 90, notes: "3 cups wilted" },
      { food: "Sweet potato, baked", gramsMale: 200, gramsFemale: 200, notes: "mashed" },
      { food: "Eggs, whole", gramsMale: 50, gramsFemale: 50, notes: "runny yolk on top" },
      { food: "Olive oil", gramsMale: 14, gramsFemale: 14 },
    ],
  },
  {
    mealType: "dinner",
    title: "Chicken Thigh + Lentil Stew",
    variant: 3,
    frequency: "2x/week",
    items: [
      { food: "Chicken thigh, cooked skinless", gramsMale: 227, gramsFemale: 142 },
      { food: "Lentils, cooked", gramsMale: 198, gramsFemale: 198 },
      { food: "Collard greens, cooked", gramsMale: 190, gramsFemale: 190 },
    ],
  },
  {
    mealType: "dinner",
    title: "Mackerel + Whole Grain Pasta",
    variant: 4,
    frequency: "1x/week",
    items: [
      { food: "Mackerel, Atlantic", gramsMale: 170, gramsFemale: 113 },
      { food: "Whole wheat pasta, cooked", gramsMale: 140, gramsFemale: 140 },
      { food: "Broccoli, raw", gramsMale: 91, gramsFemale: 91 },
      { food: "Olive oil", gramsMale: 14, gramsFemale: 14 },
    ],
  },
  {
    mealType: "eveningSnack",
    title: "Cottage Cheese + Berries + Flax",
    frequency: "daily",
    items: [
      { food: "Cottage cheese, low-fat", gramsMale: 226, gramsFemale: 226 },
      { food: "Mixed berries", gramsMale: 150, gramsFemale: 150 },
      { food: "Ground flax", gramsMale: 7, gramsFemale: 7 },
      { food: "Brazil nuts", gramsMale: 15, gramsFemale: 15, notes: "2–3 nuts for selenium" },
    ],
  },
];

export const ASIAN_PLAN: MealSpec[] = [
  {
    mealType: "breakfast",
    title: "Japanese Power Plate",
    frequency: "daily",
    items: [
      { food: "Eggs, whole", gramsMale: 200, gramsFemale: 100, notes: "4 (M) / 2 (F) onsen-style" },
      { food: "Natto", gramsMale: 50, gramsFemale: 50, notes: "or firm tofu 4oz" },
      { food: "Spinach, raw", gramsMale: 45, gramsFemale: 45, notes: "gomae with sesame" },
      { food: "Sesame seeds", gramsMale: 9, gramsFemale: 9 },
      { food: "Miso paste", gramsMale: 17, gramsFemale: 17, notes: "in soup with wakame + shiitake" },
      { food: "Wakame, dried", gramsMale: 5, gramsFemale: 5 },
      { food: "Brown rice, cooked", gramsMale: 195, gramsFemale: 98, notes: "1 cup (M) / ½ (F)" },
      { food: "Nori, sheet", gramsMale: 5.2, gramsFemale: 5.2, notes: "2 sheets" },
    ],
  },
  {
    mealType: "midMorningSnack",
    title: "Edamame + Almonds + Asian Pear",
    frequency: "daily",
    items: [
      { food: "Edamame, shelled cooked", gramsMale: 233, gramsFemale: 155, notes: "1.5 cups (M) / 1 (F)" },
      { food: "Almonds", gramsMale: 28, gramsFemale: 28 },
      { food: "Asian pear", gramsMale: 275, gramsFemale: 275 },
    ],
  },
  {
    mealType: "lunch",
    title: "Korean Salmon Bibimbap",
    variant: 1,
    frequency: "3x/week",
    items: [
      { food: "Salmon, wild", gramsMale: 227, gramsFemale: 142, notes: "gochujang-glazed" },
      { food: "Brown rice, cooked", gramsMale: 195, gramsFemale: 195 },
      { food: "Kimchi", gramsMale: 75, gramsFemale: 75, notes: "½ cup" },
      { food: "Kale, raw", gramsMale: 134, gramsFemale: 134, notes: "or gai lan" },
      { food: "Pumpkin seeds", gramsMale: 28, gramsFemale: 28 },
      { food: "Carrots, raw", gramsMale: 64, gramsFemale: 64, notes: "shredded" },
      { food: "Bean sprouts", gramsMale: 52, gramsFemale: 52 },
      { food: "Sesame oil", gramsMale: 14, gramsFemale: 14 },
      { food: "Gochujang", gramsMale: 17, gramsFemale: 17 },
    ],
  },
  {
    mealType: "lunch",
    title: "Vietnamese Beef Pho",
    variant: 2,
    frequency: "1x/week",
    items: [
      { food: "Sirloin, lean", gramsMale: 227, gramsFemale: 142 },
      { food: "Bok choy, cooked", gramsMale: 170, gramsFemale: 170 },
      { food: "Brown rice, cooked", gramsMale: 195, gramsFemale: 195, notes: "or rice noodles" },
    ],
  },
  {
    mealType: "lunch",
    title: "Thai Grilled Chicken Larb",
    variant: 3,
    frequency: "1x/week",
    items: [
      { food: "Chicken breast, cooked", gramsMale: 227, gramsFemale: 142 },
      { food: "Cabbage, raw", gramsMale: 178, gramsFemale: 178 },
      { food: "Brown rice, cooked", gramsMale: 195, gramsFemale: 195 },
      { food: "Lemon juice", gramsMale: 15, gramsFemale: 15 },
    ],
  },
  {
    mealType: "preWorkout",
    title: "Whey Shake + Banana (soy milk)",
    frequency: "daily",
    items: [
      { food: "Whey protein powder", gramsMale: 48, gramsFemale: 32 },
      { food: "Fortified soy milk", gramsMale: 243, gramsFemale: 243 },
      { food: "Banana", gramsMale: 118, gramsFemale: 118 },
    ],
  },
  {
    mealType: "dinner",
    title: "Chinese Beef + Gai Lan Stir-Fry",
    variant: 1,
    frequency: "2x/week",
    items: [
      { food: "Flank steak", gramsMale: 227, gramsFemale: 142 },
      { food: "Gai lan (Chinese broccoli)", gramsMale: 176, gramsFemale: 176 },
      { food: "Shiitake mushrooms", gramsMale: 70, gramsFemale: 70 },
      { food: "Quinoa, cooked", gramsMale: 185, gramsFemale: 185 },
      { food: "Sesame oil", gramsMale: 14, gramsFemale: 14 },
      { food: "Soy sauce", gramsMale: 16, gramsFemale: 16 },
    ],
  },
  {
    mealType: "dinner",
    title: "Korean Oyster + Seaweed Soup (liver replacement)",
    description: "굴국 — oyster and wakame soup over rice with kimchi. Replaces weekly liver for zinc/copper/B12/selenium.",
    variant: 2,
    frequency: "1x/week",
    items: [
      { food: "Oysters, raw", gramsMale: 170, gramsFemale: 113, notes: "6 oz (M) / 4 oz (F)" },
      { food: "Wakame, dried", gramsMale: 10, gramsFemale: 10 },
      { food: "Brown rice, cooked", gramsMale: 195, gramsFemale: 195 },
      { food: "Kimchi", gramsMale: 75, gramsFemale: 75 },
      { food: "Sesame oil", gramsMale: 14, gramsFemale: 14 },
    ],
  },
  {
    mealType: "dinner",
    title: "Japanese Chicken Donburi",
    variant: 3,
    frequency: "2x/week",
    items: [
      { food: "Chicken thigh, cooked skinless", gramsMale: 227, gramsFemale: 142 },
      { food: "Brown rice, cooked", gramsMale: 195, gramsFemale: 195 },
      { food: "Miso paste", gramsMale: 17, gramsFemale: 17, notes: "lentil-miso stew side" },
      { food: "Lentils, cooked", gramsMale: 148, gramsFemale: 148 },
      { food: "Komatsuna, cooked", gramsMale: 130, gramsFemale: 130, notes: "or collards" },
    ],
  },
  {
    mealType: "dinner",
    title: "Mackerel Shioyaki + Soba",
    variant: 4,
    frequency: "1x/week",
    items: [
      { food: "Mackerel, Atlantic", gramsMale: 170, gramsFemale: 113 },
      { food: "Buckwheat soba, cooked", gramsMale: 114, gramsFemale: 114 },
      { food: "Hijiki, dried", gramsMale: 10, gramsFemale: 10 },
      { food: "Carrots, raw", gramsMale: 64, gramsFemale: 64 },
    ],
  },
  {
    mealType: "eveningSnack",
    title: "Silken Tofu + Brazil Nuts + Berries",
    frequency: "daily",
    items: [
      { food: "Tofu, silken", gramsMale: 240, gramsFemale: 180, notes: "with scallion + soy + sesame" },
      { food: "Soy sauce", gramsMale: 8, gramsFemale: 8 },
      { food: "Sesame oil", gramsMale: 7, gramsFemale: 7 },
      { food: "Brazil nuts", gramsMale: 15, gramsFemale: 15, notes: "2–3 for selenium" },
      { food: "Mixed berries", gramsMale: 75, gramsFemale: 75 },
    ],
  },
];

export async function buildPlan(
  profileId: string,
  name: string,
  isActive: boolean,
  meals: MealSpec[],
  foodMap: Map<string, string>
) {
  const plan = await prisma.mealPlan.create({
    data: { profileId, name, isActive },
  });
  let order = 0;
  for (const m of meals) {
    const mealRow = await prisma.mealPlanMeal.create({
      data: {
        mealPlanId: plan.id,
        mealType: m.mealType,
        title: m.title,
        description: m.description,
        variant: m.variant ?? 1,
        frequency: m.frequency,
        notes: m.notes,
        order: order++,
      },
    });
    let itemOrder = 0;
    for (const it of m.items) {
      const foodId = foodMap.get(it.food);
      if (!foodId) continue;
      await prisma.mealPlanItem.create({
        data: {
          mealPlanMealId: mealRow.id,
          foodId,
          gramsMale: it.gramsMale,
          gramsFemale: it.gramsFemale,
          notes: it.notes,
          order: itemOrder++,
        },
      });
    }
  }
  return plan;
}

export async function seedPlansForProfile(profileId: string, makeWesternActive = true) {
  const foods = await prisma.food.findMany();
  const foodMap = new Map(foods.map((f) => [f.name, f.id]));
  await prisma.mealPlan.deleteMany({ where: { profileId } });
  await buildPlan(profileId, "Western Power", makeWesternActive, WESTERN_PLAN, foodMap);
  await buildPlan(profileId, "Asian-Based", false, ASIAN_PLAN, foodMap);
}
