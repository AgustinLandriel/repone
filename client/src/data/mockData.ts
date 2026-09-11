export type Provider = {
  id: number
  name: string
  productCount: number
  pending: boolean
}

export type OrderLineBase = {
  id: number
  name: string
  currentStock: number
  suggested: number
  purchase: number
}

export type CurrentProduct = {
  id?: number
  name: string
  barcode: string
  provider: string
  purchase: number
  sale: number
  lastStock?: string
  isNew: boolean
}

export function fmtMoney(n: number): string {
  return '$' + Math.round(n || 0).toLocaleString('es-AR')
}

export function fmtDate(iso: string): string {
  if (!iso) return '-'
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  return `${parts[2]}/${parts[1]}`
}
