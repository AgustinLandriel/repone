const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3002'

export type ProviderCheck = { id: number; name: string }
export type ProductSnapshot = { id: number; currentStock: number; reorderPoint: number; purchase: number }

export async function getProviderForBusiness(providerId: number, businessId: number): Promise<ProviderCheck | undefined> {
  const res = await fetch(`${CATALOG_URL}/internal/providers/${providerId}?businessId=${businessId}`)
  if (res.status === 404) return undefined
  if (!res.ok) throw new Error(`catalog-service respondió ${res.status}`)
  return (await res.json()) as ProviderCheck
}

export async function getProductSnapshots(
  businessId: number,
  providerId: number,
  productIds: number[],
): Promise<ProductSnapshot[]> {
  const res = await fetch(`${CATALOG_URL}/internal/order-items/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId, providerId, productIds }),
  })
  if (!res.ok) throw new Error(`catalog-service respondió ${res.status}`)
  return (await res.json()) as ProductSnapshot[]
}
