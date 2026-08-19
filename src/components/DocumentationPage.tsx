import { BookOpen, ChevronRight } from 'lucide-react'
import { Navigate, NavLink, useParams } from 'react-router-dom'
import { getDocs } from '../docs/content'
import { locale } from '../i18n'

export function DocumentationPage() {
  const docs = getDocs(locale)
  const { slug } = useParams()
  const page = docs.find((candidate) => candidate.slug === slug)

  if (!slug) return <Navigate to={`/docs/${docs[0].slug}`} replace />
  if (!page) return <Navigate to="/docs" replace />

  return (
    <div className="docs-layout">
      <nav className="docs-nav" aria-label={locale === 'de' ? 'Dokumentation' : 'Documentation'}>
        <div className="docs-nav-title">
          <BookOpen size={18} aria-hidden="true" />{' '}
          {locale === 'de' ? 'Dokumentation' : 'Documentation'}
        </div>
        {docs.map((item) => (
          <NavLink key={item.slug} to={`/docs/${item.slug}`}>
            {item.title} <ChevronRight size={14} aria-hidden="true" />
          </NavLink>
        ))}
      </nav>
      <article className="docs-article">
        <div className="docs-eyebrow" aria-hidden="true">
          TOURNY · {locale === 'de' ? 'DOKUMENTATION' : 'DOCUMENTATION'}
        </div>
        <h1>{page.title}</h1>
        <p className="docs-summary">{page.summary}</p>
        {page.sections.map((section, index) => (
          <section key={section.title} aria-labelledby={`docs-section-${index}`}>
            <h2 id={`docs-section-${index}`}>{section.title}</h2>
            {section.text?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items && (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.note && <div className="docs-note">{section.note}</div>}
          </section>
        ))}
      </article>
    </div>
  )
}
