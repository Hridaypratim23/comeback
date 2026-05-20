export interface UnitConfig {
  unit: string      // storage key: 'egg', 'bowl', 'piece', 'g', etc.
  singular: string  // "1 egg", "1 bowl"
  plural: string    // "eggs", "bowls", "g"
  min: number
  max: number
  step: number
  defaultQty: number
  isGrams: boolean  // if true, macros are per 100g; else per 1 unit
}

type Rule = { keywords: string[]; config: Omit<UnitConfig, 'isGrams'> & { isGrams?: false } }

const RULES: Rule[] = [
  {
    keywords: ['egg', 'eggs', 'egg white', 'egg yolk'],
    config: { unit: 'egg', singular: 'egg', plural: 'eggs', min: 1, max: 10, step: 1, defaultQty: 2 },
  },
  {
    keywords: ['roti', 'chapati', 'chapatti', 'phulka', 'paratha'],
    config: { unit: 'roti', singular: 'roti', plural: 'rotis', min: 1, max: 8, step: 1, defaultQty: 2 },
  },
  {
    keywords: ['idli', 'idly'],
    config: { unit: 'idli', singular: 'idli', plural: 'idlis', min: 1, max: 10, step: 1, defaultQty: 3 },
  },
  {
    keywords: ['bread', 'toast', 'slice', 'bun', 'roll', 'bagel', 'pita', 'naan', 'wrap', 'lavash'],
    config: { unit: 'piece', singular: 'piece', plural: 'pieces', min: 1, max: 8, step: 1, defaultQty: 2 },
  },
  {
    keywords: ['rice cake', 'ricecake', 'biscuit', 'cookie', 'cracker', 'digestive', 'marie', 'rusk'],
    config: { unit: 'piece', singular: 'piece', plural: 'pieces', min: 1, max: 10, step: 1, defaultQty: 3 },
  },
  {
    keywords: ['banana'],
    config: { unit: 'banana', singular: 'banana', plural: 'bananas', min: 0.5, max: 4, step: 0.5, defaultQty: 1 },
  },
  {
    keywords: ['apple', 'orange', 'pear', 'mango', 'kiwi', 'peach', 'plum', 'guava', 'papaya', 'pomegranate', 'fig', 'dates', 'date'],
    config: { unit: 'piece', singular: 'piece', plural: 'pieces', min: 0.5, max: 5, step: 0.5, defaultQty: 1 },
  },
  {
    keywords: ['sprout', 'sprouts', 'salad', 'oats', 'oatmeal', 'cereal', 'muesli', 'granola', 'poha', 'upma', 'dalia'],
    config: { unit: 'bowl', singular: 'bowl', plural: 'bowls', min: 0.5, max: 4, step: 0.5, defaultQty: 1 },
  },
  {
    keywords: ['dal', 'daal', 'lentil', 'soup', 'curry', 'sabzi', 'sabji', 'rice', 'khichdi', 'pulao', 'biryani', 'rajma', 'chana'],
    config: { unit: 'bowl', singular: 'bowl', plural: 'bowls', min: 0.5, max: 3, step: 0.5, defaultQty: 1 },
  },
  {
    keywords: ['milk', 'juice', 'smoothie', 'shake', 'lassi', 'buttermilk'],
    config: { unit: 'glass', singular: 'glass', plural: 'glasses', min: 0.5, max: 4, step: 0.5, defaultQty: 1 },
  },
  {
    keywords: ['coffee', 'tea', 'chai', 'matcha'],
    config: { unit: 'cup', singular: 'cup', plural: 'cups', min: 1, max: 5, step: 1, defaultQty: 1 },
  },
  {
    keywords: ['peanut butter', 'almond butter', 'honey', 'jam', 'jelly', 'butter', 'ghee', 'oil', 'sauce', 'mayo', 'ketchup', 'mustard', 'hummus'],
    config: { unit: 'tbsp', singular: 'tbsp', plural: 'tbsp', min: 0.5, max: 6, step: 0.5, defaultQty: 1 },
  },
  {
    keywords: ['protein', 'whey', 'casein', 'mass gainer', 'mass-gainer'],
    config: { unit: 'scoop', singular: 'scoop', plural: 'scoops', min: 0.5, max: 3, step: 0.5, defaultQty: 1 },
  },
  {
    keywords: ['dosa', 'uttapam'],
    config: { unit: 'dosa', singular: 'dosa', plural: 'dosas', min: 1, max: 6, step: 1, defaultQty: 2 },
  },
  {
    keywords: ['samosa', 'vada', 'pakora', 'pakoda'],
    config: { unit: 'piece', singular: 'piece', plural: 'pieces', min: 1, max: 8, step: 1, defaultQty: 2 },
  },
]

const GRAMS_CONFIG: UnitConfig = {
  unit: 'g', singular: '100g', plural: 'g',
  min: 50, max: 500, step: 50, defaultQty: 100, isGrams: true,
}

export function getUnitConfig(foodName: string): UnitConfig {
  const lower = foodName.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return { ...rule.config, isGrams: false }
    }
  }
  return GRAMS_CONFIG
}

export function formatQty(qty: number, config: UnitConfig): string {
  if (config.isGrams) return `${qty}g`
  const label = qty === 1 ? config.singular : config.plural
  return `${qty} ${label}`
}

export function scaleRatio(qty: number, config: UnitConfig): number {
  if (config.isGrams) return qty / 100
  return qty
}
