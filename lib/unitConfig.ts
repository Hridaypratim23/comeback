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

type Rule = {
  keywords: string[]
  config: Omit<UnitConfig, 'isGrams'> & { isGrams?: false }
  dynamic?: boolean  // if true, use the matched keyword as the unit name
}

// Simple pluraliser for fruit names
function pluralise(word: string): string {
  if (word.endsWith('berry')) return word.slice(0, -5) + 'berries'
  if (word.endsWith('cherry')) return 'cherries'
  if (word === 'mango') return 'mangoes'
  if (word.endsWith('s')) return word  // already plural (grapes, dates…)
  return word + 's'
}

const FRUIT_BASE = { unit: 'piece', singular: 'piece', plural: 'pieces', min: 0.5, max: 8, step: 0.5, defaultQty: 1 }

const RULES: Rule[] = [
  {
    keywords: ['egg', 'eggs', 'egg white', 'egg yolk', 'omelette', 'omelet', 'omlette'],
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
    config: { unit: 'banana', singular: 'banana', plural: 'bananas', min: 0.5, max: 6, step: 0.5, defaultQty: 1 },
  },
  // Fruits — dynamic: matched keyword becomes the unit label ("1 apple", "2 oranges")
  {
    dynamic: true,
    keywords: ['apple', 'orange', 'pear', 'mango', 'kiwi', 'peach', 'plum', 'guava', 'papaya',
               'pomegranate', 'fig', 'date', 'lemon', 'lime', 'grape', 'watermelon', 'pineapple',
               'strawberry', 'blueberry', 'cherry', 'melon'],
    config: { ...FRUIT_BASE },
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
  {
    keywords: ['gulab jamun', 'gulabjamun', 'kalakand', 'barfi', 'burfi', 'ladoo', 'laddu',
               'rasgulla', 'rasmalai', 'rasmali', 'peda', 'jalebi', 'kaju katli',
               'mysore pak', 'motichoor', 'besan ladoo', 'coconut ladoo'],
    config: { unit: 'piece', singular: 'piece', plural: 'pieces', min: 1, max: 8, step: 1, defaultQty: 1 },
  },
]

const CHICKEN_CONFIG: UnitConfig = {
  unit: 'g', singular: '100g', plural: 'g',
  min: 325, max: 400, step: 25, defaultQty: 350, isGrams: true,
}

const CHICKEN_KEYWORDS = [
  'chicken', 'grilled chicken', 'boiled chicken', 'chicken breast',
  'chicken thigh', 'chicken leg', 'chicken fillet', 'chicken piece',
]

const GRAMS_CONFIG: UnitConfig = {
  unit: 'g', singular: '100g', plural: 'g',
  min: 50, max: 500, step: 50, defaultQty: 100, isGrams: true,
}

const SNACK_GRAMS_CONFIG: UnitConfig = {
  unit: 'g', singular: 'g', plural: 'g',
  min: 10, max: 100, step: 10, defaultQty: 30, isGrams: true,
}

const SNACK_GRAM_KEYWORDS = [
  'peanut', 'chana', 'channa', 'chickpea', 'almond', 'cashew',
  'walnut', 'pistachio', 'makhana', 'fox nut', 'mixed nut',
]
const SNACK_EXCLUDES = ['butter', 'paste', 'oil']

export function getUnitConfig(foodName: string): UnitConfig {
  const lower = foodName.toLowerCase()
  if (CHICKEN_KEYWORDS.some(kw => lower.includes(kw))) return CHICKEN_CONFIG
  const isSnackGrams =
    SNACK_GRAM_KEYWORDS.some(kw => lower.includes(kw)) &&
    !SNACK_EXCLUDES.some(ex => lower.includes(ex))
  if (isSnackGrams) return SNACK_GRAMS_CONFIG
  for (const rule of RULES) {
    const matched = rule.keywords.find(kw => lower.includes(kw))
    if (matched) {
      if (rule.dynamic) {
        return {
          ...rule.config,
          isGrams: false,
          unit: matched,
          singular: matched,
          plural: pluralise(matched),
        }
      }
      return { ...rule.config, isGrams: false }
    }
  }
  return GRAMS_CONFIG
}

function formatFraction(qty: number): string {
  const whole = Math.floor(qty)
  const half = Math.abs(qty - whole - 0.5) < 0.01
  if (whole === 0) return '1/2'
  return half ? `${whole} 1/2` : `${whole}`
}

export function formatQty(qty: number, config: UnitConfig): string {
  if (config.isGrams) return `${qty}g`
  const label = qty <= 1 ? config.singular : config.plural
  const qtyStr = Number.isInteger(qty) ? `${qty}` : formatFraction(qty)
  return `${qtyStr} ${label}`
}

export function scaleRatio(qty: number, config: UnitConfig): number {
  if (config.isGrams) return qty / 100
  return qty
}
