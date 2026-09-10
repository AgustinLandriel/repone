export type Provider = {
  name: string
  productCount: number
  pending: boolean
}

export type OrderLineBase = {
  id: string
  name: string
  currentStock: number
  suggested: number
  purchase: number
}

export type CurrentProduct = {
  name: string
  barcode: string
  provider: string
  purchase: number
  sale: number
  lastStock?: string
  isNew: boolean
}

export const PROVIDER_NAMES = ['Distribuidora Sur', 'Bebidas Andina', 'Almacén Norte']

export const PROVIDERS: Provider[] = [
  { name: 'Distribuidora Sur', productCount: 8, pending: true },
  { name: 'Bebidas Andina', productCount: 12, pending: true },
  { name: 'Almacén Norte', productCount: 5, pending: false },
]

export const DEMO_PRODUCT: CurrentProduct = {
  name: 'Coca-Cola 500ml',
  barcode: '7790895000012',
  provider: 'Distribuidora Sur',
  purchase: 450,
  sale: 700,
  lastStock: '8 unidades (02/09)',
  isNew: false,
}

export const PROVIDER_ITEMS: Record<string, OrderLineBase[]> = {
  'Distribuidora Sur': [
    { id: 'i1', name: 'Coca-Cola 500ml', currentStock: 8, suggested: 24, purchase: 450 },
    { id: 'i2', name: 'Sprite 500ml', currentStock: 3, suggested: 18, purchase: 430 },
    { id: 'i3', name: 'Agua Mineral 1.5L', currentStock: 15, suggested: 10, purchase: 300 },
  ],
  'Bebidas Andina': [
    { id: 'i4', name: 'Jugo Naranja 1L', currentStock: 0, suggested: 12, purchase: 900 },
    { id: 'i5', name: 'Cerveza Lager 1L', currentStock: 6, suggested: 20, purchase: 650 },
    { id: 'i6', name: 'Vino Tinto 750ml', currentStock: 4, suggested: 8, purchase: 1200 },
  ],
  'Almacén Norte': [
    { id: 'i7', name: 'Fideos 500g', currentStock: 10, suggested: 15, purchase: 380 },
    { id: 'i8', name: 'Arroz 1kg', currentStock: 2, suggested: 20, purchase: 420 },
  ],
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
