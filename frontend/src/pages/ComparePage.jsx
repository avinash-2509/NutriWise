import { ArrowRightLeft, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { api, errorMessage } from '../services/api'
import { formatValue, goalLabels, nutrientMeta } from '../utils/nutrition'

export default function ComparePage() {
  const { profile } = useApp()
  const [products, setProducts] = useState([]), [a, setA] = useState(''), [b, setB] = useState('')
  const [goal, setGoal] = useState(profile?.primary_goal || 'balanced_eating'), [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => { api.get('/products').then(({data}) => setProducts(data.products)).catch(err => setError(errorMessage(err))).finally(() => setLoading(false)) }, [])
  const compare = async () => {
    if (!a || !b || a === b) { setError('Choose two different products.'); return }
    setLoading(true); setError('')
    try { const { data } = await api.post('/products/compare', { product_a_id: a, product_b_id: b, goal }); setResult(data) }
    catch (err) { setError(errorMessage(err)) }
    finally { setLoading(false) }
  }
  return <>
    <PageHeader eyebrow="Goal-aware comparison" title="Compare like with like" description="NutriWise normalizes mass or volume records when possible and explains when a fair comparison cannot be made." />
    <section className="section page-section"><div className="container">
      {products.length === 0 && !loading ? <EmptyState title="Two real products are required">Add genuine records to data.csv before comparing. No invented alternatives will be shown.</EmptyState> : <>
        <div className="compare-controls"><label className="field"><span>Product A</span><select value={a} onChange={e => setA(e.target.value)}><option value="">Choose product</option>{products.map(item => <option key={item.product_id} value={item.product_id}>{item.product_name}</option>)}</select></label><span className="versus"><ArrowRightLeft /></span><label className="field"><span>Product B</span><select value={b} onChange={e => setB(e.target.value)}><option value="">Choose product</option>{products.map(item => <option key={item.product_id} value={item.product_id}>{item.product_name}</option>)}</select></label><label className="field"><span>Dietary goal</span><select value={goal} onChange={e => setGoal(e.target.value)}>{Object.entries(goalLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="button" onClick={compare} disabled={loading}>{loading ? <LoaderCircle className="spin" /> : 'Compare products'}</button></div>
        {error && <div className="form-error">{error}</div>}
        {result && <div className="comparison-result"><div className={`comparison-explanation ${result.comparable ? '' : 'warning'}`}><span>{result.comparable ? 'Comparable result' : 'Comparison limited'}</span><h2>{result.explanation}</h2>{result.category_note && <p>{result.category_note}</p>}{result.comparison_basis && <b>Normalized basis: {result.comparison_basis}</b>}</div><div className="comparison-table"><div className="comparison-row header"><span>Nutrient</span><strong>{result.product_a.product_name}</strong><strong>{result.product_b.product_name}</strong></div>{nutrientMeta.map(([key,label,unit]) => <div className="comparison-row" key={key}><span>{label}</span><strong>{formatValue(result.normalized?.product_a?.[key] ?? result.product_a[key], unit)}</strong><strong>{formatValue(result.normalized?.product_b?.[key] ?? result.product_b[key], unit)}</strong></div>)}</div></div>}
      </>}
    </div></section>
  </>
}
