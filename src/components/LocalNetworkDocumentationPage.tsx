import { useRef, useState } from 'react'
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
  const tabRefs = useRef<Partial<Record<OperatingSystem, HTMLButtonElement | null>>>({})
  const guide = documentation.guides[system]
  const selectTab = (index: number) => {
    const nextSystem = systems[(index + systems.length) % systems.length]
    setSystem(nextSystem)
    tabRefs.current[nextSystem]?.focus()
  }

  return (
    <>
      <PageTitle eyebrow={documentation.eyebrow} title={documentation.title} />
      <section className="documentation-card" aria-labelledby="network-prerequisites-title">
        <div className="documentation-intro">
          <div className="documentation-icon" aria-hidden="true">
            <Wifi size={24} />
          </div>
          <p>{documentation.intro}</p>
        </div>
        <div className="documentation-checklist">
          <h2 id="network-prerequisites-title">{documentation.prerequisitesTitle}</h2>
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
              tabIndex={system === item ? 0 : -1}
              className={`documentation-tab ${system === item ? 'active' : ''}`}
              id={`tab-${item}`}
              ref={(element) => {
                tabRefs.current[item] = element
              }}
              onClick={() => setSystem(item)}
              onKeyDown={(event) => {
                const index = systems.indexOf(item)
                if (event.key === 'ArrowRight') selectTab(index + 1)
                else if (event.key === 'ArrowLeft') selectTab(index - 1)
                else if (event.key === 'Home') selectTab(0)
                else if (event.key === 'End') selectTab(systems.length - 1)
                else return
                event.preventDefault()
              }}
              role="tab"
              type="button"
            >
              {documentation.guides[item].label}
            </button>
          ))}
        </div>
        <div aria-labelledby={`tab-${system}`} id={`guide-${system}`} role="tabpanel" tabIndex={0}>
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
      <section className="documentation-note" aria-labelledby="network-troubleshooting-title">
        <h2 id="network-troubleshooting-title">{documentation.troubleshootingTitle}</h2>
        <p>{documentation.troubleshooting}</p>
      </section>
    </>
  )
}
