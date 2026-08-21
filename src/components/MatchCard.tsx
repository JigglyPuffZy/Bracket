import type { Match, Team } from '../types'
import './MatchCard.css'

type Props = {
  match: Match
  getTeam: (id: string | null) => Team | null
  onAwardWin: (matchId: string, teamId: string) => void
}

export function MatchCard({ match, getTeam, onAwardWin }: Props) {
  const ready = Boolean(match.slots[0].teamId && match.slots[1].teamId)
  const decided = Boolean(match.winnerId)
  const isBye =
    Boolean(match.slots[0].teamId) !== Boolean(match.slots[1].teamId) &&
    (decided || match.slots.some((s) => s.teamId))

  return (
    <article
      className="match"
      data-ready={ready}
      data-decided={decided}
      data-bye={isBye}
    >
      {match.slots.map((slot, i) => {
        const team = getTeam(slot.teamId)
        const isWinner = match.winnerId !== null && match.winnerId === slot.teamId
        const isLoser = match.winnerId !== null && slot.teamId !== null && !isWinner
        const showBye = !team && isBye
        const canAward = ready && Boolean(team) && !decided && !isBye

        return (
          <button
            key={`${match.id}-${i}`}
            type="button"
            className="match__slot"
            data-empty={!team}
            data-winner={isWinner}
            data-loser={isLoser}
            disabled={!canAward}
            aria-label={
              team
                ? canAward
                  ? `Award map win to ${team.name}`
                  : `${team.name}, ${slot.score} map wins`
                : showBye
                  ? 'Bye'
                  : 'Waiting for teams'
            }
            onClick={() => team && canAward && onAwardWin(match.id, team.id)}
          >
            <span className="match__seed">{showBye ? 'BYE' : i === 0 ? 'A' : 'B'}</span>
            <span className="match__info">
              {team ? (
                <>
                  <span className="match__team">{team.name}</span>
                  <span className="match__player">{team.player}</span>
                </>
              ) : (
                <span className="match__team match__team--empty">{showBye ? 'Bye' : 'TBD'}</span>
              )}
            </span>
            <span className="match__score">
              {team && (ready || decided) ? slot.score : ''}
            </span>
          </button>
        )
      })}
    </article>
  )
}
