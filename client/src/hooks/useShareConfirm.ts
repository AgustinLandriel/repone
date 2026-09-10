import { useState } from 'react'

export function useShareConfirm() {
  const [message, setMessage] = useState('')

  const shareWhatsapp = () => setMessage('Se abrió WhatsApp con el resumen del pedido')
  const shareEmail = () => setMessage('Se abrió tu app de correo con el resumen')
  const downloadPdf = () => setMessage('PDF del pedido descargado')
  const reset = () => setMessage('')

  return { message, shareWhatsapp, shareEmail, downloadPdf, reset }
}
