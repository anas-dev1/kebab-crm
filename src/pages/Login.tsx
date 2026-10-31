import { useState, type FormEvent } from 'react'
import { repo } from '../data'
import { APP_NAME } from '../lib/status'
import { Field } from '../components/ui'
import type { Role } from '../lib/types'

export function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('vendeur')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'signin') await repo.signIn(email, password)
      else {
        await repo.signUp(email, password, name, role)
        setInfo('Compte créé. Si Supabase demande une confirmation par email, clique sur le lien reçu puis connecte-toi.')
        setMode('signin')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <img src="/icon.svg" alt="" className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-bold">{APP_NAME}</h1>
            <p className="text-sm text-slate-500">Prospection à deux : maquettes, vidéos, relances.</p>
          </div>
        </div>

        {repo.mode === 'local' ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Mode démo local.</span> Les données restent dans ce navigateur. Pour travailler à deux,
              configure Supabase (voir le fichier README).
            </p>
            <button type="button" className="btn btn-accent w-full" onClick={() => void repo.signIn('vendeur', '')}>
              Vendeur (Thiffen)
            </button>
            <button type="button" className="btn btn-primary w-full" onClick={() => void repo.signIn('dev', '')}>
              Dev (Anas)
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex rounded-lg bg-slate-100 p-1 text-sm">
              <button type="button" className={`flex-1 rounded-md py-1.5 ${mode === 'signin' ? 'bg-white shadow-sm' : 'text-slate-500'}`} onClick={() => setMode('signin')}>
                Connexion
              </button>
              <button type="button" className={`flex-1 rounded-md py-1.5 ${mode === 'signup' ? 'bg-white shadow-sm' : 'text-slate-500'}`} onClick={() => setMode('signup')}>
                Créer un compte
              </button>
            </div>
            {mode === 'signup' && (
              <>
                <Field label="Prénom">
                  <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Rôle">
                  <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                    <option value="vendeur">Vendeur (prospection, vidéos, relances)</option>
                    <option value="dev">Dev (maquettes, production)</option>
                  </select>
                </Field>
              </>
            )}
            <Field label="Email">
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Mot de passe">
              <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            {info && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {mode === 'signin' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
