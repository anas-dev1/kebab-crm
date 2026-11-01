# Kebab CRM

Mini CRM à deux pour vendre des sites web : le vendeur trouve et qualifie les prospects, demande une maquette, envoie la vidéo et relance ; le dev reçoit les briefs, livre les maquettes et produit les sites vendus.

## Lancer en local (mode démo)

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173. Sans configuration Supabase, l'appli tourne en **mode démo local** : deux comptes fictifs (vendeur / dev), des données d'exemple, tout reste dans le navigateur. Pratique pour tester le fonctionnement. Le bouton « Réinitialiser la démo » dans Réglages remet les données d'exemple.

## Passer en mode partagé (vous deux, en temps réel)

1. Crée un projet gratuit sur https://supabase.com (région EU de préférence).
2. Dans le projet : **SQL Editor > New query**, colle le contenu de `supabase/schema.sql`, puis **Run**.
3. Dans **Project Settings > API**, récupère l'URL du projet et la clé `anon public`.
4. À la racine du projet, crée un fichier `.env` :

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

5. Relance `npm run dev`. L'écran de connexion propose maintenant « Créer un compte » : créez vos deux comptes, un avec le rôle **Vendeur**, un avec le rôle **Dev**.
   - Si Supabase demande une confirmation par email, cliquez sur le lien reçu, ou désactivez **Confirm email** dans Authentication > Providers > Email.
6. Une fois vos deux comptes créés, désactive les inscriptions : **Authentication > Providers > Email > Allow new users to sign up** (off). Toute personne connectée voit tout, donc personne d'autre ne doit pouvoir s'inscrire.

## Mettre en ligne (pour y accéder depuis n'importe quel PC)

### GitHub Pages (en place)

Chaque push sur `master` déclenche `.github/workflows/deploy.yml`, qui construit l'appli avec `BASE_PATH=/kebab-crm/` et la publie sur https://anas-dev1.github.io/kebab-crm/. Pour passer en mode partagé, ajoute les deux secrets du dépôt (**Settings > Secrets and variables > Actions**) : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, puis relance le workflow. Sans ces secrets, le site en ligne tourne en mode démo.

### Vercel ou Netlify

L'appli est un site statique. Sur Vercel ou Netlify : importe le dossier (ou le dépôt Git), commande de build `npm run build`, dossier de sortie `dist`, et ajoute les deux variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Pour les routes (`/pipeline`, `/prospects/...`), configure une réécriture de toutes les URL vers `index.html` :

- Vercel : fichier `vercel.json` avec `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- Netlify : fichier `public/_redirects` contenant `/* /index.html 200`

L'appli est installable (PWA) : dans Chrome, icône « Installer » dans la barre d'adresse.

## Comment ça marche

### Les statuts du pipeline

Les tâches sont attribuées **à la personne**, pas au rôle : chacun peut prospecter, envoyer des vidéos et relancer. Un prospect appartient à celui qui le crée ; les tâches commerciales vont à celui qui fait l'action ; la maquette va au compte « Dev » et, une fois prête, le prospect revient à celui qui l'avait demandée.

| Statut | Qui a la main | Ce qui se passe automatiquement |
|---|---|---|
| Nouveau | Le créateur | — |
| Qualifié | Celui qui qualifie | — |
| Maquette demandée | Dev | Le brief est enregistré, tâche « Maquette » pour le dev, notification au dev |
| Maquette en cours | Dev | — |
| Maquette prête | Celui qui a demandé la maquette | Tâche « Vidéo + envoi » et notification pour lui |
| Contacté | Celui qui a envoyé la vidéo | 3 relances créées pour lui à J+3, J+7, J+14 |
| En attente | Idem | Passage automatique après la première relance faite |
| Rendez-vous | Celui qui a pris le RDV | Relances annulées, tâche RDV, notification à l'autre |
| Devis envoyé | Idem | Relances annulées, une relance devis à J+3 |
| Gagné | Dev | Toutes les tâches annulées, étape client « Éléments à recevoir », notification au dev |
| Perdu | — | Toutes les tâches annulées, motif obligatoire |

Une **réponse reçue** (bouton sur la fiche) annule les relances restantes et prévient l'autre personne.

Toute tâche en attente peut être **confiée à l'autre** (bouton ⇄ sur la tâche, dans Aujourd'hui, Semaine et la fiche) : elle change de personne, le prospect la suit, et l'autre reçoit une notification. Il n'y a jamais deux tâches « Vidéo + envoi » en attente pour un même prospect, donc jamais deux vidéos pour le même patron.

### Les écrans

- **Aujourd'hui** : mes tâches du jour et en retard, les 7 prochains jours, ce que j'ai fait aujourd'hui, ce qui est chez l'autre.
- **Semaine** : grille lundi → dimanche avec les tâches à faire (cochables), celles faites et les événements marquants (vidéo envoyée, réponse, RDV, devis, gagné, perdu). Filtre moi / l'autre / les deux, bandeau des retards, détail d'un jour au clic, bilan chiffré par personne et jauges d'objectifs hebdo (dérivés du rythme choisi dans Réglages). Chaque tâche peut être déplacée à un autre jour.
- **Planifier** : liste des prospects sans vidéo prévue. On en coche quelques-uns et on choisit un jour et une personne, ou on clique sur « Répartir automatiquement » (N par jour, à partir de telle date, jours ouvrés ou non) : chaque prospect reçoit une tâche « Vidéo + envoi » datée, visible dans Aujourd'hui, Semaine et sa fiche. Cocher « Fait » sur cette tâche passe le prospect en « Contacté » avec ses relances.
- **Réglages > Rythme** : vidéos par jour, jours travaillés, prospects par semaine. Propres à l'appareil (localStorage), ils servent de valeurs par défaut à Planifier et d'objectifs à Semaine.
- **Pipeline** : colonnes par statut, filtres par niche et par personne. Vue liste sur mobile.
- **Fiche prospect** : prochaine étape (boutons selon le statut), tâches, journal, infos, brief de maquette, liens maquette et vidéo.
- **Clients** : les prospects gagnés, par étape de production, avec le récurrent mensuel.
- **Stats** : entonnoir contactés → répondu → RDV → devis → vendus, par canal et par niche, motifs de perte.

### Notifications

Chaque passage de relais crée une notification dans l'appli (cloche en haut à droite). Si tu actives les notifications du navigateur (bouton sur Aujourd'hui), tu reçois aussi une alerte système quand l'onglet est ouvert, même en arrière-plan.

## Structure du code

```
src/
  lib/        types, statuts, dates, calcul des stats
  data/       couche de données : repo local (localStorage) / Supabase, store React (toute la logique métier)
  components/ layout, formulaires prospect et brief, petits composants UI
  pages/      Aujourd'hui, Pipeline, Nouveau prospect, Fiche prospect, Clients, Stats, Réglages, Connexion
supabase/
  schema.sql  tables, sécurité, temps réel
```

Les règles métier (relances, notifications, passage de relais) sont toutes dans `src/data/store.tsx`, fonction `setStatus`. Les délais de relance sont dans `src/lib/status.ts` (`RELANCE_DAYS`), le montant de l'abonnement aussi (`MONTHLY_FEE`).
