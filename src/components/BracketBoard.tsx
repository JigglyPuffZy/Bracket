import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { BracketState, Match } from '../types'
import { getChampion, getRounds, getTeam, roundLabel } from '../bracket'
import { MatchCard } from './MatchCard'
import './BracketBoard.css'

type Props = {
  state: BracketState
  onAwardWin: (matchId: string, teamId: string) => void
}

const MATCH_W = 230
const MATCH_H = 78
const MATCH_GAP = 18
const ROUND_GAP = 88
const PAD_X = 16
const PAD_Y = 48
const MOBILE_MQ = '(max-width: 768px)'

type Pos = { x: number; y: number; match: Match }

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MQ)
    const onChange = () => setIsMobile(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

function matchCenterY(roundIndex: number, matchIndex: number, rounds: Match[][]): number {
  if (roundIndex === 0) {
    return PAD_Y + matchIndex * (MATCH_H + MATCH_GAP) + MATCH_H / 2
  }

  const prev = rounds[roundIndex - 1]
  const playPairs = Math.floor(prev.length / 2)

  if (matchIndex < playPairs) {
    const a = matchCenterY(roundIndex - 1, matchIndex * 2, rounds)
    const b = matchCenterY(roundIndex - 1, matchIndex * 2 + 1, rounds)
    return (a + b) / 2
  }

  return matchCenterY(roundIndex - 1, prev.length - 1, rounds)
}

function buildPositions(rounds: Match[][]): Pos[] {
  const positions: Pos[] = []
  rounds.forEach((roundMatches, roundIndex) => {
    roundMatches.forEach((match, matchIndex) => {
      positions.push({
        match,
        x: PAD_X + roundIndex * (MATCH_W + ROUND_GAP),
        y: matchCenterY(roundIndex, matchIndex, rounds) - MATCH_H / 2,
      })
    })
  })
  return positions
}

function buildConnectors(rounds: Match[][], positions: Pos[]): string[] {
  const byId = new Map(positions.map((p) => [p.match.id, p]))
  const paths: string[] = []

  for (let r = 0; r < rounds.length - 1; r++) {
    const prev = rounds[r]
    const next = rounds[r + 1]
    const playPairs = Math.floor(prev.length / 2)

    for (let m = 0; m < next.length; m++) {
      const target = byId.get(next[m].id)
      if (!target) continue
      const tx = target.x

      if (m < playPairs) {
        const top = byId.get(prev[m * 2].id)
        const bottom = byId.get(prev[m * 2 + 1].id)
        if (!top || !bottom) continue

        const ax = top.x + MATCH_W
        const ay = top.y + MATCH_H / 2
        const bx = bottom.x + MATCH_W
        const by = bottom.y + MATCH_H / 2
        const midX = ax + ROUND_GAP / 2

        paths.push(
          [
            `M ${ax} ${ay} H ${midX}`,
            `M ${bx} ${by} H ${midX}`,
            `M ${midX} ${ay} V ${by}`,
            `M ${midX} ${(ay + by) / 2} H ${tx}`,
          ].join(' '),
        )
      } else {
        const feeder = byId.get(prev[prev.length - 1].id)
        if (!feeder) continue
        const fx = feeder.x + MATCH_W
        const fy = feeder.y + MATCH_H / 2
        paths.push(`M ${fx} ${fy} H ${tx}`)
      }
    }
  }

  return paths
}

function getActiveRoundIndex(rounds: Match[][]) {
  for (let i = 0; i < rounds.length; i++) {
    const incomplete = rounds[i].some((m) => !m.winnerId)
    if (incomplete) return i
  }
  return Math.max(rounds.length - 1, 0)
}

export function BracketBoard({ state, onAwardWin }: Props) {
  const isMobile = useIsMobile()
  const rounds = getRounds(state)
  const champion = getChampion(state)

  if (isMobile) {
    return (
      <MobileMatchups
        state={state}
        rounds={rounds}
        champion={champion}
        onAwardWin={onAwardWin}
      />
    )
  }

  return (
    <DesktopBracket
      state={state}
      rounds={rounds}
      champion={champion}
      onAwardWin={onAwardWin}
    />
  )
}

type ViewProps = {
  state: BracketState
  rounds: Match[][]
  champion: ReturnType<typeof getChampion>
  onAwardWin: (matchId: string, teamId: string) => void
}

function MobileMatchups({ state, rounds, champion, onAwardWin }: ViewProps) {
  const activeIndex = getActiveRoundIndex(rounds)
  const activeRound = rounds[activeIndex] ?? []
  const label = roundLabel(activeIndex, rounds.length)
  const decided = activeRound.filter((m) => m.winnerId).length
  const live = activeRound.filter((m) => m.slots[0].teamId && m.slots[1].teamId)
  const byes = activeRound.filter(
    (m) => Boolean(m.slots[0].teamId) !== Boolean(m.slots[1].teamId),
  )

  return (
    <div className="board board--mobile">
      <div className="mobile__header">
        <div>
          <p className="mobile__eyebrow">Current round</p>
          <h2 className="mobile__title">{label}</h2>
          <p className="mobile__hint">
            {champion
              ? `${champion.name} wins the tournament`
              : `Tap a team to award a map win · first to 2 · ${decided}/${activeRound.length} done`}
          </p>
        </div>
      </div>

      {champion ? (
        <div className="mobile__champ" data-crowned>
          <p className="mobile__champ-label">Champion</p>
          <p className="mobile__champ-name">{champion.name}</p>
          <p className="mobile__champ-player">{champion.player}</p>
        </div>
      ) : (
        <div className="mobile__list">
          {live.map((match, index) => (
            <article className="mobile__card" key={match.id}>
              <div className="mobile__card-head">
                <span>Match {index + 1}</span>
                <span className="mobile__bo3">Best of 3</span>
              </div>
              <MatchCard
                match={match}
                getTeam={(id) => getTeam(state, id)}
                onAwardWin={onAwardWin}
              />
            </article>
          ))}

          {byes.map((match) => {
            const team =
              getTeam(state, match.slots[0].teamId) ??
              getTeam(state, match.slots[1].teamId)
            if (!team) return null
            return (
              <article className="mobile__bye" key={match.id}>
                <span className="mobile__bye-tag">Bye</span>
                <span className="mobile__bye-team">{team.name}</span>
                <span className="mobile__bye-player">{team.player}</span>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DesktopBracket({ state, rounds, champion, onAwardWin }: ViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const lockFit = useRef(true)
  const [zoom, setZoom] = useState(0.7)
  const [natural, setNatural] = useState({ w: 1400, h: 900 })

  const positions = useMemo(() => buildPositions(rounds), [rounds])
  const connectors = useMemo(
    () => buildConnectors(rounds, positions),
    [rounds, positions],
  )

  const treeW =
    PAD_X * 2 + rounds.length * MATCH_W + (rounds.length - 1) * ROUND_GAP + (MATCH_W + ROUND_GAP)
  const treeH =
    PAD_Y * 2 +
    Math.max(rounds[0]?.length ?? 1, 1) * MATCH_H +
    Math.max((rounds[0]?.length ?? 1) - 1, 0) * MATCH_GAP

  const champX = PAD_X + rounds.length * (MATCH_W + ROUND_GAP)
  const champY = treeH / 2 - 70

  const clamp = useCallback(
    (v: number) => Math.min(1.35, Math.max(0.25, Math.round(v * 100) / 100)),
    [],
  )

  const fit = useCallback(() => {
    const vp = viewportRef.current
    if (!vp) return
    const pad = 20
    const next = Math.min(
      (vp.clientWidth - pad) / treeW,
      (vp.clientHeight - pad) / treeH,
      1,
    )
    setZoom(clamp(Math.max(next, 0.2)))
    setNatural({ w: treeW, h: treeH })
  }, [clamp, treeH, treeW])

  useLayoutEffect(() => {
    setNatural({ w: treeW, h: treeH })
    if (lockFit.current) fit()
  }, [fit, treeH, treeW, state])

  useLayoutEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const ro = new ResizeObserver(() => {
      if (lockFit.current) fit()
    })
    ro.observe(vp)
    return () => ro.disconnect()
  }, [fit])

  return (
    <div className="board board--desktop">
      <div className="board__toolbar">
        <p className="board__hint">Use zoom controls to explore the full bracket</p>
        <div className="board__zoom" role="group" aria-label="Zoom">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => {
              lockFit.current = false
              setZoom((z) => clamp(z - 0.1))
            }}
          >
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => {
              lockFit.current = false
              setZoom((z) => clamp(z + 0.1))
            }}
          >
            +
          </button>
          <button
            type="button"
            className="board__fit"
            onClick={() => {
              lockFit.current = true
              fit()
            }}
          >
            Fit
          </button>
        </div>
      </div>

      <div className="board__viewport" ref={viewportRef}>
        <div
          className="board__scaler"
          style={{ width: natural.w * zoom, height: natural.h * zoom }}
        >
          <div
            className="board__canvas"
            style={{
              width: treeW,
              height: treeH,
              transform: `scale(${zoom})`,
            }}
          >
            {rounds.map((_, r) => (
              <div
                key={`label-${r}`}
                className="board__round-label"
                style={{ left: PAD_X + r * (MATCH_W + ROUND_GAP), top: 12 }}
              >
                {roundLabel(r, rounds.length)}
              </div>
            ))}
            <div className="board__round-label" style={{ left: champX, top: 12 }}>
              Champion
            </div>

            <svg className="board__svg" width={treeW} height={treeH} aria-hidden>
              {connectors.map((d, i) => (
                <path key={i} d={d} className="board__path" />
              ))}
              {rounds.length > 0 && (
                <path
                  className={champion ? 'board__path board__path--gold' : 'board__path'}
                  d={`M ${PAD_X + (rounds.length - 1) * (MATCH_W + ROUND_GAP) + MATCH_W} ${
                    (positions.find((p) => p.match.roundIndex === rounds.length - 1)?.y ??
                      treeH / 2 - MATCH_H / 2) + MATCH_H / 2
                  } H ${champX - 8}`}
                />
              )}
            </svg>

            {positions.map(({ match, x, y }) => (
              <div
                key={match.id}
                className="board__match"
                style={{ left: x, top: y, width: MATCH_W, height: MATCH_H }}
              >
                <MatchCard
                  match={match}
                  getTeam={(id) => getTeam(state, id)}
                  onAwardWin={onAwardWin}
                />
              </div>
            ))}

            <div
              className="board__champ"
              data-crowned={Boolean(champion)}
              style={{ left: champX, top: champY, width: MATCH_W }}
            >
              <p className="board__champ-label">Champion</p>
              <p className="board__champ-name">{champion?.name ?? 'TBD'}</p>
              <p className="board__champ-player">
                {champion?.player ?? 'Win the final'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
