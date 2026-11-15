export const nutrientMeta = [
  ['calories_kcal', 'Calories', 'kcal'],
  ['protein_g', 'Protein', 'g'],
  ['carbohydrates_g', 'Carbohydrates', 'g'],
  ['total_sugar_g', 'Total sugar', 'g'],
  ['added_sugar_g', 'Added sugar', 'g'],
  ['total_fat_g', 'Total fat', 'g'],
  ['saturated_fat_g', 'Saturated fat', 'g'],
  ['fiber_g', 'Fiber', 'g'],
  ['sodium_mg', 'Sodium', 'mg'],
]

export const goalLabels = {
  reduce_added_sugar: 'Reduce added sugar', increase_protein: 'Increase protein intake',
  weight_management: 'Weight management', weight_gain: 'Weight gain',
  muscle_building: 'Muscle building', lower_sodium: 'Lower sodium intake',
  balanced_eating: 'General balanced eating',
}

export const basisLabels = { per_serving: 'Per serving', per_100g: 'Per 100 g', per_100ml: 'Per 100 ml', unspecified: 'Basis not supplied' }

export function formatValue(value, unit = '') {
  return value === null || value === undefined || value === '' ? 'Not declared' : `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`
}
