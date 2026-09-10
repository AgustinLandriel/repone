import type { OrderLine } from '../../hooks/useOrderBuilder'

type Props = {
  deliveryDate: string
  onDeliveryDateChange: (v: string) => void
  nextDeliveryDate: string
  onNextDeliveryDateChange: (v: string) => void
  items: OrderLine[]
}

export function OrderScreen({ deliveryDate, onDeliveryDateChange, nextDeliveryDate, onNextDeliveryDateChange, items }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2.5">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-[11.5px] font-bold text-[var(--color-text-secondary)]">Fecha de entrega</span>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => onDeliveryDateChange(e.target.value)}
            className="rounded-[10px] border border-[var(--color-border)] px-2.5 py-2.5 text-[13px] text-[var(--color-text)]"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-[11.5px] font-bold text-[var(--color-text-secondary)]">Próxima entrega</span>
          <input
            type="date"
            value={nextDeliveryDate}
            onChange={(e) => onNextDeliveryDateChange(e.target.value)}
            className="rounded-[10px] border border-[var(--color-border)] px-2.5 py-2.5 text-[13px] text-[var(--color-text)]"
          />
        </label>
      </div>

      <div>
        <div className="mb-2.5 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
          Sugerido calculado según consumo promedio y fecha de próxima entrega (fórmula final a definir)
        </div>
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div key={item.id} className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[13.5px] font-bold text-[var(--color-text)]">{item.name}</div>
                <div className="text-[11px] text-[var(--color-text-muted)]">Stock: {item.currentStock}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="text-[11px] text-[var(--color-text-muted)]">Sugerido: {item.suggested}</div>
                <div className="flex-1" />
                <span className="text-[11px] text-[var(--color-text-secondary)]">Pedir</span>
                <input
                  type="number"
                  value={item.finalQty}
                  onChange={(e) => item.setQty(e.target.value)}
                  className="w-14 rounded-lg border border-[var(--color-border)] p-1.5 text-center text-[13px] font-bold text-[var(--color-text)]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
