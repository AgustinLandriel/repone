import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'

type Props = {
  onDetected: (barcode: string) => void
}

export function ScanScreen({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [manualCode, setManualCode] = useState('')
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let stopped = false
    let controls: IScannerControls | undefined

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, _error, ctrl) => {
        controls = ctrl
        if (result && !stopped) {
          stopped = true
          ctrl.stop()
          onDetected(result.getText())
        }
      })
      .catch(() => setCameraError('No se pudo acceder a la cámara. Podés ingresar el código manualmente.'))

    return () => {
      stopped = true
      controls?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) onDetected(manualCode.trim())
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="relative flex h-[250px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#1c1c1e]">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
        {(['left-top', 'right-top', 'left-bottom', 'right-bottom'] as const).map((corner) => (
          <div
            key={corner}
            className="pointer-events-none absolute z-10 h-[26px] w-[26px]"
            style={{
              [corner.includes('left') ? 'left' : 'right']: 24,
              [corner.includes('top') ? 'top' : 'bottom']: 22,
              borderTop: corner.includes('top') ? '3px solid var(--color-accent)' : undefined,
              borderBottom: corner.includes('bottom') ? '3px solid var(--color-accent)' : undefined,
              borderLeft: corner.includes('left') ? '3px solid var(--color-accent)' : undefined,
              borderRight: corner.includes('right') ? '3px solid var(--color-accent)' : undefined,
              borderRadius: 4,
            }}
          />
        ))}
        <div className="pointer-events-none absolute left-6 right-6 top-1/2 z-10 h-0.5 animate-pulse bg-[var(--color-accent)]" />
      </div>

      {cameraError ? (
        <div className="rounded-[10px] border border-[#f5ddb8] bg-[var(--color-warning-bg)] px-3 py-2.5 text-center text-[12px] text-[var(--color-warning)]">
          {cameraError}
        </div>
      ) : (
        <div className="text-center text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]">
          Apuntá la cámara al código de barras del producto
        </div>
      )}

      <form onSubmit={submitManual} className="flex flex-col gap-2 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">O ingresá el código manualmente</div>
        <div className="flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Código de barras"
            className="flex-1 rounded-[9px] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)]"
          />
          <button type="submit" className="rounded-[9px] bg-[var(--color-accent)] px-4 text-[12.5px] font-bold text-white">
            Buscar
          </button>
        </div>
      </form>
    </div>
  )
}
