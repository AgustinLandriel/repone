import { useEffect, useState } from 'react'
import { useOrderBuilder } from '../hooks/useOrderBuilder'
import { useShareConfirm } from '../hooks/useShareConfirm'
import { LogoutIcon, PackageIcon, TruckIcon, ShareIcon } from '../components/icons'
import type { Provider } from '../data/mockData'
import { createOrder, createProduct, createProvider, getProviders, sendOrder, updateStock, type AuthUser } from '../api'

const ROLE_LABEL: Record<AuthUser['role'], string> = {
  owner: 'Dueño / encargado',
  employee: 'Empleado',
}

type Props = {
  user: AuthUser
  onLogout: () => void
}

export function DesktopApp({ user, onLogout }: Props) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [deliveryDate, setDeliveryDate] = useState('2026-09-15')
  const [nextDeliveryDate, setNextDeliveryDate] = useState('2026-09-29')

  const order = useOrderBuilder(selectedProviderId)
  const share = useShareConfirm()
  const [error, setError] = useState('')
  const [addingProvider, setAddingProvider] = useState(false)
  const [newProviderName, setNewProviderName] = useState('')
  const [stockEdits, setStockEdits] = useState<Record<number, string>>({})
  const [addingProduct, setAddingProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', barcode: '', purchase: '', sale: '', initialStock: '' })

  const loadProviders = () => {
    getProviders().then((data) => {
      setProviders(data)
      setSelectedProviderId((current) => current ?? data[0]?.id ?? null)
    })
  }

  const submitNewProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProviderName.trim()) return
    try {
      await createProvider(newProviderName.trim())
      setNewProviderName('')
      setAddingProvider(false)
      loadProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el proveedor')
    }
  }

  useEffect(loadProviders, [])

  const selectedProvider = providers.find((p) => p.id === selectedProviderId)

  const selectProvider = (id: number) => {
    setSelectedProviderId(id)
    setOrderId(null)
    order.reset()
    share.reset()
    setAddingProduct(false)
  }

  const commitStockEdit = async (productId: number, currentValue: number) => {
    const edited = stockEdits[productId]
    if (edited === undefined) return
    const stock = Number(edited || 0)
    setStockEdits((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
    if (stock === currentValue) return
    try {
      await updateStock(productId, stock)
      order.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el stock')
    }
  }

  const submitNewProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedProviderId == null) return
    if (!newProduct.name.trim() || !newProduct.barcode.trim()) {
      setError('Completá nombre y código de barras para crear el producto')
      return
    }
    setError('')
    try {
      await createProduct({
        name: newProduct.name.trim(),
        barcode: newProduct.barcode.trim(),
        providerId: selectedProviderId,
        purchase: Number(newProduct.purchase || 0),
        sale: Number(newProduct.sale || 0),
        initialStock: Number(newProduct.initialStock || 0),
      })
      setNewProduct({ name: '', barcode: '', purchase: '', sale: '', initialStock: '' })
      setAddingProduct(false)
      order.refresh()
      loadProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el producto')
    }
  }

  const createDraftOrder = async (): Promise<number | null> => {
    if (selectedProviderId == null) return null
    try {
      const created = await createOrder(selectedProviderId, {
        deliveryDate,
        nextDeliveryDate,
        items: order.items.map((it) => ({ productId: it.id, finalQty: Number(it.finalQty || 0) })),
      })
      setOrderId(created.id)
      return created.id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el pedido')
      return null
    }
  }

  const shareContext = {
    providerName: selectedProvider?.name ?? '',
    deliveryDate,
    nextDeliveryDate,
    items: order.items,
    totalLabel: order.totalLabel,
  }

  const markOrderSent = (id: number) => {
    sendOrder(id)
      .then(loadProviders)
      .catch(() => {
        // el pedido ya estaba marcado como enviado (p.ej. se tocó más de un botón de compartir)
      })
  }

  const shareActions = {
    whatsapp: async () => {
      setError('')
      const id = orderId ?? (await createDraftOrder())
      if (id == null) return
      share.shareWhatsapp(shareContext)
      markOrderSent(id)
    },
    email: async () => {
      setError('')
      const id = orderId ?? (await createDraftOrder())
      if (id == null) return
      share.shareEmail(shareContext)
      markOrderSent(id)
    },
    pdf: async () => {
      setError('')
      const id = orderId ?? (await createDraftOrder())
      if (id == null) return
      share.downloadPdf(shareContext)
      markOrderSent(id)
    },
  }

  return (
    <div className="flex h-full w-full bg-[var(--color-bg)]">
      <div className="flex w-[260px] flex-shrink-0 flex-col gap-6 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-accent)]">
            <PackageIcon size={16} className="text-white" />
          </div>
          <div className="text-base font-extrabold text-[var(--color-text)]">Reponé</div>
        </div>

        <div>
          <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Proveedores</div>
          <div className="flex flex-col gap-1">
            {providers.map((p) => {
              const active = p.id === selectedProviderId
              return (
                <button
                  key={p.id}
                  onClick={() => selectProvider(p.id)}
                  className="flex items-center gap-2.5 rounded-[10px] px-2 py-2.5 text-left"
                  style={{ background: active ? '#f0effb' : 'transparent' }}
                >
                  <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-[#f0efea]">
                    <TruckIcon size={15} className="text-[var(--color-text-secondary)]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-[var(--color-text)]">{p.name}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">{p.productCount} productos</div>
                  </div>
                  <div
                    className="rounded-full px-2 py-[3px] text-[10.5px] font-bold"
                    style={
                      p.pending
                        ? { background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }
                        : { background: 'var(--color-success-bg)', color: 'var(--color-success)' }
                    }
                  >
                    {p.pending ? 'Pendiente' : 'Al día'}
                  </div>
                </button>
              )
            })}
          </div>

          {user.role === 'owner' &&
            (addingProvider ? (
              <form onSubmit={submitNewProvider} className="mt-2 flex flex-col gap-1.5 px-2">
                <input
                  autoFocus
                  required
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder="Nombre del proveedor"
                  className="rounded-[9px] border border-[var(--color-border)] px-2.5 py-2 text-[12.5px] text-[var(--color-text)]"
                />
                <div className="flex gap-1.5">
                  <button type="submit" className="flex-1 rounded-[9px] bg-[var(--color-accent)] py-1.5 text-[11.5px] font-bold text-white">
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingProvider(false)
                      setNewProviderName('')
                    }}
                    className="flex-1 rounded-[9px] border border-[var(--color-border)] py-1.5 text-[11.5px] font-bold text-[var(--color-text-secondary)]"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingProvider(true)}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[var(--color-border)] px-2 py-2.5 text-[12px] font-bold text-[var(--color-text-secondary)]"
              >
                <span className="leading-none">+</span> Nuevo proveedor
              </button>
            ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-[var(--color-border)] px-2 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-bold text-[var(--color-text)]">{user.businessName}</div>
              <div className="truncate text-[11px] text-[var(--color-text-muted)]">
                {user.email} · {ROLE_LABEL[user.role]}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
            >
              <LogoutIcon size={15} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-[9px] bg-[var(--color-bg)] px-2.5 py-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Código de invitación</span>
            <span className="font-mono text-[12px] font-bold text-[var(--color-text)]">{user.inviteCode}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto p-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[22px] font-extrabold text-[var(--color-text)]">{selectedProvider?.name ?? ''}</div>
            <div className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">Armado de pedido</div>
          </div>
          <div className="flex gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] font-bold text-[var(--color-text-secondary)]">Fecha de entrega</span>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="rounded-[9px] border border-[var(--color-border)] px-2.5 py-2.5 text-[13px] text-[var(--color-text)]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] font-bold text-[var(--color-text-secondary)]">Próxima entrega</span>
              <input
                type="date"
                value={nextDeliveryDate}
                onChange={(e) => setNextDeliveryDate(e.target.value)}
                className="rounded-[9px] border border-[var(--color-border)] px-2.5 py-2.5 text-[13px] text-[var(--color-text)]"
              />
            </label>
          </div>
        </div>

        {user.role === 'owner' && selectedProviderId != null && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            {addingProduct ? (
              <form onSubmit={submitNewProduct} className="flex flex-col gap-2.5">
                {error && <div className="text-[12px] font-semibold text-red-600">{error}</div>}
                <div className="flex flex-wrap items-end gap-2.5">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">Nombre</span>
                  <input
                    autoFocus
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    className="w-40 rounded-[9px] border border-[var(--color-border)] px-2.5 py-2 text-[12.5px] text-[var(--color-text)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">Código de barras</span>
                  <input
                    required
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct((p) => ({ ...p, barcode: e.target.value }))}
                    className="w-32 rounded-[9px] border border-[var(--color-border)] px-2.5 py-2 text-[12.5px] text-[var(--color-text)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">Precio compra</span>
                  <input
                    type="number"
                    value={newProduct.purchase}
                    onChange={(e) => setNewProduct((p) => ({ ...p, purchase: e.target.value }))}
                    className="w-24 rounded-[9px] border border-[var(--color-border)] px-2.5 py-2 text-[12.5px] text-[var(--color-text)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">Precio venta</span>
                  <input
                    type="number"
                    value={newProduct.sale}
                    onChange={(e) => setNewProduct((p) => ({ ...p, sale: e.target.value }))}
                    className="w-24 rounded-[9px] border border-[var(--color-border)] px-2.5 py-2 text-[12.5px] text-[var(--color-text)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">Stock inicial</span>
                  <input
                    type="number"
                    value={newProduct.initialStock}
                    onChange={(e) => setNewProduct((p) => ({ ...p, initialStock: e.target.value }))}
                    className="w-20 rounded-[9px] border border-[var(--color-border)] px-2.5 py-2 text-[12.5px] text-[var(--color-text)]"
                  />
                </label>
                <button type="submit" className="rounded-[9px] bg-[var(--color-accent)] px-4 py-2 text-[12.5px] font-bold text-white">
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setAddingProduct(false)}
                  className="rounded-[9px] border border-[var(--color-border)] px-4 py-2 text-[12.5px] font-bold text-[var(--color-text-secondary)]"
                >
                  Cancelar
                </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingProduct(true)}
                className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--color-accent)]"
              >
                <span className="leading-none">+</span> Agregar producto a {selectedProvider?.name}
              </button>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="grid grid-cols-[2.4fr_1fr_1fr_1fr_1fr] gap-0 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Producto</div>
            <div className="text-right text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Stock actual</div>
            <div className="text-right text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Sugerido</div>
            <div className="text-right text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Pedir</div>
            <div className="text-right text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Subtotal</div>
          </div>
          {order.items.map((item) => (
            <div key={item.id} className="grid grid-cols-[2.4fr_1fr_1fr_1fr_1fr] items-center gap-0 border-b border-[#f2f1ec] px-5 py-3.5 last:border-b-0">
              <div className="text-[13.5px] font-semibold text-[var(--color-text)]">{item.name}</div>
              <div className="text-right">
                <input
                  type="number"
                  value={stockEdits[item.id] ?? String(item.currentStock)}
                  onChange={(e) => setStockEdits((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  onBlur={() => commitStockEdit(item.id, item.currentStock)}
                  title="Corregir stock actual"
                  className="w-16 rounded-lg border border-transparent bg-transparent p-1.5 text-right text-[13px] text-[var(--color-text-secondary)] hover:border-[var(--color-border)] focus:border-[var(--color-border)] focus:bg-white"
                />
              </div>
              <div className="text-right text-[13px] text-[var(--color-text-secondary)]">{item.suggested}</div>
              <div className="text-right">
                <input
                  type="number"
                  value={item.finalQty}
                  onChange={(e) => item.setQty(e.target.value)}
                  className="w-16 rounded-lg border border-[var(--color-border)] p-1.5 text-center text-[13px] font-bold text-[var(--color-text)]"
                />
              </div>
              <div className="text-right text-[13.5px] font-bold text-[var(--color-text)]">{item.subtotalLabel}</div>
            </div>
          ))}
        </div>

        <div className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
          Sugerido calculado según consumo promedio y fecha de próxima entrega (fórmula final a definir)
        </div>

        <div className="flex-1" />

        <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-[18px]">
          <div>
            <div className="text-[11.5px] text-[var(--color-text-muted)]">Total estimado</div>
            <div className="text-[22px] font-extrabold text-[var(--color-accent)]">{order.totalLabel}</div>
            {share.message && <div className="mt-2 text-xs font-semibold text-[var(--color-success)]">{share.message}</div>}
            {error && <div className="mt-2 text-xs font-semibold text-red-600">{error}</div>}
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={shareActions.pdf}
              className="rounded-[11px] border border-[var(--color-border)] bg-white px-[18px] py-3 text-[13.5px] font-bold text-[var(--color-text)]"
            >
              Descargar PDF
            </button>
            <button
              onClick={shareActions.email}
              className="rounded-[11px] border border-[var(--color-border)] bg-white px-[18px] py-3 text-[13.5px] font-bold text-[var(--color-text)]"
            >
              Enviar por email
            </button>
            <button
              onClick={shareActions.whatsapp}
              className="flex items-center gap-2 rounded-[11px] bg-[var(--color-accent)] px-5 py-3 text-[13.5px] font-bold text-white"
            >
              <ShareIcon size={16} />
              Compartir por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
