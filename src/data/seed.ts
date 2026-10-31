import type { Activity, MockupBrief, Notification, Profile, Prospect, Task } from '../lib/types'
import { plusDays } from '../lib/dates'

export interface LocalDb {
  profiles: Profile[]
  prospects: Prospect[]
  mockup_briefs: MockupBrief[]
  tasks: Task[]
  activities: Activity[]
  notifications: Notification[]
}

export const LOCAL_VENDEUR: Profile = { id: 'u-vendeur', name: 'Ton ami', role: 'vendeur', email: null, created_at: '2026-01-01T00:00:00.000Z' }
export const LOCAL_DEV: Profile = { id: 'u-dev', name: 'Toi', role: 'dev', email: null, created_at: '2026-01-01T00:00:00.000Z' }

const daysAgo = (n: number, hour = 10) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const baseProspect = (over: Partial<Prospect> & Pick<Prospect, 'id' | 'business_name' | 'status'>): Prospect => ({
  contact_name: null, phone: null, whatsapp: null, email: null, linkedin_url: null, instagram: null,
  website_url: null, google_url: null, niche: 'Kebab', city: null, owner_id: LOCAL_VENDEUR.id, channel: null,
  lost_reason: null, client_stage: null, notes: null, mockup_url: null, video_url: null, meeting_at: null,
  quote_amount: null, created_by: LOCAL_VENDEUR.id, created_at: daysAgo(5), updated_at: daysAgo(1),
  ...over,
})

export function seed(): LocalDb {
  const prospects: Prospect[] = [
    baseProspect({ id: 'p1', business_name: 'Kebab du Soleil', contact_name: 'Mehdi', city: 'Lyon', phone: '06 12 34 56 78', whatsapp: '0612345678', website_url: 'https://example.com/kebab-du-soleil', google_url: 'https://maps.google.com/?q=Kebab+du+Soleil', status: 'nouveau', created_at: daysAgo(0), updated_at: daysAgo(0) }),
    baseProspect({ id: 'p2', business_name: 'Istanbul Grill', contact_name: 'Ayşe', city: 'Villeurbanne', phone: '06 98 76 54 32', instagram: 'istanbul.grill', status: 'qualifie', notes: 'Site actuel fait sur Wix en 2019, pas de bouton commande.', created_at: daysAgo(2), updated_at: daysAgo(1) }),
    baseProspect({ id: 'p3', business_name: 'Le Bosphore', contact_name: 'Karim', city: 'Lyon 7', whatsapp: '0611223344', website_url: 'https://example.com/bosphore', status: 'maquette_demandee', owner_id: LOCAL_DEV.id, created_at: daysAgo(3), updated_at: daysAgo(0, 9) }),
    baseProspect({ id: 'p4', business_name: 'Antalya Kebab', contact_name: 'Serkan', city: 'Vénissieux', phone: '06 55 44 33 22', status: 'maquette_prete', mockup_url: 'https://antalya.votredomaine.fr', created_at: daysAgo(4), updated_at: daysAgo(0, 8) }),
    baseProspect({ id: 'p5', business_name: 'Chez Ali', contact_name: 'Ali', city: 'Lyon 3', whatsapp: '0677889900', status: 'contacte', channel: 'whatsapp', mockup_url: 'https://chezali.votredomaine.fr', created_at: daysAgo(6), updated_at: daysAgo(3) }),
    baseProspect({ id: 'p6', business_name: 'Marmara Food', contact_name: 'Hakan', city: 'Bron', phone: '06 10 20 30 40', status: 'en_attente', channel: 'telephone', mockup_url: 'https://marmara.votredomaine.fr', created_at: daysAgo(12), updated_at: daysAgo(5) }),
    baseProspect({ id: 'p7', business_name: 'Sultan Döner', contact_name: 'Emre', city: 'Lyon 8', whatsapp: '0633445566', status: 'rdv', channel: 'whatsapp', mockup_url: 'https://sultan.votredomaine.fr', meeting_at: plusDays(2) + 'T14:30:00.000Z', created_at: daysAgo(9), updated_at: daysAgo(1) }),
    baseProspect({ id: 'p8', business_name: 'Kebab Express', contact_name: 'Nadia', city: 'Lyon 2', phone: '06 44 55 66 77', status: 'gagne', channel: 'whatsapp', client_stage: 'en_production', owner_id: LOCAL_DEV.id, quote_amount: 500, mockup_url: 'https://kebabexpress.votredomaine.fr', created_at: daysAgo(20), updated_at: daysAgo(2) }),
    baseProspect({ id: 'p9', business_name: 'Grill House', contact_name: 'Youssef', city: 'Saint-Priest', status: 'perdu', channel: 'linkedin', lost_reason: 'sans_reponse', created_at: daysAgo(25), updated_at: daysAgo(4) }),
  ]

  const mockup_briefs: MockupBrief[] = [
    {
      id: 'b3', prospect_id: 'p3', logo_url: 'https://example.com/bosphore/logo.png', primary_color: '#c2410c', secondary_color: '#1c1917', variant: 'A',
      tagline: 'Le vrai kebab turc à Lyon 7', services: 'Kebab, dürüm, assiettes, menus étudiants, livraison', address: '12 rue de Marseille, 69007 Lyon',
      hours: 'Lun-Dim 11h-23h', photos: 'https://example.com/bosphore/1.jpg\nhttps://example.com/bosphore/2.jpg', reviews: '4,6 sur Google (312 avis)',
      extra_notes: 'Mettre en avant la livraison et le menu étudiant.', requested_by: LOCAL_VENDEUR.id, requested_at: daysAgo(0, 9), started_at: null, delivered_at: null, created_at: daysAgo(0, 9),
    },
    {
      id: 'b4', prospect_id: 'p4', logo_url: null, primary_color: '#dc2626', secondary_color: '#fbbf24', variant: 'B', tagline: 'Antalya Kebab, depuis 2008',
      services: 'Kebab, tacos, burgers, menus enfants', address: '4 avenue Jean Jaurès, 69200 Vénissieux', hours: 'Mar-Dim 11h30-22h30', photos: null,
      reviews: '4,3 sur Google (150 avis)', extra_notes: null, requested_by: LOCAL_VENDEUR.id, requested_at: daysAgo(2), started_at: daysAgo(1), delivered_at: daysAgo(0, 8), created_at: daysAgo(2),
    },
  ]

  const tasks: Task[] = [
    { id: 't1', prospect_id: 'p3', assigned_to: LOCAL_DEV.id, type: 'maquette', title: 'Maquette : Le Bosphore', due_date: plusDays(0), done_at: null, created_at: daysAgo(0, 9) },
    { id: 't2', prospect_id: 'p4', assigned_to: LOCAL_VENDEUR.id, type: 'video', title: 'Vidéo + envoi : Antalya Kebab', due_date: plusDays(0), done_at: null, created_at: daysAgo(0, 8) },
    { id: 't3', prospect_id: 'p5', assigned_to: LOCAL_VENDEUR.id, type: 'relance', title: 'Relance 1/3 : Chez Ali', due_date: plusDays(0), done_at: null, created_at: daysAgo(3) },
    { id: 't4', prospect_id: 'p5', assigned_to: LOCAL_VENDEUR.id, type: 'relance', title: 'Relance 2/3 : Chez Ali', due_date: plusDays(4), done_at: null, created_at: daysAgo(3) },
    { id: 't5', prospect_id: 'p5', assigned_to: LOCAL_VENDEUR.id, type: 'relance', title: 'Relance 3/3 : Chez Ali', due_date: plusDays(11), done_at: null, created_at: daysAgo(3) },
    { id: 't6', prospect_id: 'p6', assigned_to: LOCAL_VENDEUR.id, type: 'relance', title: 'Relance 1/3 : Marmara Food', due_date: plusDays(-2), done_at: daysAgo(2), created_at: daysAgo(5) },
    { id: 't7', prospect_id: 'p6', assigned_to: LOCAL_VENDEUR.id, type: 'relance', title: 'Relance 2/3 : Marmara Food', due_date: plusDays(-1), done_at: null, created_at: daysAgo(5) },
    { id: 't8', prospect_id: 'p6', assigned_to: LOCAL_VENDEUR.id, type: 'relance', title: 'Relance 3/3 : Marmara Food', due_date: plusDays(9), done_at: null, created_at: daysAgo(5) },
    { id: 't9', prospect_id: 'p7', assigned_to: LOCAL_VENDEUR.id, type: 'rdv', title: 'RDV : Sultan Döner', due_date: plusDays(2), done_at: null, created_at: daysAgo(1) },
    { id: 't10', prospect_id: 'p8', assigned_to: LOCAL_DEV.id, type: 'autre', title: 'Mettre en ligne : Kebab Express', due_date: plusDays(3), done_at: null, created_at: daysAgo(2) },
  ]

  const act = (id: string, prospect_id: string, user_id: string, type: Activity['type'], content: string, created_at: string, status_to: Activity['status_to'] = null): Activity =>
    ({ id, prospect_id, user_id, type, content, status_to, created_at })

  const activities: Activity[] = [
    act('a1', 'p1', LOCAL_VENDEUR.id, 'statut', 'Prospect créé', daysAgo(0), 'nouveau'),
    act('a2', 'p2', LOCAL_VENDEUR.id, 'statut', 'Prospect créé', daysAgo(2), 'nouveau'),
    act('a3', 'p2', LOCAL_VENDEUR.id, 'statut', 'Nouveau → Qualifié', daysAgo(1), 'qualifie'),
    act('a4', 'p3', LOCAL_VENDEUR.id, 'statut', 'Prospect créé', daysAgo(3), 'nouveau'),
    act('a5', 'p3', LOCAL_VENDEUR.id, 'statut', 'Nouveau → Qualifié', daysAgo(2), 'qualifie'),
    act('a6', 'p3', LOCAL_VENDEUR.id, 'statut', 'Qualifié → Maquette demandée', daysAgo(0, 9), 'maquette_demandee'),
    act('a7', 'p4', LOCAL_DEV.id, 'statut', 'Maquette en cours → Maquette prête', daysAgo(0, 8), 'maquette_prete'),
    act('a8', 'p5', LOCAL_VENDEUR.id, 'video', 'Appel + vidéo envoyée par WhatsApp', daysAgo(3), null),
    act('a9', 'p5', LOCAL_VENDEUR.id, 'statut', 'Maquette prête → Contacté', daysAgo(3), 'contacte'),
    act('a10', 'p6', LOCAL_VENDEUR.id, 'statut', 'Maquette prête → Contacté', daysAgo(5), 'contacte'),
    act('a11', 'p6', LOCAL_VENDEUR.id, 'relance', 'Relance faite (Relance 1/3)', daysAgo(2), null),
    act('a12', 'p6', LOCAL_VENDEUR.id, 'statut', 'Contacté → En attente', daysAgo(2), 'en_attente'),
    act('a13', 'p7', LOCAL_VENDEUR.id, 'statut', 'Maquette prête → Contacté', daysAgo(6), 'contacte'),
    act('a14', 'p7', LOCAL_VENDEUR.id, 'reponse', 'A répondu sur WhatsApp, intéressé, veut un RDV', daysAgo(1), null),
    act('a15', 'p7', LOCAL_VENDEUR.id, 'statut', 'Contacté → Rendez-vous', daysAgo(1), 'rdv'),
    act('a16', 'p8', LOCAL_VENDEUR.id, 'statut', 'Maquette prête → Contacté', daysAgo(15), 'contacte'),
    act('a17', 'p8', LOCAL_VENDEUR.id, 'statut', 'Contacté → Rendez-vous', daysAgo(10), 'rdv'),
    act('a18', 'p8', LOCAL_VENDEUR.id, 'statut', 'Rendez-vous → Devis envoyé', daysAgo(8), 'devis_envoye'),
    act('a19', 'p8', LOCAL_VENDEUR.id, 'statut', 'Devis envoyé → Gagné', daysAgo(5), 'gagne'),
    act('a20', 'p9', LOCAL_VENDEUR.id, 'statut', 'Maquette prête → Contacté', daysAgo(20), 'contacte'),
    act('a21', 'p9', LOCAL_VENDEUR.id, 'statut', 'En attente → Perdu (Sans réponse)', daysAgo(4), 'perdu'),
  ]

  const notifications: Notification[] = [
    { id: 'n1', user_id: LOCAL_DEV.id, prospect_id: 'p3', title: 'Maquette demandée : Le Bosphore', body: 'Le brief est rempli, à toi de jouer.', read_at: null, created_at: daysAgo(0, 9) },
    { id: 'n2', user_id: LOCAL_VENDEUR.id, prospect_id: 'p4', title: 'Maquette prête : Antalya Kebab', body: 'https://antalya.votredomaine.fr', read_at: null, created_at: daysAgo(0, 8) },
    { id: 'n3', user_id: LOCAL_DEV.id, prospect_id: 'p7', title: 'RDV pris : Sultan Döner', body: 'Réponse positive sur WhatsApp.', read_at: daysAgo(1), created_at: daysAgo(1) },
  ]

  return { profiles: [LOCAL_VENDEUR, LOCAL_DEV], prospects, mockup_briefs, tasks, activities, notifications }
}
