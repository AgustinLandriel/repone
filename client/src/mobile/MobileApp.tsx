import { lazy, Suspense, useEffect, useState } from 'react'
import { useOrderBuilder } from '../hooks/useOrderBuilder'
import { useShareConfirm } from '../hooks/useShareConfirm'
import { ChevronLeftIcon, PackageIcon, UserIcon } from '../components/icons'
import type { CurrentProduct, Provider } from '../data/mockData'
import {
  type AuthUser,
  createOrder,
  createProduct,
  createProvider,
  getProductByBarcode,
  getProviders,
  sendOrder,
  updateStock,
} from '../api'
import { HomeScreen } from './screens/HomeScreen'
import { FichaScreen } from './screens/FichaScreen'
import { NewProductScreen } from './screens/NewProductScreen'
import { NewProviderScreen } from './screens/NewProviderScreen'
import { OrderScreen } from './screens/OrderScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { AccountScreen } from './screens/AccountScreen'

const ScanScreen = lazy(() => import('./screens/ScanScreen').then((m) => ({ default: m.ScanScreen })))

type Screen = 'home' | 'scan' | 'ficha' | 'newProduct' | 'newProvider' | 'order' | 'summary' | 'account'

const TITLES: Record<Screen, string> = {
  home: 'Reponé',
  scan: 'Escanear producto',
  ficha: 'Producto',
  newProduct: 'Alta de producto',
  newProvider: 'Nuevo proveedor',
  order: 'Pedido',
  summary: 'Resumen de pedido',
  account: 'Mi cuenta',
}

type Props = {
  user: AuthUser
  onLogout: () => void
}

export function MobileApp({ user, onLogout }: Props) {
  const [screen, setScreen] = useState<Screen>('home')
  const [providers, setProviders] = useState<Provider[]>([])
  const [stockCount, setStockCount] = useState('0')
  const [currentProduct, setCurrentProduct] = useState<CurrentProduct | null>(null)
  const [scannedBarcode, setScannedBarcode] = useState('')
  const [newName, setNewName] = useState('')
  const [newProviderId, setNewProviderId] = useState<number | null>(null)
  const [newPurchase, setNewPurchase] = useState('')
  const [newSale, setNewSale] = useState('')
  const [newProviderName, setNewProviderName] = useState('')
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [deliveryDate, setDeliveryDate] = useState('2026-09-15')
  const [nextDeliveryDate, setNextDeliveryDate] = useState('2026-09-29')
  const [toastMsg, setToastMsg] = useState('')

  const order = useOrderBuilder(selectedProviderId)
  const share = useShareConfirm()

  const loadProviders = () => {
    getProviders().then((data) => {
      setProviders(data)
      setNewProviderId((current) => current ?? data[0]?.id ?? null)
    })
  }

  useEffect(loadProviders, [])

  const selectedProvider = providers.find((p) => p.id === selectedProviderId)

  const selectProvider = (id: number) => {
    setSelectedProviderId(id)
    setOrderId(null)
    order.reset()
    share.reset()
    setScreen('order')
  }

  const handleDetected = async (barcode: string) => {
    try {
      const product = await getProductByBarcode(barcode)
      if (product) {
        setCurrentProduct(product)
        setStockCount('0')
        setScreen('ficha')
      } else if (user.role === 'owner') {
        setScannedBarcode(barcode)
        setScreen('newProduct')
      } else {
        setToastMsg('Producto no encontrado. Pedile a un dueño/encargado que lo dé de alta.')
        setScreen('home')
      }
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : 'No se pudo buscar el producto')
    }
  }

  const continueNewProduct = () => {
    setCurrentProduct({
      name: newName || 'Producto sin nombre',
      barcode: scannedBarcode,
      provider: providers.find((p) => p.id === newProviderId)?.name ?? '',
      purchase: Number(newPurchase || 0),
      sale: Number(newSale || 0),
      isNew: true,
    })
    setStockCount('0')
    setScreen('ficha')
  }

  const saveStock = async () => {
    if (!currentProduct) return
    const stock = Number(stockCount || 0)

    try {
      if (currentProduct.isNew && newProviderId != null) {
        await createProduct({
          name: currentProduct.name,
          barcode: currentProduct.barcode,
          providerId: newProviderId,
          purchase: currentProduct.purchase,
          sale: currentProduct.sale,
          initialStock: stock,
        })
      } else if (currentProduct.id != null) {
        await updateStock(currentProduct.id, stock)
      }
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : 'No se pudo guardar')
      return
    }

    setToastMsg(currentProduct.isNew ? 'Producto y stock guardados' : 'Stock actualizado')
    setCurrentProduct(null)
    setNewName('')
    setNewPurchase('')
    setNewSale('')
    setScreen('home')
    loadProviders()
  }

  const saveProvider = async () => {
    if (!newProviderName.trim()) return
    try {
      await createProvider(newProviderName.trim())
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : 'No se pudo crear el proveedor')
      return
    }
    setNewProviderName('')
    setToastMsg('Proveedor creado')
    setScreen('home')
    loadProviders()
  }

  const goToSummary = async () => {
    if (selectedProviderId == null) return
    let created: { id: number }
    try {
      created = await createOrder(selectedProviderId, {
        deliveryDate,
        nextDeliveryDate,
        items: order.items.map((it) => ({ productId: it.id, finalQty: Number(it.finalQty || 0) })),
      })
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : 'No se pudo crear el pedido')
      return
    }
    setOrderId(created.id)
    share.reset()
    setScreen('summary')
  }

  const markOrderSent = () => {
    if (orderId == null) return
    sendOrder(orderId)
      .then(loadProviders)
      .catch(() => {
        // el pedido ya estaba marcado como enviado (p.ej. se tocó más de un botón de compartir)
      })
  }

  const shareContext = {
    providerName: selectedProvider?.name ?? '',
    deliveryDate,
    nextDeliveryDate,
    items: order.items,
    totalLabel: order.totalLabel,
  }

  const backTarget: Screen =
    screen === 'ficha'
      ? currentProduct?.isNew
        ? 'newProduct'
        : 'scan'
      : screen === 'newProduct'
        ? 'scan'
        : screen === 'order'
          ? 'home'
          : screen === 'summary'
            ? 'order'
            : 'home'

  const title = screen === 'ficha' ? (currentProduct?.isNew ? 'Producto nuevo' : 'Producto') : screen === 'order' ? `Pedido: ${selectedProvider?.name ?? ''}` : TITLES[screen]

  const showBack = screen !== 'home'

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-bg)]">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
        {showBack && (
          <button
            onClick={() => setScreen(backTarget)}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <ChevronLeftIcon />
          </button>
        )}
        {screen === 'home' && (
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[var(--color-accent)]">
            <PackageIcon size={16} className="text-white" />
          </div>
        )}
        <div className="flex-1 text-[16.5px] font-bold text-[var(--color-text)]">{title}</div>
        {screen === 'home' && (
          <button
            onClick={() => setScreen('account')}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <UserIcon size={16} />
          </button>
        )}
      </div>

      {toastMsg && (
        <div className="mx-5 mt-3 flex flex-shrink-0 items-center gap-2 rounded-[10px] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-3 py-2.5">
          <div className="flex-1 text-[12.5px] font-semibold text-[var(--color-success)]">{toastMsg}</div>
          <button onClick={() => setToastMsg('')} className="text-[var(--color-success)]">
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-[18px]">
        {screen === 'home' && (
          <HomeScreen
            providers={providers}
            onScan={() => setScreen('scan')}
            onSelectProvider={selectProvider}
            canAddProvider={user.role === 'owner'}
            onAddProvider={() => setScreen('newProvider')}
          />
        )}
        {screen === 'scan' && (
          <Suspense fallback={<div className="text-center text-[12.5px] text-[var(--color-text-secondary)]">Cargando cámara…</div>}>
            <ScanScreen onDetected={handleDetected} />
          </Suspense>
        )}
        {screen === 'ficha' && (
          <FichaScreen product={currentProduct} stockCount={stockCount} onStockCountChange={setStockCount} />
        )}
        {screen === 'newProduct' && (
          <NewProductScreen
            barcode={scannedBarcode}
            name={newName}
            onNameChange={setNewName}
            providers={providers}
            providerId={newProviderId ?? providers[0]?.id ?? 0}
            onProviderIdChange={setNewProviderId}
            purchase={newPurchase}
            onPurchaseChange={setNewPurchase}
            sale={newSale}
            onSaleChange={setNewSale}
          />
        )}
        {screen === 'order' && (
          <OrderScreen
            deliveryDate={deliveryDate}
            onDeliveryDateChange={setDeliveryDate}
            nextDeliveryDate={nextDeliveryDate}
            onNextDeliveryDateChange={setNextDeliveryDate}
            items={order.items}
          />
        )}
        {screen === 'summary' && (
          <SummaryScreen
            providerName={selectedProvider?.name ?? ''}
            deliveryDate={deliveryDate}
            nextDeliveryDate={nextDeliveryDate}
            items={order.items}
            totalLabel={order.totalLabel}
            shareMessage={share.message}
          />
        )}
        {screen === 'newProvider' && <NewProviderScreen name={newProviderName} onNameChange={setNewProviderName} />}
        {screen === 'account' && <AccountScreen user={user} onLogout={onLogout} />}
      </div>

      {screen === 'ficha' && (
        <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-[22px] pt-3.5">
          <button onClick={saveStock} className="w-full rounded-xl bg-[var(--color-accent)] py-3.5 text-[14.5px] font-bold text-white">
            Guardar conteo
          </button>
        </div>
      )}
      {screen === 'newProduct' && (
        <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-[22px] pt-3.5">
          <button onClick={continueNewProduct} className="w-full rounded-xl bg-[var(--color-accent)] py-3.5 text-[14.5px] font-bold text-white">
            Continuar
          </button>
        </div>
      )}
      {screen === 'newProvider' && (
        <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-[22px] pt-3.5">
          <button onClick={saveProvider} className="w-full rounded-xl bg-[var(--color-accent)] py-3.5 text-[14.5px] font-bold text-white">
            Crear proveedor
          </button>
        </div>
      )}
      {screen === 'order' && (
        <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-[22px] pt-3.5">
          <button onClick={goToSummary} className="w-full rounded-xl bg-[var(--color-accent)] py-3.5 text-[14.5px] font-bold text-white">
            Ver resumen
          </button>
        </div>
      )}
      {screen === 'summary' && (
        <div className="flex flex-shrink-0 flex-col gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-[22px] pt-3.5">
          <button
            onClick={() => {
              share.shareWhatsapp(shareContext)
              markOrderSent()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-[13px] text-sm font-bold text-white"
          >
            Compartir por WhatsApp
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                share.shareEmail(shareContext)
                markOrderSent()
              }}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-[11px] text-[13px] font-bold text-[var(--color-text)]"
            >
              Enviar por email
            </button>
            <button
              onClick={() => {
                share.downloadPdf(shareContext)
                markOrderSent()
              }}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-[11px] text-[13px] font-bold text-[var(--color-text)]"
            >
              Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
