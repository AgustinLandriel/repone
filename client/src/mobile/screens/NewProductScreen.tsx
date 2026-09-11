import type { Provider } from '../../data/mockData'

type Props = {
  barcode: string
  name: string
  onNameChange: (v: string) => void
  providers: Provider[]
  providerId: number
  onProviderIdChange: (v: number) => void
  purchase: string
  onPurchaseChange: (v: string) => void
  sale: string
  onSaleChange: (v: string) => void
}

export function NewProductScreen({
  barcode,
  name,
  onNameChange,
  providers,
  providerId,
  onProviderIdChange,
  purchase,
  onPurchaseChange,
  sale,
  onSaleChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-xl border border-[#f5ddb8] bg-[var(--color-warning-bg)] px-3 py-2.5 text-xs text-[var(--color-warning)]">
        Código escaneado sin coincidencias: <span className="font-mono">{barcode}</span>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-[var(--color-text-secondary)]">Nombre del producto</span>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Yerba Mate 1kg"
          className="rounded-[10px] border border-[var(--color-border)] px-3 py-[11px] text-sm text-[var(--color-text)]"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-[var(--color-text-secondary)]">Proveedor</span>
        <select
          value={providerId}
          onChange={(e) => onProviderIdChange(Number(e.target.value))}
          className="rounded-[10px] border border-[var(--color-border)] bg-white px-3 py-[11px] text-sm text-[var(--color-text)]"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2.5">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-bold text-[var(--color-text-secondary)]">Precio compra est.</span>
          <input
            type="number"
            value={purchase}
            onChange={(e) => onPurchaseChange(e.target.value)}
            placeholder="$"
            className="rounded-[10px] border border-[var(--color-border)] px-3 py-[11px] text-sm text-[var(--color-text)]"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-bold text-[var(--color-text-secondary)]">Precio venta est.</span>
          <input
            type="number"
            value={sale}
            onChange={(e) => onSaleChange(e.target.value)}
            placeholder="$"
            className="rounded-[10px] border border-[var(--color-border)] px-3 py-[11px] text-sm text-[var(--color-text)]"
          />
        </label>
      </div>
    </div>
  )
}
