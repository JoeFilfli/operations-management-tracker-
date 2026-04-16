import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',          label: 'Dashboard',    icon: '⊞', roles: null },
  { to: '/equipment', label: 'Equipment',    icon: '⚙', roles: null },
  { to: '/tickets',   label: 'Tickets',      icon: '🔧', roles: null },
  { to: '/locations', label: 'Locations',    icon: '📍', roles: null },
  { to: '/users',     label: 'Users',        icon: '👤', roles: ['admin'] },
  { to: '/activity',  label: 'Activity Log', icon: '📋', roles: ['admin'] },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => { signOut(); navigate('/login', { replace: true }) }
  const visibleNav = NAV.filter((n) => !n.roles || n.roles.includes(user?.role))

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Skip to main content — visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-brand-600 focus:text-white focus:rounded focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <nav aria-label="Primary navigation" className="w-56 flex-shrink-0 bg-gray-900 text-gray-100 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-700">
          <Link to="/" className="flex items-center gap-2" aria-label="OpsTrack home">
            <span className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">O</span>
            <span className="font-bold text-white">OpsTrack</span>
          </Link>
        </div>

        <ul className="flex-1 py-3 overflow-y-auto list-none m-0 p-0">
          {visibleNav.map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                    isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <span aria-hidden="true" className="text-base">{n.icon}</span>
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="px-4 py-3 border-t border-gray-700 text-xs">
          <p className="font-medium text-white truncate">{user?.full_name}</p>
          <p className="text-gray-400 truncate">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:underline"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main id="main-content" className="flex-1 overflow-y-auto bg-gray-50" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
