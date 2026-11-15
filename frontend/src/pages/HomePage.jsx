import { ArrowRight, BarChart3, Camera, Check, GitCompareArrows, Leaf, SearchCheck, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const steps = [
  ['01', 'Scan the label', 'Photograph the nutrition panel and ingredients list.'],
  ['02', 'Verify every value', 'Review OCR results and correct anything unclear.'],
  ['03', 'Apply your goal', 'Use confirmed values with transparent goal-specific rules.'],
  ['04', 'Understand why', 'See the useful factors, concerns, and missing information.'],
]
const features = [
  [Camera, 'Food label scanning', 'Extract visible label text with on-device Tesseract OCR.'],
  [BarChart3, 'Nutrition analysis', 'Scale confirmed values for the quantity you actually plan to eat.'],
  [Sparkles, 'Goal-based context', 'Get deterministic explanations—never a mysterious health score.'],
  [ShieldCheck, 'Ingredient awareness', 'Flag declared matches while keeping allergen limits explicit.'],
  [GitCompareArrows, 'Fair comparisons', 'Compare only when measurement bases and units are compatible.'],
  [SearchCheck, 'Real local dataset', 'Browse and filter only the products recorded in your own CSV.'],
]

export default function HomePage() {
  return <>
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow"><Leaf size={15} /> Food labels, made human</span>
          <h1>Understand your food <em>before you eat it.</em></h1>
          <p>Upload a packaged-food label, understand its nutritional content, and discover how well it matches your dietary goals.</p>
          <div className="button-row"><Link className="button" to="/scanner">Analyze a food packet <ArrowRight size={18} /></Link><a className="button secondary" href="#how">Explore how it works</a></div>
          <div className="trust-row"><span><Check /> No health score</span><span><Check /> Missing data stays missing</span><span><Check /> You confirm OCR</span></div>
        </div>
        <div className="hero-visual" aria-label="Example nutrition analysis illustration">
          <div className="packet-card"><span className="packet-tab">NUTRITION</span><div className="packet-title">Your label,<br />clearly explained.</div><div className="mini-label"><b>Per serving</b><span>Protein <strong>12 g</strong></span><span>Added sugar <strong>4 g</strong></span><span>Sodium <strong>180 mg</strong></span></div></div>
          <div className="floating-card good"><span className="status-dot" /> Goal fit explained <strong>Clear reasons, not a score</strong></div>
          <div className="floating-card quantity">2× <span>serving calculator</span></div>
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        </div>
      </div>
    </section>

    <section className="section" id="how"><div className="container"><div className="section-heading"><span className="eyebrow">A careful four-step flow</span><h2>From crowded label to a useful decision</h2><p>OCR helps with speed, but your confirmation remains the source of truth.</p></div><div className="steps-grid">{steps.map(([number, title, body]) => <article className="step-card" key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>

    <section className="section soft"><div className="container split-feature"><div><span className="eyebrow">Why labels matter</span><h2>A number without context is hard to use.</h2><p>Serving sizes, total sugar, added sugar, sodium, protein, and fiber answer different questions. NutriWise keeps the measurement basis visible and explains what is known, what is missing, and which rule shaped the result.</p><Link className="text-link" to="/goals">Set your dietary goal <ArrowRight size={16} /></Link></div><div className="principle-list"><div><span>01</span><p><strong>Never turn missing into zero.</strong> An undeclared value remains unknown.</p></div><div><span>02</span><p><strong>Never hide the basis.</strong> Per serving and per 100 g are not interchangeable.</p></div><div><span>03</span><p><strong>Never overclaim safety.</strong> OCR cannot establish allergen safety.</p></div></div></div></section>

    <section className="section"><div className="container"><div className="section-heading"><span className="eyebrow">Built for practical choices</span><h2>Everything needed to inspect, understand, and compare</h2></div><div className="feature-grid">{features.map(([Icon, title, body]) => <article className="feature-card" key={title}><span className="feature-icon"><Icon /></span><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>

    <section className="section"><div className="container"><div className="evidence-banner"><div><span className="eyebrow amber">Evidence-required draft</span><h2>Built around a real local problem</h2><p>The app is ready for genuine fieldwork details, but no person, interview, date, location, photographs, or product records have been supplied yet. These facts will not be invented.</p></div><Link className="button light" to="/about">View project evidence status</Link></div></div></section>
  </>
}
