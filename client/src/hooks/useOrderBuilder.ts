import { useEffect, useMemo, useState } from 'react'
import { getOrderItems } from '../api'
import { fmtMoney, type OrderLineBase } from '../data/mockData'

export type OrderLine = {
  id: number
  name: string
  currentStock: number
  suggested: number
  finalQty: string
  subtotalLabel: string
  setQty: (value: string) => void
}

export function useOrderBuilder(providerId: number | null) {
  const [base, setBase] = useState<OrderLineBase[]>([])
  const [finalQtys, setFinalQtys] = useState<Record<number, string>>({})
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    if (providerId == null) {
      setBase([])
      return
    }
    let cancelled = false
    getOrderItems(providerId).then((data) => {
      if (!cancelled) setBase(data)
    })
    return () => {
      cancelled = true
    }
  }, [providerId, reloadTick])

  const refresh = () => setReloadTick((t) => t + 1)

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
    [base, finalQtys],
  )

  const total = base.reduce((sum, it) => {
    const qty = finalQtys[it.id] !== undefined ? Number(finalQtys[it.id] || 0) : it.suggested
    return sum + qty * it.purchase
  }, 0)

  const reset = () => setFinalQtys({})

  return { items, totalLabel: fmtMoney(total), reset, refresh }
}
