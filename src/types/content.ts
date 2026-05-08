export interface Meta {
  title: string
  updatedAt: string
  sources: string[]
}

export interface HeroBadge {
  text: string
  highlighted?: boolean
}

export interface Hero {
  eyebrow: string
  title: {
    main: string[]
    year: string
  }
  badges: HeroBadge[]
  countdownLabel: string
  countdownSubtext: string[]
  openingDate: string
}

export interface GroupTeam {
  flag: string
  name: string
  debut?: boolean
  champion?: boolean
}

export interface Group {
  letter: string
  label: string
  teams: GroupTeam[]
}

export interface ScheduleMatch {
  time: string
  home: GroupTeam
  away: GroupTeam
  group: string
  venue: string[]
}

export interface ScheduleDay {
  day: string
  month: string
  weekday: string
  badge?: string
  matches: ScheduleMatch[]
}

export interface KnockoutStage {
  name: string
  date: string
  stat: string
  label: string
  description: string[]
}

export interface KnockoutFinalCard {
  eyebrow: string
  title: string[]
  detail: string[]
}

export interface KnockoutFinalCenter {
  trophy: string
  title: string[]
  date: string
}

export interface Knockout {
  stages: KnockoutStage[]
  final: {
    venue: KnockoutFinalCard
    center: KnockoutFinalCenter
    format: KnockoutFinalCard
  }
}

export interface OverviewStat {
  value: string
  label: string
}

export interface HostSummary {
  flag: string
  name: string
  detail: string[]
}

export interface Favorite {
  rank: string
  flag: string
  name: string
  group: string
  odds: string
}

export interface Overview {
  stats: OverviewStat[]
  hosts: HostSummary[]
  favoritesTitle: string
  favorites: Favorite[]
}

export interface WorldCupContent {
  meta: Meta
  ticker: string[]
  hero: Hero
  groups: Group[]
  schedule: {
    note: string
    days: ScheduleDay[]
  }
  knockout: Knockout
  overview: Overview
}

export type SectionId = 'groups' | 'schedule' | 'knockout' | 'overview'
