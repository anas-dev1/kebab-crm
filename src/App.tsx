import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './data/store'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Today } from './pages/Today'
import { Pipeline } from './pages/Pipeline'
import { ProspectNew } from './pages/ProspectNew'
import { ProspectDetail } from './pages/ProspectDetail'
import { Clients } from './pages/Clients'
import { Stats } from './pages/Stats'
import { Settings } from './pages/Settings'

function Splash({ text }: { text: string }) {
  return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">{text}</div>
}

export default function App() {
  const { user, me, loading, error } = useStore()

  if (user === undefined) return <Splash text="Chargement…" />
  if (user === null) return <Login />
  if (loading && !me) return <Splash text="Chargement des données…" />
  if (error && !me) return <Splash text={`Erreur : ${error}`} />
  if (!me) return <Splash text="Profil introuvable. Vérifie que le schéma SQL a bien été exécuté dans Supabase." />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="prospects/nouveau" element={<ProspectNew />} />
        <Route path="prospects/:id" element={<ProspectDetail />} />
        <Route path="clients" element={<Clients />} />
        <Route path="stats" element={<Stats />} />
        <Route path="reglages" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
