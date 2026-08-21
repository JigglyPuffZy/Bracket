import type { Match, Team } from '../types'
import './MatchCard.css'

type Props = {
  match: Match
  getTeam: (id: string | null) => Team | null
  onSelect: (matchId: string, teamId: string) => void
}

export function MatchCard({ match, getTeam, onSelect }: Props) {
  const ready = Boolean(match.slots[0].teamId && match.slots[1].teamId)
  const isBye =
    match.roundIndex === 0 &&
    Boolean(match.winnerId) &&
    (!match.slots[0].teamId || !match.slots[1].teamId)

  return (
    <article
      className="match"
      data-ready={ready}
      data-decided={Boolean(match.winnerId)}
      data-bye={isBye}
    >
      {match.slots.map((slot, i) => {
        const team = getTeam(slot.teamId)
        const isWinner = match.winnerId !== null && match.winnerId === slot.teamId
        const isLoser = match.winnerId !== null && slot.teamId !== null && !isWinner
        const showBye = !team && match.roundIndex === 0

        return (
          <button
            key={`${match.id}-${i}`}
            type="button"
            className="match__slot"
            data-empty={!team}
            data-winner={isWinner}
            data-loser={isLoser}
            disabled={!ready || !team}
            aria-label={
              team
                ? `Advance ${team.name} (${team.player})`
                : showBye
                  ? 'Bye'
                  : 'Waiting for teams'
            }
            onClick={() => team && onSelect(match.id, team.id)}
          >
            <span className="match__seed">{team ? team.seed : showBye ? 'BYE' : '—'}</span>
            {team ? (
              <span className="match__info">
                <span className="match__team">{team.name}</span>
                <span className="match__player">{team.player}</span>
              </span>
            ) : (
              <span className="match__info">
                <span className="match__team match__team--empty">{showBye ? 'Bye' : 'TBD'}</span>
              </span>
            )}
            <span className="match__pick" aria-hidden>
              {isWinner ? '★' : '›'}
            </span>
          </button>
        )
      })}
    </article>
  )
}
