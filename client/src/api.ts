import { fmtDate, type CurrentProduct, type OrderLineBase, type Provider } from './data/mockData'

const BASE = '/api'
const TOKEN_KEY = 'repone_token'

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

type ProviderDTO = { id: number; name: string; productCount: number }

// providers vive en catalog-service, pero el flag "pending" (último pedido sin
// enviar) vive en orders-service — se componen acá porque ningún servicio tiene
// acceso directo a la DB del otro (ver project_repone_microservices_migration).
export async function getProviders(): Promise<Provider[]> {
  const [providers, pendingByProvider] = await Promise.all([
    apiJson<ProviderDTO[]>('/catalog/providers'),
    apiJson<Record<number, boolean>>('/orders/status-by-provider'),
  ])
  return providers.map((p) => ({ ...p, pending: pendingByProvider[p.id] ?? false }))
}

export function getOrderItems(providerId: number): Promise<OrderLineBase[]> {
  return apiJson(`/catalog/providers/${providerId}/order-items`)
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
  const res = await apiFetch(`/catalog/products/by-barcode/${encodeURIComponent(barcode)}`)
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
  return apiJson('/catalog/products', { method: 'POST', body: JSON.stringify(input) })
}

export function updateStock(productId: number, stock: number): Promise<{ id: number; currentStock: number }> {
  return apiJson(`/catalog/products/${productId}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) })
}

export type CreateOrderInput = {
  deliveryDate: string
  nextDeliveryDate: string
  items: { productId: number; finalQty: number }[]
}

export function createOrder(providerId: number, input: CreateOrderInput): Promise<{ id: number }> {
  return apiJson('/orders', { method: 'POST', body: JSON.stringify({ providerId, ...input }) })
}

export function sendOrder(orderId: number): Promise<{ id: number; status: string }> {
  return apiJson(`/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify({ status: 'sent' }) })
}

export function createProvider(name: string): Promise<Provider> {
  return apiJson<ProviderDTO>('/catalog/providers', { method: 'POST', body: JSON.stringify({ name }) }).then((p) => ({
    ...p,
    pending: false,
  }))
}

export type Role = 'owner' | 'employee'
export type AuthUser = {
  id: number
  email: string
  role: Role
  businessId: number
  businessName: string
  inviteCode: string
}

type SessionResponse = {
  token: string
  user: { id: number; email: string; role: Role }
  business: { id: number; name: string; inviteCode: string }
}

function saveSession({ token, user, business }: SessionResponse): AuthUser {
  setToken(token)
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    businessId: business.id,
    businessName: business.name,
    inviteCode: business.inviteCode,
  }
}

export async function registerBusiness(businessName: string, email: string, password: string): Promise<AuthUser> {
  const res = await apiJson<SessionResponse>('/auth/register-business', {
    method: 'POST',
    body: JSON.stringify({ businessName, email, password }),
  })
  return saveSession(res)
}

export async function joinBusiness(inviteCode: string, email: string, password: string): Promise<AuthUser> {
  const res = await apiJson<SessionResponse>('/auth/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode, email, password }),
  })
  return saveSession(res)
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiJson<SessionResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  return saveSession(res)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!getToken()) return null
  const res = await apiFetch('/auth/me')
  if (!res.ok) {
    clearToken()
    return null
  }
  const { user, business } = await res.json()
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    businessId: business.id,
    businessName: business.name,
    inviteCode: business.inviteCode,
  }
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' })
  clearToken()
}
