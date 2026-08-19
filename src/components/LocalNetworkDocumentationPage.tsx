import { useState } from 'react'
import { ExternalLink, Wifi } from 'lucide-react'
import {
  detectOperatingSystem,
  getNetworkDocumentation,
  type OperatingSystem,
} from '../networkDocumentation'
import { PageTitle } from './PageTitle'

const systems: OperatingSystem[] = ['macos', 'windows', 'linux']

export function LocalNetworkDocumentationPage() {
  const documentation = getNetworkDocumentation()
  const [system, setSystem] = useState<OperatingSystem>(detectOperatingSystem)
  const guide = documentation.guides[system]

  return (
    <>
      <PageTitle eyebrow={documentation.eyebrow} title={documentation.title} />
      <section className="documentation-card">
        <div className="documentation-intro">
          <div className="documentation-icon" aria-hidden="true">
            <Wifi size={24} />
          </div>
          <p>{documentation.intro}</p>
        </div>
        <div className="documentation-checklist">
          <h2>{documentation.prerequisitesTitle}</h2>
          <ol>
            {documentation.prerequisites.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>
      <section className="documentation-guide" aria-labelledby="network-guide-title">
        <div className="documentation-tabs" role="tablist" aria-label={documentation.title}>
          {systems.map((item) => (
            <button
              key={item}
              aria-controls={`guide-${item}`}
              aria-selected={system === item}
              className={`documentation-tab ${system === item ? 'active' : ''}`}
              id={`tab-${item}`}
              onClick={() => setSystem(item)}
              role="tab"
              type="button"
            >
              {documentation.guides[item].label}
            </button>
          ))}
        </div>
        <div aria-labelledby={`tab-${system}`} id={`guide-${system}`} role="tabpanel">
          <h2 id="network-guide-title">{guide.title}</h2>
          <p>{guide.description}</p>
          <ol className="documentation-steps">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <a
            className="documentation-source"
            href={guide.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            {guide.sourceLabel} <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </section>
      <section className="documentation-note">
        <h2>{documentation.troubleshootingTitle}</h2>
        <p>{documentation.troubleshooting}</p>
      </section>
    </>
  )
}
