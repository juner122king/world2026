import type { GroupTeam } from '@world2026/content-contract'

export const fifaCodeToFlagCode: Record<string, string> = {
  ALG: 'dz',
  ARG: 'ar',
  AUS: 'au',
  AUT: 'at',
  BEL: 'be',
  BIH: 'ba',
  BRA: 'br',
  CAN: 'ca',
  CIV: 'ci',
  COL: 'co',
  CPV: 'cv',
  COD: 'cd',
  CRC: 'cr',
  CRO: 'hr',
  CUW: 'cw',
  CZE: 'cz',
  ECU: 'ec',
  EGY: 'eg',
  ENG: 'gb-eng',
  FRA: 'fr',
  GER: 'de',
  GHA: 'gh',
  HAI: 'ht',
  IRN: 'ir',
  IRQ: 'iq',
  JPN: 'jp',
  JOR: 'jo',
  KOR: 'kr',
  MAR: 'ma',
  MEX: 'mx',
  NED: 'nl',
  NOR: 'no',
  NZL: 'nz',
  PAN: 'pa',
  PAR: 'py',
  POR: 'pt',
  QAT: 'qa',
  KSA: 'sa',
  SCO: 'gb-sct',
  SEN: 'sn',
  RSA: 'za',
  ESP: 'es',
  SUI: 'ch',
  SWE: 'se',
  TUN: 'tn',
  TUR: 'tr',
  URU: 'uy',
  USA: 'us',
  UZB: 'uz',
}

export const teamNameToFlagCode: Record<string, string> = {
  Algeria: 'dz',
  Argentina: 'ar',
  Australia: 'au',
  Austria: 'at',
  Belgium: 'be',
  'Bosnia and Herzegovina': 'ba',
  'Bosnia-Herzegovina': 'ba',
  Brazil: 'br',
  Canada: 'ca',
  'Cape Verde': 'cv',
  'Cabo Verde': 'cv',
  Colombia: 'co',
  'Congo DR': 'cd',
  "Côte d'Ivoire": 'ci',
  "Cote d'Ivoire": 'ci',
  'Ivory Coast': 'ci',
  Curaçao: 'cw',
  Curacao: 'cw',
  Croatia: 'hr',
  Czechia: 'cz',
  Ecuador: 'ec',
  Egypt: 'eg',
  England: 'gb-eng',
  France: 'fr',
  Germany: 'de',
  Ghana: 'gh',
  Haiti: 'ht',
  Iran: 'ir',
  'IR Iran': 'ir',
  Iraq: 'iq',
  Japan: 'jp',
  Jordan: 'jo',
  'Korea Republic': 'kr',
  'South Korea': 'kr',
  Mexico: 'mx',
  Morocco: 'ma',
  Netherlands: 'nl',
  'New Zealand': 'nz',
  Norway: 'no',
  Panama: 'pa',
  Paraguay: 'py',
  Portugal: 'pt',
  Qatar: 'qa',
  'Saudi Arabia': 'sa',
  Scotland: 'gb-sct',
  Senegal: 'sn',
  'South Africa': 'za',
  Spain: 'es',
  Sweden: 'se',
  Switzerland: 'ch',
  Tunisia: 'tn',
  Turkey: 'tr',
  Uruguay: 'uy',
  USA: 'us',
  'United States': 'us',
  Uzbekistan: 'uz',
}

export const teamNameToChineseName: Record<string, string> = {
  Algeria: '阿尔及利亚',
  Argentina: '阿根廷',
  Australia: '澳大利亚',
  Austria: '奥地利',
  Belgium: '比利时',
  'Bosnia and Herzegovina': '波黑',
  'Bosnia-Herzegovina': '波黑',
  Brazil: '巴西',
  Canada: '加拿大',
  'Cape Verde': '佛得角',
  'Cabo Verde': '佛得角',
  Colombia: '哥伦比亚',
  'Congo DR': '刚果(金)',
  "Côte d'Ivoire": '科特迪瓦',
  "Cote d'Ivoire": '科特迪瓦',
  'Ivory Coast': '科特迪瓦',
  Curaçao: '库拉索',
  Curacao: '库拉索',
  Croatia: '克罗地亚',
  Czechia: '捷克',
  Ecuador: '厄瓜多尔',
  Egypt: '埃及',
  England: '英格兰',
  France: '法国',
  Germany: '德国',
  Ghana: '加纳',
  Haiti: '海地',
  Iran: '伊朗',
  'IR Iran': '伊朗',
  Iraq: '伊拉克',
  Japan: '日本',
  Jordan: '约旦',
  'Korea Republic': '韩国',
  'South Korea': '韩国',
  Mexico: '墨西哥',
  Morocco: '摩洛哥',
  Netherlands: '荷兰',
  'New Zealand': '新西兰',
  Norway: '挪威',
  Panama: '巴拿马',
  Paraguay: '巴拉圭',
  Portugal: '葡萄牙',
  Qatar: '卡塔尔',
  'Saudi Arabia': '沙特阿拉伯',
  Scotland: '苏格兰',
  Senegal: '塞内加尔',
  'South Africa': '南非',
  Spain: '西班牙',
  Sweden: '瑞典',
  Switzerland: '瑞士',
  Tunisia: '突尼斯',
  Turkey: '土耳其',
  Uruguay: '乌拉圭',
  USA: '美国',
  'United States': '美国',
  Uzbekistan: '乌兹别克斯坦',
}

export function resolveFlagCode(code: string, name: string, country?: string): string {
  const normalizedCode = code.toUpperCase()

  if (normalizedCode in fifaCodeToFlagCode) {
    return fifaCodeToFlagCode[normalizedCode]
  }

  if (name in teamNameToFlagCode) {
    return teamNameToFlagCode[name]
  }

  if (country && country in teamNameToFlagCode) {
    return teamNameToFlagCode[country]
  }

  return normalizedCode.length === 2 ? normalizedCode.toLowerCase() : 'un'
}

export function localizeTeamName(name: string, country?: string): string {
  return teamNameToChineseName[name] ?? (country ? teamNameToChineseName[country] : undefined) ?? name
}

export function createTeam(rawTeam: unknown, fallbackName = '待定'): GroupTeam {
  if (typeof rawTeam === 'string') {
    return {
      flagCode: resolveFlagCode('', rawTeam, rawTeam),
      name: localizeTeamName(rawTeam, rawTeam),
    }
  }

  const team = rawTeam && typeof rawTeam === 'object' ? (rawTeam as Record<string, unknown>) : {}
  const name = typeof team.name === 'string' && team.name.trim() ? team.name.trim() : fallbackName
  const code = typeof team.code === 'string' && team.code.trim() ? team.code.trim() : ''
  const country = typeof team.country === 'string' && team.country.trim() ? team.country.trim() : ''

  return {
    flagCode: resolveFlagCode(code, name, country),
    name: localizeTeamName(name, country),
  }
}

export function findFallbackTeam(fallbackTeams: GroupTeam[], apiTeam: GroupTeam): GroupTeam {
  const byFlag = fallbackTeams.find((t) => t.flagCode === apiTeam.flagCode)
  if (byFlag) return byFlag

  const byName = fallbackTeams.find((t) => t.name === apiTeam.name)
  if (byName) return byName

  return apiTeam
}
