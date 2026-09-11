import { useState } from 'react'
import { GoogleIcon, PackageIcon } from '../../components/icons'
import { login, register, type AuthUser, type Role } from '../../api'

type EmailMode = 'login' | 'register'

export function LoginScreen({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailMode, setEmailMode] = useState<EmailMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('owner')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = emailMode === 'login' ? await login(email, password) : await register(email, password, role)
      onLogin(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 overflow-y-auto bg-gradient-to-b from-[#1c1c1e] to-[#111214] p-8">
      <div className="flex flex-col items-center gap-3.5">
        <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[var(--color-accent)]">
          <PackageIcon size={30} className="text-white" />
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-white">Reponé</div>
        <div className="max-w-[230px] text-center text-[13.5px] leading-snug text-[#9a9aa0]">
          Inventario y pedidos a proveedores, directo desde el celular
        </div>
      </div>

      <div className="flex w-full max-w-[280px] flex-col gap-3.5">
        <button
          type="button"
          disabled
          title="Continuar con Google todavía no está disponible"
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-white/60 px-[18px] py-[13px] text-[14.5px] font-semibold text-[var(--color-text)] opacity-60"
        >
          <GoogleIcon />
          Continuar con Google (próximamente)
        </button>

        {!showEmailForm && (
          <button onClick={() => setShowEmailForm(true)} className="text-center text-[12.5px] font-semibold text-[#c7c7cc] underline underline-offset-2">
            Usar email y contraseña
          </button>
        )}

        {showEmailForm && (
          <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl bg-white p-4">
            <div className="flex gap-1 rounded-lg bg-[var(--color-bg)] p-1">
              <button
                type="button"
                onClick={() => setEmailMode('login')}
                className="flex-1 rounded-md py-1.5 text-[12.5px] font-bold"
                style={emailMode === 'login' ? { background: 'white', color: 'var(--color-text)' } : { color: 'var(--color-text-muted)' }}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => setEmailMode('register')}
                className="flex-1 rounded-md py-1.5 text-[12.5px] font-bold"
                style={emailMode === 'register' ? { background: 'white', color: 'var(--color-text)' } : { color: 'var(--color-text-muted)' }}
              >
                Crear cuenta
              </button>
            </div>

            <label className="flex flex-col gap-1.5 text-left">
              <span className="text-[11.5px] font-bold text-[var(--color-text-secondary)]">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-text)]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-left">
              <span className="text-[11.5px] font-bold text-[var(--color-text-secondary)]">Contraseña</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-text)]"
              />
            </label>

            {emailMode === 'register' && (
              <label className="flex flex-col gap-1.5 text-left">
                <span className="text-[11.5px] font-bold text-[var(--color-text-secondary)]">Rol</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text)]"
                >
                  <option value="owner">Dueño / encargado</option>
                  <option value="employee">Empleado</option>
                </select>
              </label>
            )}

            {error && <div className="text-[12px] font-semibold text-red-600">{error}</div>}

            <button type="submit" disabled={submitting} className="mt-1 w-full rounded-lg bg-[var(--color-accent)] py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {submitting ? 'Un momento…' : emailMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>

            <button type="button" onClick={() => setShowEmailForm(false)} className="text-[12px] font-semibold text-[var(--color-text-muted)]">
              ‹ Volver
            </button>
          </form>
        )}
      </div>

      <div className="text-[11.5px] text-[#5b5b60]">Acceso restringido a tu comercio</div>
    </div>
  )
}
