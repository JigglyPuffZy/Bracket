import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { BracketState } from '../types'
import { getChampion, getRounds, getTeam, roundLabel } from '../bracket'
import { MatchCard } from './MatchCard'
import './BracketBoard.css'

type Props = {
  state: BracketState
  onSelect: (matchId: string, teamId: string) => void
}

const MIN_ZOOM = 0.25
const MAX_ZOOM = 1.5
const ZOOM_STEP = 0.1

export function BracketBoard({ state, onSelect }: Props) {
  const rounds = getRounds(state)
  const champion = getChampion(state)
  const firstRoundMatches = state.size / 2
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const lockFitRef = useRef(true)
  const [zoom, setZoom] = useState(1)
  const [natural, setNatural] = useState({ w: 1680, h: 1180 })

  const clampZoom = useCallback((value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100))
  }, [])

  const measureNatural = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return { w: 1680, h: 1180 }
    // offset size is pre-transform layout size
    return {
      w: Math.max(1, Math.ceil(canvas.offsetWidth)),
      h: Math.max(1, Math.ceil(canvas.offsetHeight)),
    }
  }, [])

  const fitToViewport = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const size = measureNatural()
    setNatural(size)

    const pad = 24
    const next = Math.min(
      (viewport.clientWidth - pad) / size.w,
      (viewport.clientHeight - pad) / size.h,
      1,
    )
    setZoom(clampZoom(next))
  }, [clampZoom, measureNatural])

  const zoomBy = useCallback(
    (delta: number) => {
      lockFitRef.current = false
      setZoom((current) => clampZoom(current + delta))
    },
    [clampZoom],
  )

  const handleFit = useCallback(() => {
    lockFitRef.current = true
    fitToViewport()
  }, [fitToViewport])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const size = measureNatural()
      setNatural(size)
      if (lockFitRef.current) fitToViewport()
    })

    const viewport = viewportRef.current
    if (!viewport) return () => cancelAnimationFrame(frame)

    const observer = new ResizeObserver(() => {
      if (lockFitRef.current) fitToViewport()
      else setNatural(measureNatural())
    })
    observer.observe(viewport)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [fitToViewport, measureNatural, state.size])

  return (
    <div
      className="board"
      style={
        {
          '--rounds': rounds.length,
          '--first-matches': firstRoundMatches,
        } as CSSProperties
      }
    >
      <div className="board__toolbar">
        <div className="board__zoom" role="group" aria-label="Zoom controls">
          <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-ZOOM_STEP)}>
            −
          </button>
          <span aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => zoomBy(ZOOM_STEP)}>
            +
          </button>
          <button type="button" className="board__fit" onClick={handleFit}>
            Fit
          </button>
        </div>
      </div>

      <div className="board__viewport" ref={viewportRef}>
        <div
          className="board__scaler"
          style={{
            width: natural.w * zoom,
            height: natural.h * zoom,
          }}
        >
          <div
            className="board__canvas"
            ref={canvasRef}
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="board__grid">
              {rounds.map((roundMatches, roundIndex) => (
                <section className="board__round" key={roundIndex}>
                  <h2 className="board__round-title">{roundLabel(roundIndex, state.size)}</h2>
                  <div className="board__matches">
                    {roundMatches.map((match) => (
                      <div className="board__match-wrap" key={match.id}>
                        <MatchCard
                          match={match}
                          getTeam={(id) => getTeam(state, id)}
                          onSelect={onSelect}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <aside className="board__champion" data-crowned={Boolean(champion)}>
                <p className="board__champion-label">Champion</p>
                <p className="board__champion-name">{champion?.name ?? '—'}</p>
                {champion && (
                  <>
                    <p className="board__champion-player">{champion.player}</p>
                    <p className="board__champion-seed">Seed {champion.seed}</p>
                  </>
                )}
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
