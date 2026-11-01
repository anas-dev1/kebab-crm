import type { ActivityType, Channel, ClientStage, LostReason, Role, Status, TaskType } from './types'

export const APP_NAME = 'Kebab CRM'
// Chemin de l'icône, valable aussi quand l'appli est servie sous un sous-dossier (GitHub Pages).
export const ICON_URL = `${import.meta.env.BASE_URL}icon.svg`

export const STATUS_ORDER: Status[] = [
  'nouveau', 'qualifie', 'maquette_demandee', 'maquette_en_cours', 'maquette_prete',
  'contacte', 'en_attente', 'rdv', 'devis_envoye', 'gagne', 'perdu',
]

export const STATUS: Record<Status, { label: string; hint: string; color: string; dot: string; owner: Role }> = {
  nouveau: { label: 'Nouveau', hint: 'Ajouté, à qualifier', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', owner: 'vendeur' },
  qualifie: { label: 'Qualifié', hint: 'Vrai besoin, décideur joignable', color: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500', owner: 'vendeur' },
  maquette_demandee: { label: 'Maquette demandée', hint: 'Brief envoyé au dev', color: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500', owner: 'dev' },
  maquette_en_cours: { label: 'Maquette en cours', hint: 'Le dev travaille dessus', color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500', owner: 'dev' },
  maquette_prete: { label: 'Maquette prête', hint: 'Vidéo à faire', color: 'bg-fuchsia-100 text-fuchsia-800', dot: 'bg-fuchsia-500', owner: 'vendeur' },
  contacte: { label: 'Contacté', hint: 'Vidéo envoyée, relances programmées', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', owner: 'vendeur' },
  en_attente: { label: 'En attente', hint: 'Relancé, toujours pas de réponse', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500', owner: 'vendeur' },
  rdv: { label: 'Rendez-vous', hint: 'RDV planifié', color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', owner: 'vendeur' },
  devis_envoye: { label: 'Devis envoyé', hint: 'En attente de signature', color: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500', owner: 'vendeur' },
  gagne: { label: 'Gagné', hint: 'Client signé', color: 'bg-green-600 text-white', dot: 'bg-green-600', owner: 'dev' },
  perdu: { label: 'Perdu', hint: 'Avec motif', color: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500', owner: 'vendeur' },
}

export const OPEN_STATUSES: Status[] = STATUS_ORDER.filter((s) => s !== 'gagne' && s !== 'perdu')

export const CHANNELS: Record<Channel, string> = {
  telephone: 'Téléphone', whatsapp: 'WhatsApp', linkedin: 'LinkedIn', instagram: 'Instagram', email: 'Email', sms: 'SMS', autre: 'Autre',
}

export const LOST_REASONS: Record<LostReason, string> = {
  sans_reponse: 'Sans réponse', pas_interesse: 'Pas intéressé', trop_cher: 'Trop cher', a_deja_quelquun: "A déjà quelqu'un", autre: 'Autre',
}

export const CLIENT_STAGE_ORDER: ClientStage[] = ['elements_a_recevoir', 'en_production', 'livre', 'abonne']
export const CLIENT_STAGES: Record<ClientStage, string> = {
  elements_a_recevoir: 'Éléments à recevoir', en_production: 'En production', livre: 'Livré', abonne: 'Abonné',
}

export const TASK_TYPES: Record<TaskType, string> = {
  relance: 'Relance', maquette: 'Maquette', video: 'Vidéo', appel: 'Appel', rdv: 'Rendez-vous', autre: 'Tâche',
}

export const ACTIVITY_TYPES: Record<ActivityType, string> = {
  note: 'Note', appel: 'Appel', video: 'Vidéo envoyée', reponse: 'Réponse reçue', statut: 'Statut',
  relance: 'Relance', rdv: 'Rendez-vous', maquette: 'Maquette', autre: 'Autre',
}

export const ROLE_LABEL: Record<Role, string> = { vendeur: 'Vendeur', dev: 'Dev' }

export const RELANCE_DAYS = [3, 7, 14]
export const MONTHLY_FEE = 39
