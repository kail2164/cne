import type { FoodDef, GameState } from "./types.js";

/** 1910-plausible food placeholders. */
export const FOODS: FoodDef[] = [
  {
    id: "hard-biscuit",
    name: "Hard Biscuit",
    nourishment: 8,
    happiness: -4,
    productionCost: 0.4,
    recipeId: null,
  },
  {
    id: "army-stew",
    name: "Army Stew",
    nourishment: 18,
    happiness: 2,
    productionCost: 1.2,
    recipeId: null,
  },
  {
    id: "tinned-meat",
    name: "Tinned Meat",
    nourishment: 14,
    happiness: -1,
    productionCost: 1.0,
    recipeId: null,
  },
  {
    id: "field-kitchen-roast",
    name: "Field Kitchen Roast",
    nourishment: 22,
    happiness: 6,
    productionCost: 2.5,
    recipeId: "recipe-field-kitchen",
  },
];

export function getFood(id: string): FoodDef | undefined {
  return FOODS.find((f) => f.id === id);
}

export function isFoodUnlocked(state: GameState, foodId: string): boolean {
  const food = getFood(foodId);
  if (!food) return false;
  if (food.recipeId == null) return true;
  return state.researchUnlocked.includes(food.recipeId);
}
