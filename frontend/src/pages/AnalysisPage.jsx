import { ArrowRight, Calculator, Info, PackageOpen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { api, errorMessage } from '../services/api'
import { basisLabels, formatValue, nutrientMeta } from '../utils/nutrition'

export default function AnalysisPage() {
  const { confirmedNutrition, profile, quantity, setQuantity, setRecommendation } = useApp()
  const [custom, setCustom] = useState(quantity)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const totals = useMemo(() => confirmedNutrition ? Object.fromEntries(nutrientMeta.map(([key]) => [key, confirmedNutrition[key] == null ? null : confirmedNutrition[key] * quantity])) : {}, [confirmedNutrition, quantity])
  const chart = nutrientMeta.filter(([key, , unit]) => unit === 'g' && totals[key] != null).map(([key, label]) => ({ name: label, value: totals[key] }))
  if (!confirmedNutrition) return <><PageHeader eyebrow="Nutrition analysis" title="No confirmed label yet" description="Scan a label or enter values manually before viewing an analysis." /><section className="section"><div className="container"><EmptyState title="Confirm a product first" action={<Link className="button" to="/scanner">Open scanner</Link>}>The dashboard deliberately does not create example nutrition values.</EmptyState></div></section></>
  const getResult = async () => {
    if (!profile) { navigate('/goals'); return }
    setLoading(true); setError('')
    try { const response = await api.post('/recommendations', { nutrition: confirmedNutrition, quantity, profile }); setRecommendation(response.data); navigate('/recommendations') }
    catch (err) { setError(errorMessage(err)) }
    finally { setLoading(false) }
  }
  return <>
    <PageHeader eyebrow="Confirmed nutrition" title={confirmedNutrition.product_name} description={`${basisLabels[confirmedNutrition.nutrition_basis]} · ${confirmedNutrition.serving_size ? `${confirmedNutrition.serving_size} ${confirmedNutrition.serving_unit} declared serving` : 'Serving size not declared'}`} />
    <section className="section page-section"><div className="container">
      <div className="quantity-card"><div><span className="feature-icon compact"><Calculator /></span><div><h3>How much will you have?</h3><p>Totals below scale the declared values; the original basis remains visible.</p></div></div><div className="quantity-controls">{[1,2,3].map(value => <button key={value} className={quantity === value ? 'active' : ''} onClick={() => { setQuantity(value); setCustom(value) }}>{value}×</button>)}<label><input type="number" min="0.01" max="100" step="any" value={custom} onChange={e => setCustom(e.target.value)} onBlur={() => { const value = Number(custom); if (value > 0 && value <= 100) setQuantity(value) }} /><span>custom</span></label></div></div>
      <div className="nutrient-card-grid">{nutrientMeta.map(([key, label, unit]) => <article className={`nutrient-card ${totals[key] == null ? 'missing' : ''}`} key={key}><span>{label}</span><strong>{formatValue(totals[key], unit)}</strong><small>{totals[key] == null ? 'Missing—not zero' : `${quantity} × declared basis`}</small></article>)}</div>
      <div className="analysis-grid"><article className="chart-card"><div className="card-heading"><div><h3>Macronutrients for selected quantity</h3><p>Values shown in grams only.</p></div></div>{chart.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={chart} margin={{ left: -20, right: 10, top: 16 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis unit="g" /><Tooltip formatter={value => [`${value} g`, 'Amount']} /><Bar dataKey="value" fill="#247A59" radius={[7,7,0,0]} /></BarChart></ResponsiveContainer> : <div className="chart-empty">No gram-based nutrient values were confirmed.</div>}</article><article className="basis-card"><Info /><h3>Read this basis first</h3><strong>{basisLabels[confirmedNutrition.nutrition_basis]}</strong><p>A multiplier changes the selected quantity, not the label's original measurement basis. Compare products only after using compatible mass or volume units.</p><Link className="text-link" to="/scanner">Edit confirmed values</Link></article></div>
      {error && <div className="form-error">{error}</div>}
      <div className="next-card"><div><PackageOpen /><div><h3>Ready for goal-specific context?</h3><p>{profile ? 'Your saved goal will shape the explanation.' : 'Set a dietary goal before generating a result.'}</p></div></div><button className="button" onClick={getResult} disabled={loading}>{loading ? 'Applying rules…' : <>Get personalized result <ArrowRight /></>}</button></div>
    </div></section>
  </>
}
