import { useEffect } from 'react'
import { GUIDELINE_SECTIONS, TOURNAMENT } from '../guidelines'
import './GuidelinesPanel.css'

type Props = {
  open: boolean
  onClose: () => void
}

export function GuidelinesPanel({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="guide" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <button type="button" className="guide__backdrop" aria-label="Close guidelines" onClick={onClose} />

      <div className="guide__panel">
        <header className="guide__header">
          <div>
            <h2 id="guide-title" className="guide__title">
              {TOURNAMENT.docTitle}
            </h2>
            <p className="guide__partners">{TOURNAMENT.partners}</p>
          </div>
          <button type="button" className="guide__close" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="guide__body">
          {GUIDELINE_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={
                section.id === 'in-game-rules'
                  ? 'guide__section guide__section--ingame'
                  : 'guide__section'
              }
            >
              <h3 className="guide__section-title">{section.title}</h3>
              <ul className="guide__list">
                {section.items.map((item, index) => (
                  <li
                    key={item}
                    className="guide__item"
                    data-tone={section.id === 'in-game-rules' ? ['white', 'red', 'yellow'][index % 3] : undefined}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="guide__section guide__section--note">
            <h3 className="guide__section-title">Registration</h3>
            <p className="guide__note">
              Register team name, captain, and players with barangay, IGN, and signature.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
