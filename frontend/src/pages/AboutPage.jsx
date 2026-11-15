import { AlertTriangle, CheckCircle2, Clock3, Code2, FileQuestion, MapPin, UserRound } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const evidence = [
  [MapPin, 'Observation location', 'EVIDENCE REQUIRED'], [Clock3, 'Observation date and duration', 'EVIDENCE REQUIRED'],
  [UserRound, 'Target person and role', 'EVIDENCE REQUIRED'], [FileQuestion, 'Interview statements and surprise', 'EVIDENCE REQUIRED'],
]
export default function AboutPage() {
  return <>
    <PageHeader eyebrow="Project transparency" title="A working tool, awaiting genuine fieldwork evidence" description="Technical completion and assignment submission readiness are deliberately tracked separately." />
    <section className="section page-section"><div className="container about-layout">
      <article className="about-main"><span className="eyebrow">The problem</span><h2>Nutrition panels are information-rich but decision-poor.</h2><p>NutriWise turns confirmed packaged-food values into goal-specific, plain-language context. It keeps units and missing data visible and uses deterministic rules instead of an unexplained score.</p><div className="safety-note"><AlertTriangle /><p><strong>No fieldwork story is claimed yet.</strong> The repository contains structured templates so real facts can be added after the visit, without filling gaps with plausible-sounding fiction.</p></div><h3>What the application actually does</h3><ul className="check-list"><li><CheckCircle2 /> Saves a dietary goal locally in the browser.</li><li><CheckCircle2 /> Runs OCR when Tesseract is installed and always allows manual correction.</li><li><CheckCircle2 /> Scales confirmed nutrition values for a chosen quantity.</li><li><CheckCircle2 /> Applies explainable, goal-specific recommendation rules.</li><li><CheckCircle2 /> Validates, searches, and compares personally collected CSV records.</li></ul><h3>What it does not claim</h3><p>It does not diagnose, prescribe a medical diet, prove allergy safety, declare one product universally healthy, or replace a qualified professional. OCR text can be wrong and must be checked against the package.</p></article>
      <aside className="evidence-card"><span className="eyebrow amber">Current evidence status</span><h3>Real-world record</h3>{evidence.map(([Icon,label,value]) => <div className="evidence-row" key={label}><Icon /><div><span>{label}</span><strong>{value}</strong></div></div>)}<hr /><p>Add original photographs under <code>evidence/</code>, genuine products to <code>data.csv</code>, and verified facts to the Markdown records.</p></aside>
      <article className="technical-card"><Code2 /><div><h3>Readable by design</h3><p>Thresholds, CSV validation, calculations, OCR parsing, ingredients, and product comparison live in separate small Python modules so each can be explained and changed during review.</p></div></article>
    </div></section>
  </>
}
