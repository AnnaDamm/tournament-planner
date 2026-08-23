import styles from './DocumentationPage.module.css'
import sharedStyles from '../styles/shared.module.css'
import { classNames } from '../styles/classNames'
import { ChevronRight } from 'lucide-react'
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
    <div className={classNames(sharedStyles, styles, 'docs-layout')}>
      <nav
        className={classNames(sharedStyles, styles, 'docs-nav')}
        aria-label={locale === 'de' ? 'Dokumentation' : 'Documentation'}
      >
        {docs.map((item) => (
          <NavLink key={item.slug} to={`/docs/${item.slug}`}>
            {item.title} <ChevronRight size={14} aria-hidden="true" />
          </NavLink>
        ))}
      </nav>
      <article className={classNames(sharedStyles, styles, 'docs-article')}>
        <h1>{page.title}</h1>
        <p className={classNames(sharedStyles, styles, 'docs-summary')}>{page.summary}</p>
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
            {section.note && (
              <div className={classNames(sharedStyles, styles, 'docs-note')}>{section.note}</div>
            )}
            {section.links && (
              <p className={classNames(sharedStyles, styles, 'docs-links')}>
                {section.links.map((link) => (
                  <NavLink key={link.to} to={link.to}>
                    {link.label}
                  </NavLink>
                ))}
              </p>
            )}
          </section>
        ))}
      </article>
    </div>
  )
}
