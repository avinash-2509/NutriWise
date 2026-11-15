import { Database } from 'lucide-react'
export default function EmptyState({ title, children, action }) {
  return <div className="empty-state"><span className="empty-icon"><Database /></span><h3>{title}</h3><p>{children}</p>{action}</div>
}
