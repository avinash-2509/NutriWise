import { AlertTriangle, Camera, CheckCircle2, FileImage, LoaderCircle, PencilLine, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { api, errorMessage } from '../services/api'
import { nutrientMeta } from '../utils/nutrition'

const empty = { product_name: '', serving_size: '', serving_unit: 'g', nutrition_basis: 'per_serving', calories_kcal: '', protein_g: '', carbohydrates_g: '', total_sugar_g: '', added_sugar_g: '', total_fat_g: '', saturated_fat_g: '', fiber_g: '', sodium_mg: '', ingredients: '', allergens_declared: '' }

export default function ScannerPage() {
  const { confirmedNutrition, setConfirmedNutrition, setRecommendation } = useApp()
  const [nutritionFile, setNutritionFile] = useState(null)
  const [ingredientsFile, setIngredientsFile] = useState(null)
  const [form, setForm] = useState(confirmedNutrition || empty)
  const [sources, setSources] = useState({})
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const scan = async () => {
    if (!nutritionFile && !ingredientsFile) { setError('Add at least one JPG or PNG image, or use the manual form below.'); return }
    setLoading(true); setError(''); setWarnings([])
    const data = new FormData()
    if (nutritionFile) data.append('nutrition_label', nutritionFile)
    if (ingredientsFile) data.append('ingredients_label', ingredientsFile)
    try {
      const response = await api.post('/ocr/extract', data)
      const fields = response.data.nutrition?.fields || {}
      setForm(current => {
        const next = { ...current }
        Object.entries(fields).forEach(([key, info]) => { next[key] = info.value })
        if (response.data.ingredients?.raw_text) next.ingredients = response.data.ingredients.raw_text.trim()
        return next
      })
      setSources(Object.fromEntries(Object.entries(fields).map(([key, info]) => [key, info])))
      setWarnings([...(response.data.nutrition?.warnings || []), ...(response.data.ingredients?.warnings || [])])
    } catch (err) { setError(`${errorMessage(err)} You can still enter every value manually.`) }
    finally { setLoading(false) }
  }

  const change = (key, value) => {
    setForm(current => ({ ...current, [key]: value }))
    setSources(current => ({ ...current, [key]: { source: 'manual', confidence: 'confirmed by user' } }))
  }
  const confirm = event => {
    event.preventDefault(); setError('')
    if (form.serving_size && !form.serving_unit) {
      setError('Serving size and serving unit must be entered together.'); return
    }
    const numeric = new Set(nutrientMeta.map(([key]) => key).concat('serving_size'))
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value === '' ? null : numeric.has(key) ? Number(value) : value]))
    if (Object.entries(payload).some(([key, value]) => numeric.has(key) && value !== null && (!Number.isFinite(value) || value < 0))) {
      setError('Nutrition values must be valid non-negative numbers.'); return
    }
    if (!payload.serving_size) payload.serving_unit = null
    if (!payload.product_name) payload.product_name = 'Unnamed scanned product'
    setConfirmedNutrition(payload); setRecommendation(null); navigate('/analysis')
  }

  return <>
    <PageHeader eyebrow="Scan and verify" title="Turn a food label into editable data" description="Upload clear label photos. OCR suggestions are never final—review every field before continuing." />
    <section className="section page-section"><div className="container">
      <div className="scanner-grid"><UploadBox title="Nutrition facts label" hint="Required for automatic nutrient extraction" file={nutritionFile} onFile={setNutritionFile} /><UploadBox title="Ingredients list" hint="Optional, but useful for selected ingredient flags" file={ingredientsFile} onFile={setIngredientsFile} /></div>
      <div className="scan-action"><button className="button" onClick={scan} disabled={loading}>{loading ? <><LoaderCircle className="spin" /> Reading label…</> : <><Camera /> Extract label text</>}</button><span>10 MB max per image · JPG, JPEG, PNG</span></div>
      {warnings.length > 0 && <div className="warning-list"><AlertTriangle /> <div><strong>Review needed</strong>{warnings.map(item => <p key={item}>{item}</p>)}</div></div>}
      {error && <div className="form-error" role="alert">{error}</div>}

      <form className="correction-panel" onSubmit={confirm}>
        <div className="panel-heading"><div><span className="eyebrow">Confirmation step</span><h2>Check the extracted information</h2><p>Blank means “not declared.” Do not enter zero for a value that is missing.</p></div><span className="manual-badge"><PencilLine /> Manual entry always available</span></div>
        <div className="field-grid top-fields">
          <InputField label="Product name" value={form.product_name} onChange={value => change('product_name', value)} meta={sources.product_name} />
          <InputField label="Serving size" type="number" value={form.serving_size} onChange={value => change('serving_size', value)} meta={sources.serving_size} min="0.01" step="any" />
          <label className="field"><span>Serving unit</span><select value={form.serving_unit} onChange={e => change('serving_unit', e.target.value)}><option value="g">g</option><option value="ml">ml</option><option value="piece">piece</option><option value="serving">serving</option></select><small>How the package declares one serving.</small></label>
          <label className="field"><span>Nutrition values basis</span><select value={form.nutrition_basis} onChange={e => change('nutrition_basis', e.target.value)}><option value="per_serving">Per serving</option><option value="per_100g">Per 100 g</option><option value="per_100ml">Per 100 ml</option><option value="unspecified">Not supplied / verify</option></select><small className="uncertain">Verify this carefully.</small></label>
        </div>
        <div className="nutrient-form-grid">{nutrientMeta.map(([key, label, unit]) => <InputField key={key} label={label} unit={unit} type="number" value={form[key]} onChange={value => change(key, value)} meta={sources[key]} min="0" step="any" />)}</div>
        <div className="field-grid text-fields"><label className="field"><span>Ingredients</span><textarea value={form.ingredients} onChange={e => change('ingredients', e.target.value)} rows="5" placeholder="Paste or correct the ingredient list" /><small>OCR text may be incomplete.</small></label><label className="field"><span>Declared allergens</span><textarea value={form.allergens_declared} onChange={e => change('allergens_declared', e.target.value)} rows="5" placeholder="e.g. Contains: milk, soy" /><small>Use only what is explicitly printed.</small></label></div>
        <div className="form-actions"><p><CheckCircle2 /> Recommendations will use these confirmed values.</p><button className="button" type="submit">Confirm nutrition information</button></div>
      </form>
    </div></section>
  </>
}

function UploadBox({ title, hint, file, onFile }) {
  const [drag, setDrag] = useState(false)
  const preview = useMemo(() => file ? URL.createObjectURL(file) : null, [file])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])
  const accept = candidate => {
    if (!candidate) return
    if (!['image/jpeg', 'image/png'].includes(candidate.type) || candidate.size > 10 * 1024 * 1024) return
    onFile(candidate)
  }
  return <div className={`upload-card ${drag ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files[0]) }}>
    {file ? <div className="upload-preview"><img src={preview} alt={`Preview of ${title}`} /><div className="file-meta"><FileImage /><div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB</span></div></div><div className="preview-actions"><label className="text-button">Replace<input hidden type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={e => accept(e.target.files[0])} /></label><button type="button" className="text-button danger" onClick={() => onFile(null)}><Trash2 /> Remove</button></div></div> : <label className="upload-empty"><span className="upload-icon"><UploadCloud /></span><strong>{title}</strong><p>{hint}</p><span className="text-link">Choose an image</span><input hidden type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={e => accept(e.target.files[0])} /></label>}
  </div>
}

function InputField({ label, unit, value, onChange, meta, ...props }) {
  return <label className="field"><span>{label}</span><div className="input-unit"><input value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder="Not declared" {...props} />{unit && <b>{unit}</b>}</div><small className={meta?.confidence === 'low' ? 'uncertain' : ''}>{meta ? `${meta.source?.replaceAll('_', ' ')} · ${meta.confidence}` : 'Not extracted · enter if declared'}</small></label>
}
