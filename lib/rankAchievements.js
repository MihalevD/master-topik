// Korean proverb unlocked when reaching each RANK threshold
// 초보자 is the starting rank — no achievement notification
export const RANK_ACHIEVEMENTS = {
  '학습자': {
    phrase: '배움에는 끝이 없다',
    romanization: 'Baeumeun kkeutsi eopda',
    translation: 'There is no end to learning.',
    meaning: 'You\'ve leveled up and your Korean journey is truly underway!',
  },
  '숙련자': {
    phrase: '연습이 완벽을 만든다',
    romanization: 'Yeonseubi wanbyeogeul mandeunda',
    translation: 'Practice makes perfect.',
    meaning: 'Your consistency is turning into genuine, lasting skill!',
  },
  '고급자': {
    phrase: '노력은 배신하지 않는다',
    romanization: 'Noryeogeun baesinhaji anda',
    translation: 'Effort never betrays you.',
    meaning: 'Your dedication has carried you to an advanced level!',
  },
  '전문가': {
    phrase: '가는 말이 고와야 오는 말이 곱다',
    romanization: 'Ganeun mari gowaya oneun mari gopda',
    translation: 'Beautiful words beget beautiful words.',
    meaning: 'You now wield Korean with true expertise!',
  },
  '마스터': {
    phrase: '뜻이 있는 곳에 길이 있다',
    romanization: 'Tteusi inneun gose giri itda',
    translation: 'Where there\'s a will, there\'s a way.',
    meaning: 'You\'ve mastered what most only dream of reaching!',
  },
  '그랜드마스터': {
    phrase: '세 살 버릇 여든까지 간다',
    romanization: 'Se sal beoreut yeodeunkkaji ganda',
    translation: 'Habits from age 3 last until 80.',
    meaning: 'The Korean you\'ve built will stay with you forever.',
  },
  '전설': {
    phrase: '하늘 위에 하늘이 있다',
    romanization: 'Haneul wie haneuri itda',
    translation: 'Above the sky, there is more sky.',
    meaning: 'A true legend knows the journey never ends.',
  },
}

// Korean proverb unlocked for each word/streak MILESTONE achievement
export const MILESTONE_PHRASES = {
  first_10: {
    phrase: '천 리 길도 한 걸음부터',
    romanization: 'Cheon-ni gildo han georeumbuteo',
    translation: 'A thousand-mile journey starts with one step.',
    meaning: 'You\'ve taken yours — keep going!',
  },
  first_25: {
    phrase: '시작이 반이다',
    romanization: 'Sijagi ban-ida',
    translation: 'The start is half the battle.',
    meaning: '25 words in — you\'re building real momentum!',
  },
  century: {
    phrase: '배울수록 더 알고 싶어진다',
    romanization: 'Baeulsoorok deo algo sipeo-jinda',
    translation: 'The more you learn, the more you want to know.',
    meaning: '100 words — you\'re truly on your way!',
  },
  topik_ii: {
    phrase: '하늘은 스스로 돕는 자를 돕는다',
    romanization: 'Haneureun seuseullo domneun jareul domneunda',
    translation: 'Heaven helps those who help themselves.',
    meaning: 'TOPIK II unlocked — an incredible milestone!',
  },
  week_streak: {
    phrase: '꾸준함이 실력이다',
    romanization: 'Kkujunhami sillyeogida',
    translation: 'Consistency is skill.',
    meaning: '7 days in a row — the dedication that creates real fluency!',
  },
  month_streak: {
    phrase: '뜻이 있는 곳에 길이 있다',
    romanization: 'Tteusi inneun gose giri itda',
    translation: 'Where there\'s a will, there\'s a way.',
    meaning: '30 days without missing once — extraordinary!',
  },
}

// Color key per milestone achievement (must match RANK_COLOR_MAP keys)
export const MILESTONE_COLORS = {
  first_10: 'blue',
  first_25: 'purple',
  century:  'green',
  topik_ii: 'orange',
  week_streak:  'pink',
  month_streak: 'yellow',
}
