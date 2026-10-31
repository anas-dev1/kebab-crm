import type { Activity, MockupBrief, Notification, Profile, Prospect, Role, TableName, Tables, Task } from '../lib/types'

export interface AuthUser {
  id: string
  email: string | null
}

export interface Snapshot {
  profiles: Profile[]
  prospects: Prospect[]
  briefs: MockupBrief[]
  tasks: Task[]
  activities: Activity[]
  notifications: Notification[]
}

export const EMPTY_SNAPSHOT: Snapshot = { profiles: [], prospects: [], briefs: [], tasks: [], activities: [], notifications: [] }

export type NewRow<K extends TableName> = Omit<Tables[K], 'id' | 'created_at'> & Partial<Pick<Tables[K], 'id' | 'created_at'>>

export interface Repo {
  mode: 'local' | 'supabase'
  getUser(): Promise<AuthUser | null>
  onAuthChange(cb: (user: AuthUser | null) => void): () => void
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string, name: string, role: Role): Promise<void>
  signOut(): Promise<void>
  loadAll(): Promise<Snapshot>
  insert<K extends TableName>(table: K, row: NewRow<K>): Promise<Tables[K]>
  update<K extends TableName>(table: K, id: string, patch: Partial<Tables[K]>): Promise<void>
  remove(table: TableName, id: string): Promise<void>
  subscribe(cb: () => void): () => void
}
