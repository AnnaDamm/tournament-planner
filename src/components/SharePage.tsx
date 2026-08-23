import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode } from 'lucide-react'
import { t } from '../i18n'
import { PageTitle } from './PageTitle'

type Props = { viewerUrl: string }

export function SharePage({ viewerUrl }: Props) {
  const [qrCode, setQrCode] = useState({
    viewerUrl: '',
    dataUrl: '',
    failed: false,
  })

  useEffect(() => {
    void QRCode.toDataURL(viewerUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#17201d', light: '#ffffff' },
    })
      .then((dataUrl) => setQrCode({ viewerUrl, dataUrl, failed: false }))
      .catch(() => setQrCode({ viewerUrl, dataUrl: '', failed: true }))
  }, [viewerUrl])

  const currentQrCode = qrCode.viewerUrl === viewerUrl ? qrCode : null

  return (
    <>
      <PageTitle title={t('shareTournament')} />
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
          {currentQrCode?.failed ? (
            <p role="alert">{t('qrError')}</p>
          ) : currentQrCode?.dataUrl ? (
            <img src={currentQrCode.dataUrl} alt={t('viewerQrCode')} width="280" height="280" />
          ) : null}
        </div>
      </section>
    </>
  )
}
