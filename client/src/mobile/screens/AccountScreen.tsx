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
        <Row label="Comercio" value={user.businessName} />
        <Row label="Email" value={user.email} />
        <Row label="Rol" value={ROLE_LABEL[user.role]} />
      </div>

      <div className="flex flex-col gap-2 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
        <div className="text-[12.5px] font-bold text-[var(--color-text)]">Código de invitación</div>
        <div className="text-[11.5px] leading-relaxed text-[var(--color-text-muted)]">
          Compartilo con tu equipo para que se sumen a este comercio.
        </div>
        <div className="self-start rounded-lg bg-[var(--color-bg)] px-3 py-2 font-mono text-[15px] font-bold tracking-wider text-[var(--color-text)]">
          {user.inviteCode}
        </div>
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
