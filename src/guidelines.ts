export type GuidelineSection = {
  id: string
  title: string
  items: string[]
}

export const TOURNAMENT = {
  title: 'Mobile Legends Tournament',
  partners: 'Partnership of SK Federation and SB Rona Talaue',
  docTitle: 'Rules and Guidelines',
} as const

export const GUIDELINE_SECTIONS: GuidelineSection[] = [
  {
    id: 'player-requirements',
    title: 'Player Requirements',
    items: [
      'Each player can be part of only one team.',
      'Players must only have a maximum of 5 main players and maximum of 2 optional players.',
      'Players must be available on the tournament dates.',
      'Players must be residents of Santo Tomas only.',
    ],
  },
  {
    id: 'before-the-match',
    title: 'Before the Match',
    items: [
      'All team members must arrive at the venue on time.',
      'Teams that fail to show up or do not have a full roster within 15 minutes of the agreed start time will be disqualified. The team with the disqualified opponent will advance to the next round.',
      'Players should bring their own phone or device.',
      'Teams must ensure they have a stable internet connection and sufficient load.',
      'Players should have an appropriate in-game name (IGN).',
      'Log in to your Mobile Legends account prior to the tournament.',
    ],
  },
  {
    id: 'in-game-rules',
    title: 'In-Game Rules',
    items: [
      'Each team is permitted up to 3 pauses per game, with each pause lasting no longer than 2 minutes.',
      'Pauses are not allowed during clashes or active team fights.',
      'Players must maintain good sportsmanship. Cheating, trash talk, and bad behavior are prohibited.',
      'Violating the rules may result in disqualification.',
    ],
  },
  {
    id: 'game-setup',
    title: 'Game Set-up',
    items: ['Draft picks will follow the in-game system.'],
  },
  {
    id: 'tournament-conduct',
    title: 'Tournament Conduct',
    items: [
      'Players and teams are accountable for the actions of every member. Any team member who violates the player conduct rules will be disqualified from participating in future qualifiers, as well as the current qualifier the team is involved in.',
      'The organizer has the right to apply penalties, disqualify and dismiss any registered player from the tournament, at their discretion, at any stage of the tournament.',
      'Betting is strictly forbidden between teams and will not be tolerated.',
    ],
  },
]
