import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, Bell, Home, Kanban, Plus, Settings, Users } from 'lucide-react'
import { useStore } from '../data/store'
import { APP_NAME, ROLE_LABEL } from '../lib/status'
import { ago, todayStr } from '../lib/dates'
import { Avatar } from './ui'

const NAV = [
  { to: '/', label: "Aujourd'hui", icon: Home, end: true },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban, end: false },
  { to: '/clients', label: 'Clients', icon: Users, end: false },
  { to: '/stats', label: 'Stats', icon: BarChart3, end: false },
  { to: '/reglages', label: 'Réglages', icon: Settings, end: false },
]

function NotificationBell() {
  const { me, notifications, markNotificationRead, markAllRead } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const mine = notifications
    .filter((n) => n.user_id === me?.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 15)
  const unread = mine.filter((n) => !n.read_at).length

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="btn btn-ghost relative" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button type="button" className="text-xs text-slate-500 hover:text-slate-900" onClick={() => void markAllRead()}>
                Tout marquer lu
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {mine.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-400">Rien pour le moment.</li>}
            {mine.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`block w-full px-3 py-2.5 text-left hover:bg-slate-50 ${n.read_at ? 'opacity-60' : ''}`}
                  onClick={() => {
                    if (!n.read_at) void markNotificationRead(n.id)
                    setOpen(false)
                    if (n.prospect_id) navigate(`/prospects/${n.prospect_id}`)
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {n.body && <p className="truncate text-xs text-slate-500">{n.body}</p>}
                      <p className="text-[11px] text-slate-400">{ago(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function Layout() {
  const { me, tasks, mode } = useStore()
  const today = todayStr()
  const dueCount = tasks.filter((t) => t.assigned_to === me?.id && !t.done_at && t.due_date <= today).length

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-slate-900 p-4 text-white md:flex">
        <div className="mb-6 flex items-center gap-2 px-1">
          <img src="/icon.svg" alt="" className="h-8 w-8" />
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </div>
        <NavLink to="/prospects/nouveau" className="btn btn-accent mb-5 w-full">
          <Plus size={16} /> Nouveau prospect
        </NavLink>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
              <n.icon size={18} />
              <span className="flex-1">{n.label}</span>
              {n.to === '/' && dueCount > 0 && (
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold">{dueCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <Avatar profile={me} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{me?.name ?? '…'}</p>
            <p className="text-xs text-slate-400">
              {me ? ROLE_LABEL[me.role] : ''} · {mode === 'local' ? 'démo locale' : 'partagé'}
            </p>
          </div>
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-slate-100/90 px-4 py-2 backdrop-blur md:justify-end">
          <div className="flex items-center gap-2 md:hidden">
            <img src="/icon.svg" alt="" className="h-7 w-7" />
            <span className="font-bold">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span className="hidden md:inline-flex">
              <Avatar profile={me} />
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.slice(0, 2).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
            <n.icon size={20} />
            {n.label}
          </NavLink>
        ))}
        <NavLink to="/prospects/nouveau" className="flex flex-col items-center justify-center py-1 text-[11px] text-slate-400">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow">
            <Plus size={22} />
          </span>
        </NavLink>
        {NAV.slice(2, 4).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
            <n.icon size={20} />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
