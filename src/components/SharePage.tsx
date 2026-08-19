import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode } from 'lucide-react'
import { t } from '../i18n'
import { PageTitle } from './PageTitle'

type Props = { viewerUrl: string }

export function SharePage({ viewerUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    setError(false)
    void QRCode.toCanvas(canvas, viewerUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#17201d', light: '#ffffff' },
    }).catch(() => setError(true))
  }, [viewerUrl])

  return (
    <>
      <PageTitle eyebrow={t('liveView')} title={t('shareTournament')} />
      <section className="share-card" aria-labelledby="share-title">
        <div className="share-copy">
          <div className="share-icon" aria-hidden="true">
            <QrCode size={24} />
          </div>
          <h2 id="share-title">{t('scanToView')}</h2>
          <p>{t('shareHelp')}</p>
          <div className="share-address">
            <span>{t('viewerAddress')}</span>
            <code>{viewerUrl}</code>
          </div>
        </div>
        <div className="share-qr">
          {error ? (
            <p role="alert">{t('qrError')}</p>
          ) : (
            <canvas ref={canvasRef} aria-label={t('viewerQrCode')} role="img" />
          )}
        </div>
      </section>
    </>
  )
}
