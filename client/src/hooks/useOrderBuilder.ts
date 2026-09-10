import { useMemo, useState } from 'react'
import { PROVIDER_ITEMS, fmtMoney } from '../data/mockData'

export type OrderLine = {
  id: string
  name: string
  currentStock: number
  suggested: number
  finalQty: string
  subtotalLabel: string
  setQty: (value: string) => void
}

export function useOrderBuilder(providerName: string) {
  const [finalQtys, setFinalQtys] = useState<Record<string, string>>({})

  const base = PROVIDER_ITEMS[providerName] || []

  const items: OrderLine[] = useMemo(
    () =>
      base.map((it) => {
        const finalQty = finalQtys[it.id] ?? String(it.suggested)
        const qtyNum = Number(finalQty || 0)
        return {
          id: it.id,
          name: it.name,
          currentStock: it.currentStock,
          suggested: it.suggested,
          finalQty,
          subtotalLabel: fmtMoney(qtyNum * it.purchase),
          setQty: (value: string) => setFinalQtys((prev) => ({ ...prev, [it.id]: value })),
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [providerName, finalQtys],
  )

  const total = base.reduce((sum, it) => {
    const qty = finalQtys[it.id] !== undefined ? Number(finalQtys[it.id] || 0) : it.suggested
    return sum + qty * it.purchase
  }, 0)

  const reset = () => setFinalQtys({})

  return { items, totalLabel: fmtMoney(total), reset }
}
