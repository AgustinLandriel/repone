type Props = {
  scanMode: 'existing' | 'new'
  onSetScanMode: (mode: 'existing' | 'new') => void
}

export function ScanScreen({ scanMode, onSetScanMode }: Props) {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="relative flex h-[250px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#1c1c1e]">
        <svg width="150" height="52" viewBox="0 0 150 52" opacity={0.55}>
          {[2, 9, 14, 22, 28, 33, 40, 48, 53, 59, 66, 71, 79, 85, 90, 97, 105, 110, 116, 123, 131, 136, 142, 147].map((x, i) => (
            <rect key={x} x={x} y={4} width={i % 3 === 0 ? 4 : i % 2 === 0 ? 2 : 1.5} height={44} fill="#ffffff" />
          ))}
        </svg>
        {(['left-top', 'right-top', 'left-bottom', 'right-bottom'] as const).map((corner) => (
          <div
            key={corner}
            className="absolute h-[26px] w-[26px]"
            style={{
              [corner.includes('left') ? 'left' : 'right']: 24,
              [corner.includes('top') ? 'top' : 'bottom']: 22,
              borderTop: corner.includes('top') ? '3px solid var(--color-accent)' : undefined,
              borderBottom: corner.includes('bottom') ? '3px solid var(--color-accent)' : undefined,
              borderLeft: corner.includes('left') ? '3px solid var(--color-accent)' : undefined,
              borderRight: corner.includes('right') ? '3px solid var(--color-accent)' : undefined,
              borderRadius: 4,
            }}
          />
        ))}
        <div className="absolute left-6 right-6 top-1/2 h-0.5 animate-pulse bg-[var(--color-accent)]" />
      </div>
      <div className="text-center text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]">
        Apuntá la cámara al código de barras del producto
      </div>

      <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          Modo demo — resultado del escaneo
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSetScanMode('existing')}
            className="flex-1 rounded-[9px] border py-2.5 text-[12.5px] font-bold"
            style={
              scanMode === 'existing'
                ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: '#fff' }
                : { background: '#fff', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }
            }
          >
            Producto existente
          </button>
          <button
            onClick={() => onSetScanMode('new')}
            className="flex-1 rounded-[9px] border py-2.5 text-[12.5px] font-bold"
            style={
              scanMode === 'new'
                ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: '#fff' }
                : { background: '#fff', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }
            }
          >
            Producto nuevo
          </button>
        </div>
      </div>
    </div>
  )
}
