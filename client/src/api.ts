import { fmtDate, type CurrentProduct, type OrderLineBase, type Provider } from './data/mockData'

const BASE = '/api'
const TOKEN_KEY = 'repone_token'

export const DEMO_EXISTING_BARCODE = '7790895000012' // Coca-Cola 500ml (Distribuidora Sur)
export const DEMO_NEW_BARCODE = '7790000000029'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // localStorage no disponible (modo privado, etc.) — la sesión no persiste al recargar
  }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ver comentario en setToken
  }
}

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const token = getToken()
  return fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

export type Role = 'owner' | 'employee'
export type AuthUser = { id: number; email: string; role: Role }

async function saveSession(res: Promise<{ token: string; user: AuthUser }>): Promise<AuthUser> {
  const { token, user } = await res
  setToken(token)
  return user
}

export function register(email: string, password: string, role: Role): Promise<AuthUser> {
  return saveSession(apiJson('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, role }) }))
}

export function login(email: string, password: string): Promise<AuthUser> {
  return saveSession(apiJson('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }))
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!getToken()) return null
  const res = await apiFetch('/auth/me')
  if (!res.ok) {
    clearToken()
    return null
  }
  const { user } = await res.json()
  return user
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' })
  clearToken()
}
