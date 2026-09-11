import { ScanFrameIcon, TruckIcon } from '../../components/icons'
import type { Provider } from '../../data/mockData'

type Props = {
  providers: Provider[]
  onScan: () => void
  onSelectProvider: (id: number) => void
}

export function HomeScreen({ providers, onScan, onSelectProvider }: Props) {
  return (
    <div className="flex flex-col gap-[22px]">
      <button
        onClick={onScan}
        className="flex items-center gap-3.5 rounded-2xl bg-[var(--color-accent)] p-5 text-left"
      >
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
          <ScanFrameIcon className="text-white" />
        </div>
        <div>
          <div className="text-[15.5px] font-bold text-white">Escanear producto</div>
          <div className="mt-0.5 text-xs text-white/75">Tomar stock o cargar uno nuevo</div>
        </div>
      </button>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <div className="text-[13px] font-bold text-[var(--color-text)]">Proveedores</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">{providers.length}</div>
        </div>
        <div className="flex flex-col gap-2.5">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectProvider(p.id)}
              className="flex items-center gap-3 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 text-left"
            >
              <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#f0efea]">
                <TruckIcon className="text-[var(--color-text-secondary)]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[var(--color-text)]">{p.name}</div>
                <div className="mt-px text-[11.5px] text-[var(--color-text-muted)]">{p.productCount} productos</div>
              </div>
              <div
                className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={
                  p.pending
                    ? { background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }
                    : { background: 'var(--color-success-bg)', color: 'var(--color-success)' }
                }
              >
                {p.pending ? 'Pendiente' : 'Al día'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
