import { Check, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { goalLabels } from '../utils/nutrition'

const defaultForm = { primary_goal: '', secondary_goals: [], dietary_preference: 'none', ingredients_to_avoid: [] }
const allergens = ['milk', 'peanuts', 'tree nuts', 'soy', 'wheat/gluten', 'eggs', 'fish', 'shellfish', 'sesame']

export default function GoalsPage() {
  const { profile, setProfile } = useApp()
  const [form, setForm] = useState(profile || defaultForm)
  const [custom, setCustom] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()
  useEffect(() => setForm(profile || defaultForm), [profile])

  const toggle = (field, value) => setForm(current => ({ ...current, [field]: current[field].includes(value) ? current[field].filter(item => item !== value) : [...current[field], value] }))
  const submit = event => {
    event.preventDefault()
    if (!form.primary_goal) { setError('Choose one primary dietary goal.'); return }
    const customItems = custom.split(',').map(item => item.trim().toLowerCase()).filter(Boolean)
    const next = { ...form, ingredients_to_avoid: [...new Set([...form.ingredients_to_avoid, ...customItems])] }
    setProfile(next); setForm(next); setError(''); setSaved(true)
    setTimeout(() => navigate('/scanner'), 450)
  }
  return <>
    <PageHeader eyebrow="Your preferences" title="What matters most to you?" description="Choose one primary goal. NutriWise will change its explanation—not the label values—to match that goal." />
    <section className="section page-section"><div className="container narrow"><form className="stack-form" onSubmit={submit}>
      <fieldset><legend><span>1</span> Primary goal <small>Required</small></legend><div className="option-grid">{Object.entries(goalLabels).map(([value, label]) => <label className={`choice-card ${form.primary_goal === value ? 'selected' : ''}`} key={value}><input type="radio" name="goal" value={value} checked={form.primary_goal === value} onChange={() => setForm({ ...form, primary_goal: value, secondary_goals: form.secondary_goals.filter(item => item !== value) })} /><span className="choice-check"><Check /></span><strong>{label}</strong><small>{goalDescription(value)}</small></label>)}</div></fieldset>
      <fieldset><legend><span>2</span> Secondary goals <small>Optional</small></legend><div className="chip-grid">{Object.entries(goalLabels).filter(([value]) => value !== form.primary_goal).map(([value, label]) => <label className={`select-chip ${form.secondary_goals.includes(value) ? 'selected' : ''}`} key={value}><input type="checkbox" checked={form.secondary_goals.includes(value)} onChange={() => toggle('secondary_goals', value)} />{label}</label>)}</div></fieldset>
      <fieldset><legend><span>3</span> Dietary preference</legend><div className="segmented">{[['none', 'No special preference'], ['vegetarian', 'Vegetarian'], ['vegan', 'Vegan'], ['high_protein', 'High-protein']].map(([value, label]) => <label className={form.dietary_preference === value ? 'selected' : ''} key={value}><input type="radio" name="preference" checked={form.dietary_preference === value} onChange={() => setForm({ ...form, dietary_preference: value })} />{label}</label>)}</div></fieldset>
      <fieldset><legend><span>4</span> Ingredients to flag <small>Optional</small></legend><div className="safety-note"><ShieldAlert /><p><strong>This is a text-matching aid, not an allergy safety check.</strong> Always read the physical package and manufacturer guidance.</p></div><div className="chip-grid">{allergens.map(value => <label className={`select-chip ${form.ingredients_to_avoid.includes(value) ? 'selected warning' : ''}`} key={value}><input type="checkbox" checked={form.ingredients_to_avoid.includes(value)} onChange={() => toggle('ingredients_to_avoid', value)} />{value}</label>)}</div><label className="field"><span>Other ingredients, separated by commas</span><input value={custom} onChange={e => setCustom(e.target.value)} placeholder="e.g. palm oil, artificial sweetener" /></label></fieldset>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="form-actions"><p>{saved ? 'Preferences saved. Opening the scanner…' : 'Saved only in this browser.'}</p><button className="button" type="submit">Save and continue</button></div>
    </form></div></section>
  </>
}

function goalDescription(goal) {
  return {
    reduce_added_sugar: 'Focus on declared added sugar and portions.', increase_protein: 'Look for meaningful protein contribution.',
    weight_management: 'Consider energy with protein and fiber.', weight_gain: 'Consider energy, protein, and practical portions.',
    muscle_building: 'Contextualize protein and energy—no promises.', lower_sodium: 'Review sodium for the selected amount.',
    balanced_eating: 'Consider several nutrients together.',
  }[goal]
}
