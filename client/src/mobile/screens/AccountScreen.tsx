import type { AuthUser } from '../../api'
import { LogoutIcon } from '../../components/icons'

const ROLE_LABEL: Record<AuthUser['role'], string> = {
  owner: 'Dueño / encargado',
  employee: 'Empleado',
}

export function AccountScreen({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
        <Row label="Email" value={user.email} />
        <Row label="Rol" value={ROLE_LABEL[user.role]} />
      </div>

      <button
        onClick={onLogout}
        className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 text-[13.5px] font-bold text-[var(--color-text)]"
      >
        <LogoutIcon size={16} />
        Cerrar sesión
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="font-bold text-[var(--color-text)]">{value}</span>
    </div>
  )
}
