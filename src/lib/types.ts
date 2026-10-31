export type Role = 'vendeur' | 'dev'

export interface Profile {
  id: string
  name: string
  role: Role
  email: string | null
  created_at: string
}

export type Status =
  | 'nouveau'
  | 'qualifie'
  | 'maquette_demandee'
  | 'maquette_en_cours'
  | 'maquette_prete'
  | 'contacte'
  | 'en_attente'
  | 'rdv'
  | 'devis_envoye'
  | 'gagne'
  | 'perdu'

export type Channel = 'telephone' | 'whatsapp' | 'linkedin' | 'instagram' | 'email' | 'sms' | 'autre'
export type LostReason = 'sans_reponse' | 'pas_interesse' | 'trop_cher' | 'a_deja_quelquun' | 'autre'
export type ClientStage = 'elements_a_recevoir' | 'en_production' | 'livre' | 'abonne'

export interface Prospect {
  id: string
  business_name: string
  contact_name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  linkedin_url: string | null
  instagram: string | null
  website_url: string | null
  google_url: string | null
  niche: string | null
  city: string | null
  status: Status
  owner_id: string | null
  channel: Channel | null
  lost_reason: LostReason | null
  client_stage: ClientStage | null
  notes: string | null
  mockup_url: string | null
  video_url: string | null
  meeting_at: string | null
  quote_amount: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface MockupBrief {
  id: string
  prospect_id: string
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  variant: string | null
  tagline: string | null
  services: string | null
  address: string | null
  hours: string | null
  photos: string | null
  reviews: string | null
  extra_notes: string | null
  requested_by: string | null
  requested_at: string | null
  started_at: string | null
  delivered_at: string | null
  created_at: string
}

export type TaskType = 'relance' | 'maquette' | 'video' | 'appel' | 'rdv' | 'autre'

export interface Task {
  id: string
  prospect_id: string
  assigned_to: string | null
  type: TaskType
  title: string
  due_date: string
  done_at: string | null
  created_at: string
}

export type ActivityType = 'note' | 'appel' | 'video' | 'reponse' | 'statut' | 'relance' | 'rdv' | 'maquette' | 'autre'

export interface Activity {
  id: string
  prospect_id: string
  user_id: string | null
  type: ActivityType
  content: string | null
  status_to: Status | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  prospect_id: string | null
  title: string
  body: string | null
  read_at: string | null
  created_at: string
}

export interface Tables {
  profiles: Profile
  prospects: Prospect
  mockup_briefs: MockupBrief
  tasks: Task
  activities: Activity
  notifications: Notification
}
export type TableName = keyof Tables
