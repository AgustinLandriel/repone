type Props = {
  name: string
  onNameChange: (v: string) => void
}

export function NewProviderScreen({ name, onNameChange }: Props) {
  return (
    <div className="flex flex-col gap-3.5">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-[var(--color-text-secondary)]">Nombre del proveedor</span>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Distribuidora Norte"
          autoFocus
          className="rounded-[10px] border border-[var(--color-border)] px-3 py-[11px] text-sm text-[var(--color-text)]"
        />
      </label>
    </div>
  )
}
