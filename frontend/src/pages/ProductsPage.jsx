import { AlertTriangle, ArrowUpDown, FileUp, LoaderCircle, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { api, errorMessage } from '../services/api'
import { basisLabels, formatValue } from '../utils/nutrition'

const sortFields = { protein_g: 'Protein', total_sugar_g: 'Total sugar', calories_kcal: 'Calories', sodium_mg: 'Sodium' }
export default function ProductsPage() {
  const [products, setProducts] = useState([]), [issues, setIssues] = useState([]), [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(''), [category, setCategory] = useState(''), [basis, setBasis] = useState(''), [sort, setSort] = useState('')
  const [message, setMessage] = useState(''), [error, setError] = useState('')
  const load = async () => { setLoading(true); try { const { data } = await api.get('/products'); setProducts(data.products); setIssues(data.issues) } catch (err) { setError(errorMessage(err)) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  const categories = [...new Set(products.map(item => item.category).filter(Boolean))].sort()
  const basisOptions = [...new Set(products.map(item => `${item.nutrition_basis}|${item.serving_unit || ''}`))]
  const visible = useMemo(() => {
    const list = products.filter(item => (!query || `${item.product_name} ${item.brand || ''}`.toLowerCase().includes(query.toLowerCase())) && (!category || item.category === category) && (!basis || `${item.nutrition_basis}|${item.serving_unit || ''}` === basis))
    if (sort && basis) list.sort((a,b) => (b[sort] ?? -Infinity) - (a[sort] ?? -Infinity))
    return list
  }, [products, query, category, basis, sort])
  const importFile = async file => {
    if (!file) return
    setMessage(''); setError('')
    const data = new FormData(); data.append('file', file)
    try { const response = await api.post('/products/import', data); setMessage(`${response.data.imported} product record(s) imported without overwriting existing IDs.`); await load() }
    catch (err) { const detail = err?.response?.data?.detail; setError(detail?.issues ? `${detail.message} ${detail.issues.map(issue => `Row ${issue.row}: ${issue.message}`).join(' ')}` : errorMessage(err)) }
  }
  return <>
    <PageHeader eyebrow="Local product records" title="Collected product library" description="Search and inspect only genuine entries from data.csv. The starter dataset is intentionally empty." />
    <section className="section page-section"><div className="container">
      <div className="library-toolbar"><label className="search-field"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search product or brand" /></label><select value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select><select value={basis} onChange={e => { setBasis(e.target.value); if (!e.target.value) setSort('') }}><option value="">All measurement bases</option>{basisOptions.map(item => { const [base, unit] = item.split('|'); return <option key={item} value={item}>{basisLabels[base]}{unit ? ` · ${unit}` : ''}</option>})}</select><label className="import-button"><FileUp /> Import CSV<input hidden type="file" accept=".csv,text/csv" onChange={e => importFile(e.target.files[0])} /></label></div>
      <div className="sort-row"><span><ArrowUpDown /> Sort comparable records:</span>{Object.entries(sortFields).map(([value,label]) => <button key={value} disabled={!basis} className={sort === value ? 'active' : ''} onClick={() => setSort(value)}>{label}</button>)}{!basis && <small>Choose a measurement basis before sorting.</small>}</div>
      {message && <div className="success-message">{message}</div>}{error && <div className="form-error">{error}</div>}
      {issues.length > 0 && <div className="warning-list"><AlertTriangle /><div><strong>CSV issues</strong>{issues.map(issue => <p key={`${issue.row}-${issue.code}`}>Row {issue.row}: {issue.message}</p>)}</div></div>}
      {loading ? <div className="loading-state"><LoaderCircle className="spin" /> Loading local records…</div> : products.length === 0 ? <EmptyState title="No collected food products yet.">Import your fieldwork nutrition records to begin comparing products. Keep the exact CSV header and leave genuinely missing values blank.</EmptyState> : <><p className="result-count">Showing {visible.length} of {products.length} records</p><div className="product-grid">{visible.map(product => <ProductCard key={product.product_id} product={product} />)}</div></>}
    </div></section>
  </>
}

function ProductCard({ product }) {
  return <article className="product-card"><div className="product-card-head"><div><span>{product.category || 'Uncategorized'}</span><h3>{product.product_name}</h3><p>{product.brand || 'Brand not recorded'}</p></div><b>{basisLabels[product.nutrition_basis]}</b></div><div className="product-nutrients"><span><small>Protein</small><strong>{formatValue(product.protein_g, 'g')}</strong></span><span><small>Sugar</small><strong>{formatValue(product.total_sugar_g, 'g')}</strong></span><span><small>Calories</small><strong>{formatValue(product.calories_kcal, 'kcal')}</strong></span><span><small>Sodium</small><strong>{formatValue(product.sodium_mg, 'mg')}</strong></span></div><div className="product-meta"><span>Serving: {product.serving_size ? `${product.serving_size} ${product.serving_unit}` : 'not recorded'}</span><span>ID: {product.product_id}</span></div></article>
}
