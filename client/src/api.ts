import { fmtDate, type CurrentProduct, type OrderLineBase, type Provider } from './data/mockData'

const BASE = '/api'

export const DEMO_EXISTING_BARCODE = '7790895000012' // Coca-Cola 500ml (Distribuidora Sur)
export const DEMO_NEW_BARCODE = '7790000000029'

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
}

async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await apiFetch(path, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }
  return res.json()
}

export function getProviders(): Promise<Provider[]> {
  return apiJson('/providers')
}

export function getOrderItems(providerId: number): Promise<OrderLineBase[]> {
  return apiJson(`/providers/${providerId}/order-items`)
}

type ProductByBarcodeDTO = {
  id: number
  name: string
  barcode: string
  providerId: number
  providerName: string
  purchase: number
  sale: number
  currentStock: number
  reorderPoint: number
  lastStockAt: string | null
}

export async function getProductByBarcode(barcode: string): Promise<CurrentProduct | null> {
  const res = await apiFetch(`/products/by-barcode/${encodeURIComponent(barcode)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Error ${res.status}`)

  const p: ProductByBarcodeDTO = await res.json()
  return {
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    provider: p.providerName,
    purchase: p.purchase,
    sale: p.sale,
    lastStock: p.lastStockAt ? `${p.currentStock} unidades (${fmtDate(p.lastStockAt.slice(0, 10))})` : undefined,
    isNew: false,
  }
}

export type NewProductInput = {
  name: string
  barcode: string
  providerId: number
  purchase: number
  sale: number
  initialStock: number
}

export function createProduct(input: NewProductInput): Promise<{ id: number }> {
  return apiJson('/products', { method: 'POST', body: JSON.stringify(input) })
}

export function updateStock(productId: number, stock: number): Promise<{ id: number; currentStock: number }> {
  return apiJson(`/products/${productId}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) })
}

export type CreateOrderInput = {
  deliveryDate: string
  nextDeliveryDate: string
  items: { productId: number; finalQty: number }[]
}

export function createOrder(providerId: number, input: CreateOrderInput): Promise<{ id: number }> {
  return apiJson(`/providers/${providerId}/orders`, { method: 'POST', body: JSON.stringify(input) })
}

export function sendOrder(orderId: number): Promise<{ id: number; status: string }> {
  return apiJson(`/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify({ status: 'sent' }) })
}
