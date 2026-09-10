import { useState } from 'react'
import { useOrderBuilder } from '../hooks/useOrderBuilder'
import { useShareConfirm } from '../hooks/useShareConfirm'
import { PackageIcon, TruckIcon, ShareIcon } from '../components/icons'
import { PROVIDERS } from '../data/mockData'

export function DesktopApp() {
  const [selectedProviderName, setSelectedProviderName] = useState(PROVIDERS[0].name)
  const [deliveryDate, setDeliveryDate] = useState('2026-09-15')
  const [nextDeliveryDate, setNextDeliveryDate] = useState('2026-09-29')

  const order = useOrderBuilder(selectedProviderName)
  const share = useShareConfirm()

  const selectProvider = (name: string) => {
    setSelectedProviderName(name)
    order.reset()
    share.reset()
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
            {PROVIDERS.map((p) => {
              const active = p.name === selectedProviderName
              return (
                <button
                  key={p.name}
                  onClick={() => selectProvider(p.name)}
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
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto p-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[22px] font-extrabold text-[var(--color-text)]">{selectedProviderName}</div>
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
              <div className="text-right text-[13px] text-[var(--color-text-secondary)]">{item.currentStock}</div>
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
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={share.downloadPdf}
              className="rounded-[11px] border border-[var(--color-border)] bg-white px-[18px] py-3 text-[13.5px] font-bold text-[var(--color-text)]"
            >
              Descargar PDF
            </button>
            <button
              onClick={share.shareEmail}
              className="rounded-[11px] border border-[var(--color-border)] bg-white px-[18px] py-3 text-[13.5px] font-bold text-[var(--color-text)]"
            >
              Enviar por email
            </button>
            <button
              onClick={share.shareWhatsapp}
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
