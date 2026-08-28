import type { GeneratedPlan, Recipe } from '@/lib/ai/plan-schema'
import type { DayMacros } from '@/lib/profile/methodology'

/**
 * The deterministic fixture the AI client returns whenever mocking is on
 * (CLAUDE.md Rule 13 — dev-mode mocking is mandatory and opens no network
 * connection). Setting `AI_MOCK=1` in production runs the demo on this too,
 * with no Anthropic key and no spend.
 *
 * Everything here is built from the 54 baseline pantry items (SPEC.md § 5), so
 * `from_pantry` is honest and the grocery gap list has something real to diff
 * against — a fixture where every ingredient is already owned would make the
 * gap list look broken.
 */

interface Slot {
  name: string
  cuisine: string
  pantry: [string, number, string][]
  buy: [string, number, string][]
  options: string[]
  instructions: string[]
}

const BREAKFASTS: Slot[] = [
  {
    name: 'Sunday scrambled eggs with peppers',
    cuisine: 'american_comfort',
    pantry: [
      ['Eggs', 3, 'each'],
      ['Bell peppers', 1, 'each'],
      ['Butter', 1, 'tbsp'],
    ],
    buy: [],
    options: ['Hot sauce'],
    instructions: [
      'Dice the peppers and soften in butter.',
      'Add beaten eggs and scramble low and slow.',
    ],
  },
  {
    name: 'Oatmeal with cinnamon',
    cuisine: 'american_comfort',
    pantry: [
      ['Oatmeal', 1, 'cup'],
      ['Granulated sugar', 1, 'tsp'],
    ],
    buy: [
      ['Milk', 1, 'cup'],
      ['Cinnamon', 1, 'tsp'],
    ],
    options: ['Fresh berries'],
    instructions: [
      'Simmer the oats in milk for five minutes.',
      'Stir through the cinnamon and sugar.',
    ],
  },
  {
    name: 'Bacon and egg breakfast bowl',
    cuisine: 'american_comfort',
    pantry: [
      ['Bacon', 2, 'slice'],
      ['Eggs', 2, 'each'],
      ['Potatoes', 1, 'each'],
    ],
    buy: [],
    options: ['Ketchup'],
    instructions: ['Crisp the bacon, then fry diced potato in the fat.', 'Top with fried eggs.'],
  },
  {
    name: 'Cheese omelette',
    cuisine: 'italian',
    pantry: [
      ['Eggs', 3, 'each'],
      ['Sliced provolone', 1, 'slice'],
      ['Olive oil', 1, 'tbsp'],
    ],
    buy: [],
    options: ['Chives'],
    instructions: [
      'Beat the eggs with salt and pepper.',
      'Cook flat, fold the cheese inside, rest a minute.',
    ],
  },
  {
    name: 'Savoury oats with a soft egg',
    cuisine: 'asian',
    pantry: [
      ['Oatmeal', 1, 'cup'],
      ['Eggs', 1, 'each'],
      ['Soy sauce', 1, 'tsp'],
    ],
    buy: [['Scallions', 2, 'each']],
    options: ['Chilli oil'],
    instructions: [
      'Cook the oats in water until creamy.',
      'Top with a jammy egg, soy and scallion.',
    ],
  },
  {
    name: 'Toast with eggs and greens',
    cuisine: 'mediterranean',
    pantry: [
      ['Bread', 2, 'slice'],
      ['Eggs', 2, 'each'],
      ['Salad greens', 1, 'cup'],
      ['Olive oil', 1, 'tbsp'],
    ],
    buy: [],
    options: ['Lemon wedge'],
    instructions: ['Toast the bread and dress the greens in oil.', 'Add poached eggs on top.'],
  },
  {
    name: 'Breakfast burrito',
    cuisine: 'mexican',
    pantry: [
      ['Eggs', 2, 'each'],
      ['Black beans', 0.5, 'cup'],
      ['Sliced monterey jack', 1, 'slice'],
    ],
    buy: [['Flour tortillas', 1, 'each']],
    options: ['Salsa'],
    instructions: ['Scramble the eggs with the beans.', 'Roll in a warm tortilla with the cheese.'],
  },
]

const LUNCHES: Slot[] = [
  {
    name: 'Chicken and rice bowl',
    cuisine: 'asian',
    pantry: [
      ['Chicken breasts', 1, 'each'],
      ['White rice', 1, 'cup'],
      ['Broccoli', 1, 'cup'],
      ['Soy sauce', 1, 'tbsp'],
    ],
    buy: [['Sesame seeds', 1, 'tsp']],
    options: ['Sriracha'],
    instructions: ['Steam the rice and broccoli.', 'Sear the chicken, slice, and glaze with soy.'],
  },
  {
    name: 'Turkey and bean chilli',
    cuisine: 'mexican',
    pantry: [
      ['Ground turkey', 0.5, 'lb'],
      ['Red beans', 1, 'cup'],
      ['Yellow onions', 1, 'each'],
      ['Ketchup', 2, 'tbsp'],
    ],
    buy: [
      ['Chopped tomatoes', 1, 'can'],
      ['Chilli powder', 1, 'tbsp'],
    ],
    options: ['Sour cream'],
    instructions: [
      'Brown the turkey with onion.',
      'Add beans, tomatoes and spice; simmer 20 minutes.',
    ],
  },
  {
    name: 'Steak salad with ranch',
    cuisine: 'american_comfort',
    pantry: [
      ['Sirloin steaks', 0.5, 'each'],
      ['Salad greens', 2, 'cup'],
      ['Ranch dressing', 2, 'tbsp'],
    ],
    buy: [['Cherry tomatoes', 1, 'cup']],
    options: ['Croutons'],
    instructions: [
      'Sear the steak to medium rare and rest.',
      'Slice across the grain over dressed greens.',
    ],
  },
  {
    name: 'Chickpea and greens bowl',
    cuisine: 'mediterranean',
    pantry: [
      ['Garbanzo beans', 1, 'cup'],
      ['Salad greens', 2, 'cup'],
      ['Lemons', 1, 'each'],
      ['Olive oil', 2, 'tbsp'],
    ],
    buy: [['Feta', 0.25, 'cup']],
    options: ['Pita bread'],
    instructions: ['Crisp the chickpeas in oil.', 'Toss with greens, lemon and feta.'],
  },
  {
    name: 'Spaghetti with garlic and oil',
    cuisine: 'italian',
    pantry: [
      ['Spaghetti noodles', 4, 'oz'],
      ['Garlic', 3, 'each'],
      ['Olive oil', 3, 'tbsp'],
      ['Dried oregano', 1, 'tsp'],
    ],
    buy: [['Parmesan', 0.25, 'cup']],
    options: ['Chilli flakes'],
    instructions: [
      'Boil the pasta.',
      'Warm sliced garlic in oil, toss with pasta and a splash of the water.',
    ],
  },
  {
    name: 'Shrimp fried rice',
    cuisine: 'asian',
    pantry: [
      ['Shrimp', 0.5, 'lb'],
      ['White rice', 1, 'cup'],
      ['Eggs', 1, 'each'],
      ['Soy sauce', 1, 'tbsp'],
    ],
    buy: [['Frozen peas', 0.5, 'cup']],
    options: ['Lime'],
    instructions: [
      'Fry cold rice hard in a hot pan.',
      'Push aside, scramble the egg, fold in shrimp and peas.',
    ],
  },
  {
    name: 'Pork and potato hash',
    cuisine: 'american_comfort',
    pantry: [
      ['Pork loin', 0.5, 'lb'],
      ['Potatoes', 2, 'each'],
      ['Yellow onions', 1, 'each'],
    ],
    buy: [],
    options: ['Dijon mustard'],
    instructions: [
      'Cube and roast the potatoes.',
      'Sear the pork, slice, and fold through with onion.',
    ],
  },
]

const SNACKS: Slot[] = [
  {
    name: 'Hard-boiled eggs',
    cuisine: 'american_comfort',
    pantry: [
      ['Eggs', 2, 'each'],
      ['Salt', 1, 'pinch'],
    ],
    buy: [],
    options: [],
    instructions: ['Boil eight minutes, cool in cold water.'],
  },
  {
    name: 'Hummus with pepper strips',
    cuisine: 'mediterranean',
    pantry: [
      ['Garbanzo beans', 0.5, 'cup'],
      ['Bell peppers', 1, 'each'],
      ['Lemons', 0.5, 'each'],
    ],
    buy: [['Tahini', 1, 'tbsp']],
    options: [],
    instructions: ['Blend the beans with tahini and lemon.', 'Serve with sliced peppers.'],
  },
  {
    name: 'Cheese and apple',
    cuisine: 'american_comfort',
    pantry: [['Sliced provolone', 2, 'slice']],
    buy: [['Apples', 1, 'each']],
    options: [],
    instructions: ['Slice and serve.'],
  },
  {
    name: 'Toast with butter',
    cuisine: 'american_comfort',
    pantry: [
      ['Bread', 1, 'slice'],
      ['Butter', 1, 'tbsp'],
    ],
    buy: [],
    options: ['Honey'],
    instructions: ['Toast and butter while hot.'],
  },
  {
    name: 'Black bean dip',
    cuisine: 'mexican',
    pantry: [
      ['Black beans', 0.5, 'cup'],
      ['Garlic powder', 1, 'tsp'],
    ],
    buy: [['Tortilla chips', 1, 'bag']],
    options: [],
    instructions: ['Mash the beans warm with garlic powder.'],
  },
  {
    name: 'Edamame with salt',
    cuisine: 'asian',
    pantry: [['Salt', 1, 'pinch']],
    buy: [['Edamame', 1, 'cup']],
    options: [],
    instructions: ['Steam three minutes and salt heavily.'],
  },
  {
    name: 'Green beans with vinaigrette',
    cuisine: 'italian',
    pantry: [
      ['Green beans', 1, 'cup'],
      ['Red wine vinegar', 1, 'tbsp'],
      ['Olive oil', 1, 'tbsp'],
    ],
    buy: [],
    options: [],
    instructions: ['Blanch the beans and dress warm.'],
  },
]

/** Three substantively different suppers per day (SPEC.md § 8.5). */
const SUPPERS: Slot[][] = [
  [
    {
      name: 'Roast chicken with potatoes',
      cuisine: 'american_comfort',
      pantry: [
        ['Chicken breasts', 2, 'each'],
        ['Potatoes', 3, 'each'],
        ['Olive oil', 2, 'tbsp'],
        ['Garlic', 2, 'each'],
      ],
      buy: [['Fresh rosemary', 1, 'sprig']],
      options: ['Gravy'],
      instructions: ['Roast the potatoes 40 minutes.', 'Add the chicken for the last 20.'],
    },
    {
      name: 'Shrimp scampi over spaghetti',
      cuisine: 'italian',
      pantry: [
        ['Shrimp', 1, 'lb'],
        ['Spaghetti noodles', 6, 'oz'],
        ['Garlic', 3, 'each'],
        ['Butter', 2, 'tbsp'],
        ['Lemons', 1, 'each'],
      ],
      buy: [['Parsley', 1, 'bunch']],
      options: ['Crusty bread'],
      instructions: [
        'Boil the pasta.',
        'Sizzle garlic in butter, add shrimp two minutes a side, finish with lemon.',
      ],
    },
    {
      name: 'Black bean and squash tacos',
      cuisine: 'mexican',
      pantry: [
        ['Black beans', 1.5, 'cup'],
        ['Squash', 1, 'each'],
        ['Sliced monterey jack', 2, 'slice'],
      ],
      buy: [
        ['Corn tortillas', 6, 'each'],
        ['Lime', 1, 'each'],
      ],
      options: ['Salsa', 'Cilantro'],
      instructions: ['Roast the squash until caramelised.', 'Warm the beans and build the tacos.'],
    },
  ],
  [
    {
      name: 'Beef and broccoli stir fry',
      cuisine: 'asian',
      pantry: [
        ['Sirloin steaks', 1, 'each'],
        ['Broccoli', 2, 'cup'],
        ['Soy sauce', 3, 'tbsp'],
        ['White rice', 1.5, 'cup'],
      ],
      buy: [['Fresh ginger', 1, 'each']],
      options: ['Sesame oil'],
      instructions: ['Slice the beef thin and sear hot.', 'Add broccoli and soy, serve over rice.'],
    },
    {
      name: 'Turkey meatballs in tomato sauce',
      cuisine: 'italian',
      pantry: [
        ['Ground turkey', 1, 'lb'],
        ['Eggs', 1, 'each'],
        ['Dried basil', 1, 'tsp'],
        ['Spaghetti noodles', 6, 'oz'],
      ],
      buy: [['Passata', 1, 'jar']],
      options: ['Parmesan'],
      instructions: [
        'Roll and brown the meatballs.',
        'Simmer in sauce 20 minutes, serve over pasta.',
      ],
    },
    {
      name: 'Crispy tofu with green beans',
      cuisine: 'asian',
      pantry: [
        ['Tofu', 1, 'each'],
        ['Green beans', 2, 'cup'],
        ['Soy sauce', 2, 'tbsp'],
        ['White rice', 1, 'cup'],
      ],
      buy: [['Cornstarch', 2, 'tbsp']],
      options: ['Chilli crisp'],
      instructions: [
        'Press and cube the tofu, coat and fry until crisp.',
        'Blister the beans, toss everything in soy.',
      ],
    },
  ],
  [
    {
      name: 'Pork loin with roasted squash',
      cuisine: 'american_comfort',
      pantry: [
        ['Pork loin', 1, 'lb'],
        ['Squash', 1, 'each'],
        ['Olive oil', 2, 'tbsp'],
        ['Dijon mustard', 1, 'tbsp'],
      ],
      buy: [['Fresh thyme', 1, 'sprig']],
      options: ['Apple sauce'],
      instructions: [
        'Sear the loin, then roast to 63°C.',
        'Roast the squash alongside; rest before slicing.',
      ],
    },
    {
      name: 'Chicken souvlaki bowls',
      cuisine: 'mediterranean',
      pantry: [
        ['Chicken breasts', 2, 'each'],
        ['Lemons', 1, 'each'],
        ['Salad greens', 2, 'cup'],
        ['Dried oregano', 1, 'tbsp'],
      ],
      buy: [
        ['Greek yoghurt', 0.5, 'cup'],
        ['Cucumber', 1, 'each'],
      ],
      options: ['Pita bread'],
      instructions: [
        'Marinate the chicken in lemon and oregano.',
        'Grill, slice, and build over greens with tzatziki.',
      ],
    },
    {
      name: 'Bratwurst with peppers and onions',
      cuisine: 'american_comfort',
      pantry: [
        ['Bratwurst', 2, 'each'],
        ['Bell peppers', 2, 'each'],
        ['Yellow onions', 1, 'each'],
      ],
      buy: [['Sub rolls', 2, 'each']],
      options: ['Dijon mustard'],
      instructions: [
        'Brown the brats and set aside.',
        'Soften peppers and onions, return the brats to finish.',
      ],
    },
  ],
]

function toRecipe(slot: Slot, servings: number, macros: DayMacros, share: number): Recipe {
  return {
    name: slot.name,
    cuisine: slot.cuisine,
    ingredients: [
      ...slot.pantry.map(([name, quantity, unit]) => ({
        name,
        quantity: quantity * servings,
        unit,
        from_pantry: true,
      })),
      ...slot.buy.map(([name, quantity, unit]) => ({
        name,
        quantity: quantity * servings,
        unit,
        from_pantry: false,
      })),
    ],
    options: slot.options,
    instructions: slot.instructions,
    macros: {
      calories: Math.round(macros.calories * share),
      protein_g: Math.round(macros.protein_g * share),
      carbs_g: Math.round(macros.carbs_g * share),
      fat_g: Math.round(macros.fat_g * share),
    },
    servings,
  }
}

/** Calorie share per slot. Supper carries the day (SPEC.md has no fixed split). */
const SHARE = { breakfast: 0.25, lunch: 0.3, snack: 0.1, supper: 0.35 }

export interface MockPlanInput {
  servings: number
  weekMacros: DayMacros[]
}

export function buildMockPlan({ servings, weekMacros }: MockPlanInput): GeneratedPlan {
  return {
    days: weekMacros.map((macros, dayIndex) => ({
      day_index: dayIndex,
      breakfast: toRecipe(BREAKFASTS[dayIndex]!, servings, macros, SHARE.breakfast),
      lunch: toRecipe(LUNCHES[dayIndex]!, servings, macros, SHARE.lunch),
      snack: toRecipe(SNACKS[dayIndex]!, servings, macros, SHARE.snack),
      supper_options: SUPPERS[dayIndex % SUPPERS.length]!.map((slot) =>
        toRecipe(slot, servings, macros, SHARE.supper)
      ),
    })),
  }
}
