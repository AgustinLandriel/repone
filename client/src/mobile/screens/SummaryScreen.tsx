import { fmtDate } from '../../data/mockData'
import type { OrderLine } from '../../hooks/useOrderBuilder'

type Props = {
  providerName: string
  deliveryDate: string
  nextDeliveryDate: string
  items: OrderLine[]
  totalLabel: string
  shareMessage: string
}

export function SummaryScreen({ providerName, deliveryDate, nextDeliveryDate, items, totalLabel, shareMessage }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
        <div className="text-[14.5px] font-extrabold text-[var(--color-text)]">{providerName}</div>
        <div className="mt-0.5 text-[11.5px] text-[var(--color-text-muted)]">
          Entrega {fmtDate(deliveryDate)} · Próxima {fmtDate(nextDeliveryDate)}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-[var(--color-border)] px-0.5 py-2.5">
            <div className="text-[13px] text-[var(--color-text)]">
              {item.name} <span className="text-[var(--color-text-muted)]">× {item.finalQty}</span>
            </div>
            <div className="text-[13px] font-bold text-[var(--color-text)]">{item.subtotalLabel}</div>
          </div>
        ))}
        <div className="flex justify-between px-0.5 pt-3">
          <div className="text-sm font-extrabold text-[var(--color-text)]">Total estimado</div>
          <div className="text-base font-extrabold text-[var(--color-accent)]">{totalLabel}</div>
        </div>
      </div>

      {shareMessage && (
        <div className="rounded-[10px] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-3 py-2.5 text-[12.5px] font-semibold text-[var(--color-success)]">
          {shareMessage}
        </div>
      )}
    </div>
  )
}
