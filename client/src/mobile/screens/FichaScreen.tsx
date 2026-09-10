import { fmtMoney, type CurrentProduct } from '../../data/mockData'

type Props = {
  product: CurrentProduct | null
  stockCount: string
  onStockCountChange: (value: string) => void
}

export function FichaScreen({ product, stockCount, onStockCountChange }: Props) {
  if (!product) return null

  return (
    <div className="flex flex-col gap-4">
      {product.isNew && (
        <div className="self-start rounded-full bg-[var(--color-warning-bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-warning)]">
          Producto nuevo
        </div>
      )}
      <div>
        <div className="text-[19px] font-extrabold text-[var(--color-text)]">{product.name}</div>
        <div className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">{product.barcode}</div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
        <Row label="Proveedor" value={product.provider} />
        <Row label="Precio compra" value={fmtMoney(product.purchase)} />
        <Row label="Precio venta" value={fmtMoney(product.sale)} />
        <Row label="Último conteo" value={product.isNew ? '— (producto nuevo)' : (product.lastStock ?? '-')} />
      </div>

      <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-3 text-[12.5px] font-bold text-[var(--color-text)]">Stock físico contado ahora</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onStockCountChange(String(Math.max(0, Number(stockCount || 0) - 1)))}
            className="h-[38px] w-[38px] rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)] text-lg text-[var(--color-text)]"
          >
            –
          </button>
          <input
            type="number"
            value={stockCount}
            onChange={(e) => onStockCountChange(e.target.value)}
            className="w-0 flex-1 rounded-[10px] border border-[var(--color-border)] p-2 text-center text-xl font-extrabold text-[var(--color-text)]"
          />
          <button
            onClick={() => onStockCountChange(String(Number(stockCount || 0) + 1))}
            className="h-[38px] w-[38px] rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)] text-lg text-[var(--color-text)]"
          >
            +
          </button>
        </div>
      </div>
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
