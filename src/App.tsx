import { useEffect, useState } from 'react'
import {
  awardGameWin,
  countPlayableMatches,
  createBracket,
  getChampion,
} from './bracket'
import { BracketBoard } from './components/BracketBoard'
import { GuidelinesPanel } from './components/GuidelinesPanel'
import { TOURNAMENT } from './guidelines'
import { loadBracket, saveBracket } from './persist'
import { ROSTER } from './roster'
import type { BracketState } from './types'
import './App.css'

export default function App() {
  const [state, setState] = useState<BracketState>(() => loadBracket())
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)

  useEffect(() => {
    saveBracket(state)
  }, [state])

  const champion = getChampion(state)
  const playable = countPlayableMatches(state)
  const decided = state.matches.filter(
    (m) => m.winnerId && m.slots[0].teamId && m.slots[1].teamId,
  ).length

  function handleShuffle() {
    const ok = window.confirm(
      'Shuffle all matchups? This replaces the saved bracket and clears scores.',
    )
    if (ok) setState(createBracket())
  }

  return (
    <div className="app">
      <div className="app__glow" aria-hidden />
      <div className="app__wash" aria-hidden />

      <header className="top">
        <div className="top__brand">
          <h1 className="top__title">{TOURNAMENT.title}</h1>
          <p className="top__sub">{TOURNAMENT.partners}</p>
        </div>

        <div className="top__controls">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setGuidelinesOpen(true)}
          >
            Rules
          </button>
          <button type="button" className="btn" onClick={handleShuffle}>
            Shuffle
          </button>
        </div>
      </header>

      <div className="meta" role="status">
        <div className="meta__left">
          {champion ? (
            <p className="meta__text">
              <span className="meta__tag">Champion</span>
              {champion.name}
              <span className="meta__muted">· {champion.player}</span>
            </p>
          ) : (
            <p className="meta__text">
              Click a team to advance them. Knockout format.
            </p>
          )}
        </div>
        <div className="meta__right">
          <span>{ROSTER.length} teams</span>
          <span className="meta__dot" aria-hidden />
          <span>
            {decided}/{playable} series done
          </span>
        </div>
      </div>

      <main className="main">
        <BracketBoard
          state={state}
          onAwardWin={(matchId, teamId) =>
            setState((prev) => awardGameWin(prev, matchId, teamId))
          }
        />
      </main>

      <section className="participants" aria-label="Participating teams">
        <div className="participants__head">
          <div>
            <h2 className="participants__title">Participating Teams</h2>
            <p className="participants__sub">
              All registered squads · {ROSTER.filter((t) => t.inBracket !== false).length} in
              bracket
            </p>
          </div>
          <p className="participants__count">{ROSTER.length}</p>
        </div>
        <ol className="participants__list">
          {ROSTER.map((team, index) => (
            <li
              key={`${team.name}-${team.player}`}
              className="participants__item"
              data-out={team.inBracket === false}
            >
              <span className="participants__num">{String(index + 1).padStart(2, '0')}</span>
              <div className="participants__copy">
                <span className="participants__team">{team.name}</span>
                <span className="participants__player">
                  {team.player}
                  {team.inBracket === false ? ' · not in bracket' : ''}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <GuidelinesPanel open={guidelinesOpen} onClose={() => setGuidelinesOpen(false)} />
    </div>
  )
}
