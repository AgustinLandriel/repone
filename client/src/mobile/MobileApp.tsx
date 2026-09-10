import { useState } from 'react'
import { useOrderBuilder } from '../hooks/useOrderBuilder'
import { useShareConfirm } from '../hooks/useShareConfirm'
import { ChevronLeftIcon, PackageIcon } from '../components/icons'
import { DEMO_PRODUCT, PROVIDERS, type CurrentProduct } from '../data/mockData'
import { LoginScreen } from './screens/LoginScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ScanScreen } from './screens/ScanScreen'
import { FichaScreen } from './screens/FichaScreen'
import { NewProductScreen } from './screens/NewProductScreen'
import { OrderScreen } from './screens/OrderScreen'
import { SummaryScreen } from './screens/SummaryScreen'

type Screen = 'login' | 'home' | 'scan' | 'ficha' | 'newProduct' | 'order' | 'summary'

const TITLES: Record<Screen, string> = {
  login: '',
  home: 'Reponé',
  scan: 'Escanear producto',
  ficha: 'Producto',
  newProduct: 'Alta de producto',
  order: 'Pedido',
  summary: 'Resumen de pedido',
}

export function MobileApp() {
  const [screen, setScreen] = useState<Screen>('login')
  const [scanMode, setScanMode] = useState<'existing' | 'new'>('existing')
  const [stockCount, setStockCount] = useState('0')
  const [currentProduct, setCurrentProduct] = useState<CurrentProduct | null>(null)
  const [newName, setNewName] = useState('')
  const [newProvider, setNewProvider] = useState(PROVIDERS[0].name)
  const [newPurchase, setNewPurchase] = useState('')
  const [newSale, setNewSale] = useState('')
  const [selectedProviderName, setSelectedProviderName] = useState(PROVIDERS[0].name)
  const [deliveryDate, setDeliveryDate] = useState('2026-09-15')
  const [nextDeliveryDate, setNextDeliveryDate] = useState('2026-09-29')
  const [toastMsg, setToastMsg] = useState('')

  const order = useOrderBuilder(selectedProviderName)
  const share = useShareConfirm()

  const selectProvider = (name: string) => {
    setSelectedProviderName(name)
    order.reset()
    share.reset()
    setScreen('order')
  }

  const simulateScan = () => {
    if (scanMode === 'existing') {
      setCurrentProduct(DEMO_PRODUCT)
      setStockCount('0')
      setScreen('ficha')
    } else {
      setScreen('newProduct')
    }
  }

  const continueNewProduct = () => {
    setCurrentProduct({
      name: newName || 'Producto sin nombre',
      barcode: '7790000000029',
      provider: newProvider,
      purchase: Number(newPurchase || 0),
      sale: Number(newSale || 0),
      isNew: true,
    })
    setStockCount('0')
    setScreen('ficha')
  }

  const saveStock = () => {
    setToastMsg(currentProduct?.isNew ? 'Producto y stock guardados' : 'Stock actualizado')
    setCurrentProduct(null)
    setNewName('')
    setNewProvider(PROVIDERS[0].name)
    setNewPurchase('')
    setNewSale('')
    setScreen('home')
  }

  const backTarget: Screen =
    screen === 'ficha' ? (currentProduct?.isNew ? 'newProduct' : 'scan') : screen === 'newProduct' ? 'scan' : screen === 'order' ? 'home' : screen === 'summary' ? 'order' : 'home'

  const title = screen === 'ficha' ? (currentProduct?.isNew ? 'Producto nuevo' : 'Producto') : screen === 'order' ? `Pedido: ${selectedProviderName}` : TITLES[screen]

  if (screen === 'login') {
    return <LoginScreen onLogin={() => setScreen('home')} />
  }

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
        <div className="text-[16.5px] font-bold text-[var(--color-text)]">{title}</div>
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
        {screen === 'home' && <HomeScreen providers={PROVIDERS} onScan={() => setScreen('scan')} onSelectProvider={selectProvider} />}
        {screen === 'scan' && <ScanScreen scanMode={scanMode} onSetScanMode={setScanMode} />}
        {screen === 'ficha' && (
          <FichaScreen product={currentProduct} stockCount={stockCount} onStockCountChange={setStockCount} />
        )}
        {screen === 'newProduct' && (
          <NewProductScreen
            name={newName}
            onNameChange={setNewName}
            provider={newProvider}
            onProviderChange={setNewProvider}
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
            providerName={selectedProviderName}
            deliveryDate={deliveryDate}
            nextDeliveryDate={nextDeliveryDate}
            items={order.items}
            totalLabel={order.totalLabel}
            shareMessage={share.message}
          />
        )}
      </div>

      {screen === 'scan' && (
        <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-[22px] pt-3.5">
          <button onClick={simulateScan} className="w-full rounded-xl bg-[var(--color-accent)] py-3.5 text-[14.5px] font-bold text-white">
            Simular escaneo
          </button>
        </div>
      )}
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
      {screen === 'order' && (
        <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-[22px] pt-3.5">
          <button
            onClick={() => {
              share.reset()
              setScreen('summary')
            }}
            className="w-full rounded-xl bg-[var(--color-accent)] py-3.5 text-[14.5px] font-bold text-white"
          >
            Ver resumen
          </button>
        </div>
      )}
      {screen === 'summary' && (
        <div className="flex flex-shrink-0 flex-col gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-[22px] pt-3.5">
          <button
            onClick={share.shareWhatsapp}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-[13px] text-sm font-bold text-white"
          >
            Compartir por WhatsApp
          </button>
          <div className="flex gap-2">
            <button onClick={share.shareEmail} className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-[11px] text-[13px] font-bold text-[var(--color-text)]">
              Enviar por email
            </button>
            <button onClick={share.downloadPdf} className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-[11px] text-[13px] font-bold text-[var(--color-text)]">
              Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
