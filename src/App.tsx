import { useState } from 'react'
import { createBracket, selectWinner } from './bracket'
import { BracketBoard } from './components/BracketBoard'
import { TOURNAMENT } from './guidelines'
import type { BracketState } from './types'
import './App.css'

export default function App() {
  const [state, setState] = useState<BracketState>(() => createBracket())

  return (
    <div className="app">
      <div className="app__glow" aria-hidden />
      <div className="app__grid" aria-hidden />

      <header className="top">
        <div className="top__brand">
          <h1 className="top__title">{TOURNAMENT.title}</h1>
        </div>

        <div className="top__controls">
          <button
            type="button"
            className="btn"
            onClick={() => setState(createBracket())}
          >
            Shuffle
          </button>
        </div>
      </header>

      <main className="main">
        <BracketBoard
          state={state}
          onSelect={(matchId, teamId) =>
            setState((prev) => selectWinner(prev, matchId, teamId))
          }
        />
      </main>
    </div>
  )
}
