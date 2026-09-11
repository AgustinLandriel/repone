import { useState } from 'react'
import type { OrderLine } from './useOrderBuilder'

export type ShareOrderContext = {
  providerName: string
  deliveryDate: string
  nextDeliveryDate: string
  items: OrderLine[]
  totalLabel: string
}

function buildShareLines(ctx: ShareOrderContext): string[] {
  return [
    `Pedido — ${ctx.providerName}`,
    `Entrega: ${ctx.deliveryDate}  ·  Próxima entrega: ${ctx.nextDeliveryDate}`,
    '',
    ...ctx.items.map((it) => `• ${it.name} x${it.finalQty} — ${it.subtotalLabel}`),
    '',
    `Total estimado: ${ctx.totalLabel}`,
  ]
}

export function useShareConfirm() {
  const [message, setMessage] = useState('')

  const shareWhatsapp = (ctx: ShareOrderContext) => {
    const text = buildShareLines(ctx).join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
    setMessage('Se abrió WhatsApp con el resumen del pedido')
  }

  const shareEmail = (ctx: ShareOrderContext) => {
    const text = buildShareLines(ctx).join('\n')
    const subject = encodeURIComponent(`Pedido — ${ctx.providerName}`)
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(text)}`
    setMessage('Se abrió tu app de correo con el resumen')
  }

  const downloadPdf = async (ctx: ShareOrderContext) => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    let y = 18
    doc.setFontSize(16)
    doc.text(`Pedido — ${ctx.providerName}`, 14, y)
    y += 8
    doc.setFontSize(10)
    doc.text(`Entrega: ${ctx.deliveryDate}   Próxima entrega: ${ctx.nextDeliveryDate}`, 14, y)
    y += 10

    doc.setFontSize(11)
    for (const item of ctx.items) {
      doc.text(`${item.name}  x${item.finalQty}`, 14, y)
      doc.text(item.subtotalLabel, 180, y, { align: 'right' })
      y += 7
    }

    y += 4
    doc.setFontSize(13)
    doc.text('Total estimado', 14, y)
    doc.text(ctx.totalLabel, 180, y, { align: 'right' })

    doc.save(`pedido-${ctx.providerName.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    setMessage('PDF del pedido descargado')
  }

  const reset = () => setMessage('')

  return { message, shareWhatsapp, shareEmail, downloadPdf, reset }
}
