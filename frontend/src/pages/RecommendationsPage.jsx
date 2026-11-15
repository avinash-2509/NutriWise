import { AlertCircle, ArrowRight, CheckCircle2, CircleHelp, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { goalLabels } from '../utils/nutrition'

const assessmentLabels = { good_match: 'Good match', mixed_fit: 'Mixed fit', less_suitable: 'Less suitable', insufficient_information: 'Insufficient information' }
export default function RecommendationsPage() {
  const { recommendation, confirmedNutrition } = useApp()
  if (!recommendation) return <><PageHeader eyebrow="Personalized result" title="No recommendation yet" description="Confirm nutrition values and run the goal-specific rules first." /><section className="section"><div className="container"><EmptyState title="Nothing to explain yet" action={<Link className="button" to="/analysis">Go to analysis</Link>}>Results are generated only from confirmed values.</EmptyState></div></section></>
  return <>
    <PageHeader eyebrow="Personalized result" title={confirmedNutrition?.product_name || 'Confirmed product'} description={goalLabels[recommendation.goal]} />
    <section className="section page-section"><div className="container result-layout">
      <article className={`assessment-card ${recommendation.assessment}`}><div className="assessment-icon"><Sparkles /></div><div><span>Overall assessment</span><h2>{assessmentLabels[recommendation.assessment]}</h2><p>{recommendation.summary}</p></div><small>Application heuristic · not medical advice</small></article>
      <div className="result-columns">
        <ResultCard icon={CheckCircle2} tone="positive" title="Positive findings" items={recommendation.positive_factors} empty="No positive factor could be established from the confirmed fields." />
        <ResultCard icon={AlertCircle} tone="attention" title="Nutrients to watch" items={recommendation.attention_factors} empty="No goal-specific concern was triggered by the available values." />
      </div>
      {recommendation.ingredient_warnings?.length > 0 && <ResultCard icon={ShieldAlert} tone="danger" title="Ingredient matches" items={recommendation.ingredient_warnings} />}
      <div className="result-columns">
        <ResultCard icon={CircleHelp} title="What could be better?" items={recommendation.recommendations} empty="No additional suggestion was generated." />
        <ResultCard icon={AlertCircle} tone="muted" title="Missing information" items={recommendation.missing_data?.map(item => `${item} was not confirmed.`)} empty="All goal-critical fields were available." />
      </div>
      <article className="rules-card"><span className="eyebrow">Why this result?</span><h3>Rules applied to your confirmed values</h3><div className="rule-chips">{recommendation.rules_applied.map(rule => <code key={rule}>{rule.replaceAll('_', ' ')}</code>)}</div><p>Thresholds are centralized in <code>backend/app/services/config.py</code>. They are documented app heuristics, not a validated health score.</p></article>
      <div className="action-bar"><Link className="button secondary" to="/scanner"><RefreshCw /> Analyze another product</Link><Link className="button secondary" to="/compare">Compare products</Link><Link className="button" to="/products">View product library <ArrowRight /></Link></div>
    </div></section>
  </>
}

function ResultCard({ icon: Icon, title, items = [], empty, tone = '' }) {
  return <article className={`result-card ${tone}`}><div className="result-card-title"><span><Icon /></span><h3>{title}</h3></div>{items.length ? <ul>{items.map(item => <li key={item}>{item}</li>)}</ul> : <p className="empty-copy">{empty}</p>}</article>
}
