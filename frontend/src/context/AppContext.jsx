import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppContext = createContext(null)
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(() => read('nutriwise-profile', null))
  const [confirmedNutrition, setConfirmedNutrition] = useState(() => read('nutriwise-confirmed', null))
  const [quantity, setQuantity] = useState(() => read('nutriwise-quantity', 1))
  const [recommendation, setRecommendation] = useState(() => read('nutriwise-recommendation', null))

  useEffect(() => localStorage.setItem('nutriwise-profile', JSON.stringify(profile)), [profile])
  useEffect(() => localStorage.setItem('nutriwise-confirmed', JSON.stringify(confirmedNutrition)), [confirmedNutrition])
  useEffect(() => localStorage.setItem('nutriwise-quantity', JSON.stringify(quantity)), [quantity])
  useEffect(() => localStorage.setItem('nutriwise-recommendation', JSON.stringify(recommendation)), [recommendation])

  const value = useMemo(() => ({
    profile, setProfile, confirmedNutrition, setConfirmedNutrition,
    quantity, setQuantity, recommendation, setRecommendation,
  }), [profile, confirmedNutrition, quantity, recommendation])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
