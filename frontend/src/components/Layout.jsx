import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'

const links = [
  ['/', 'Home'], ['/goals', 'My goals'], ['/scanner', 'Scan label'],
  ['/products', 'Products'], ['/compare', 'Compare'], ['/about', 'About'],
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  return <div className="app-shell">
    <header className="site-header">
      <div className="container nav-wrap">
        <Link to="/" aria-label="NutriWise home"><Logo /></Link>
        <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          {links.map(([to, label]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}
          <Link className="button small nav-cta" to="/scanner" onClick={() => setOpen(false)}>Analyze food</Link>
        </nav>
        <button className="icon-button menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      </div>
    </header>
    <main>{children}</main>
    <footer className="site-footer"><div className="container footer-grid"><div><Logo /><p>Explainable nutrition context for packaged food labels.</p></div><div><strong>Important</strong><p>NutriWise is educational, not medical advice. Always verify the physical package.</p></div><div><strong>Data promise</strong><p>Product suggestions use only your locally collected CSV records.</p></div></div></footer>
  </div>
}
