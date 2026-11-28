import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { t } from '../../i18n'
import { DeleteTournamentDialog } from './DeleteTournamentDialog'

const render = (isLast: boolean) =>
  renderToStaticMarkup(
    createElement(DeleteTournamentDialog, {
      name: 'Cup <A>',
      isLast,
      onConfirm: () => {},
      onClose: () => {},
    }),
  )

describe('DeleteTournamentDialog', () => {
  it('is a labelled, described dialog that names the tournament and offers cancel and confirm', () => {
    const html = render(false)
    expect(html).toContain('aria-labelledby="delete-tournament-title"')
    expect(html).toContain('aria-describedby="delete-tournament-description"')
    expect(html).toContain('Cup &lt;A&gt;')
    expect(html.match(/<button/g)).toHaveLength(3)
  })

  it('warns that a new empty tournament is created when the last one is deleted', () => {
    const hint = t('libraryDeleteLastHint')
    expect(render(true)).toContain(hint)
    expect(render(false)).not.toContain(hint)
  })
})
