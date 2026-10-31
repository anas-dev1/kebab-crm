import type { AuthUser, NewRow, Repo, Snapshot } from './repo'
import type { Role, TableName, Tables } from '../lib/types'
import { LOCAL_DEV, LOCAL_VENDEUR, seed, type LocalDb } from './seed'
import { nowIso } from '../lib/dates'

const DB_KEY = 'kebab-crm-db'
const USER_KEY = 'kebab-crm-user'

const listeners = new Set<() => void>()
const authListeners = new Set<(u: AuthUser | null) => void>()

function readDb(): LocalDb {
  const raw = localStorage.getItem(DB_KEY)
  if (raw) return migrate(JSON.parse(raw) as LocalDb)
  const db = seed()
  localStorage.setItem(DB_KEY, JSON.stringify(db))
  return db
}

// Les anciennes démos avaient des noms génériques : on les remplace par les prénoms actuels.
const OLD_NAMES = new Set(['Ton ami', 'Toi'])
function migrate(db: LocalDb): LocalDb {
  let changed = false
  for (const ref of [LOCAL_VENDEUR, LOCAL_DEV]) {
    const prof = db.profiles.find((x) => x.id === ref.id)
    if (prof && OLD_NAMES.has(prof.name)) {
      prof.name = ref.name
      changed = true
    }
  }
  if (changed) localStorage.setItem(DB_KEY, JSON.stringify(db))
  return db
}

function writeDb(db: LocalDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
  listeners.forEach((l) => l())
}

function currentUser(): AuthUser | null {
  const id = localStorage.getItem(USER_KEY)
  return id ? { id, email: null } : null
}

function rows<K extends TableName>(db: LocalDb, table: K): Tables[K][] {
  return db[table] as unknown as Tables[K][]
}

export function resetLocalDb() {
  localStorage.removeItem(DB_KEY)
  writeDb(seed())
}

async function signIn(role: string) {
  const id = role === 'dev' ? LOCAL_DEV.id : LOCAL_VENDEUR.id
  localStorage.setItem(USER_KEY, id)
  authListeners.forEach((cb) => cb({ id, email: null }))
}

export const localRepo: Repo = {
  mode: 'local',
  async getUser() {
    return currentUser()
  },
  onAuthChange(cb) {
    authListeners.add(cb)
    return () => {
      authListeners.delete(cb)
    }
  },
  signIn: (email) => signIn(email),
  signUp: (_email, _password, _name, role: Role) => signIn(role),
  async signOut() {
    localStorage.removeItem(USER_KEY)
    authListeners.forEach((cb) => cb(null))
  },
  async loadAll(): Promise<Snapshot> {
    const db = readDb()
    return {
      profiles: db.profiles,
      prospects: db.prospects,
      briefs: db.mockup_briefs,
      tasks: db.tasks,
      activities: db.activities,
      notifications: db.notifications,
    }
  },
  async insert<K extends TableName>(table: K, row: NewRow<K>): Promise<Tables[K]> {
    const db = readDb()
    const full = { id: crypto.randomUUID(), created_at: nowIso(), ...row } as Tables[K]
    rows(db, table).push(full)
    writeDb(db)
    return full
  },
  async update<K extends TableName>(table: K, id: string, patch: Partial<Tables[K]>) {
    const db = readDb()
    const list = rows(db, table)
    const i = list.findIndex((r) => r.id === id)
    if (i >= 0) list[i] = { ...list[i], ...patch }
    writeDb(db)
  },
  async remove(table, id) {
    const db = readDb()
    const keep = <T extends { id: string }>(list: T[]) => list.filter((r) => r.id !== id)
    switch (table) {
      case 'profiles': db.profiles = keep(db.profiles); break
      case 'prospects':
        db.prospects = keep(db.prospects)
        db.mockup_briefs = db.mockup_briefs.filter((b) => b.prospect_id !== id)
        db.tasks = db.tasks.filter((t) => t.prospect_id !== id)
        db.activities = db.activities.filter((a) => a.prospect_id !== id)
        db.notifications = db.notifications.filter((n) => n.prospect_id !== id)
        break
      case 'mockup_briefs': db.mockup_briefs = keep(db.mockup_briefs); break
      case 'tasks': db.tasks = keep(db.tasks); break
      case 'activities': db.activities = keep(db.activities); break
      case 'notifications': db.notifications = keep(db.notifications); break
    }
    writeDb(db)
  },
  subscribe(cb) {
    listeners.add(cb)
    const onStorage = (e: StorageEvent) => {
      if (e.key === DB_KEY) cb()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', onStorage)
    }
  },
}
