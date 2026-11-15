export default function PageHeader({ eyebrow, title, description, children }) {
  return <section className="page-hero"><div className="container"><div className="page-hero-copy"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p>{children}</div></div></section>
}
