export interface Team {
  id: string;
  name: string;
  seed: number;
  conference: string;
  kenpom: number;
  adjEM: number;
  adjO: number;
  adjD: number;
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  winner?: Team;
  status: 'pending' | 'in_progress' | 'final';
  reasoning?: string;
  winProbability?: {
    home: number;
    away: number;
  };
}

export interface Bracket {
  firstFour: Game[];
  r64: Game[];
  r32: Game[];
  sweet16: Game[];
  elite8: Game[];
  finalFour: Game[];
  championship: Game | null;
}

export function calculateWinProbability(team1: Team, team2: Team): { team1: number; team2: number } {
  const emDiff = team1.adjEM - team2.adjEM;
  const team1Prob = 1 / (1 + Math.pow(10, -emDiff / 11));
  const team2Prob = 1 - team1Prob;
  return {
    team1: Math.round(team1Prob * 100),
    team2: Math.round(team2Prob * 100),
  };
}

const TEAMS: Record<string, Team> = {
  florida: { id: 'florida', name: 'Florida', seed: 1, conference: 'SEC', kenpom: 4, adjEM: 33.8, adjO: 125.5, adjD: 91.7 },
  clemson: { id: 'clemson', name: 'Clemson', seed: 8, conference: 'ACC', kenpom: 42, adjEM: 10.1, adjO: 112.3, adjD: 102.2 },
  iowa: { id: 'iowa', name: 'Iowa', seed: 9, conference: 'Big Ten', kenpom: 48, adjEM: 8.4, adjO: 111.9, adjD: 103.5 },
  vanderbilt: { id: 'vanderbilt', name: 'Vanderbilt', seed: 5, conference: 'SEC', kenpom: 23, adjEM: 19.1, adjO: 116.4, adjD: 97.3 },
  mcneese: { id: 'mcneese', name: 'McNeese', seed: 12, conference: 'Southland', kenpom: 185, adjEM: -15.3, adjO: 102.1, adjD: 117.4 },
  nebraska: { id: 'nebraska', name: 'Nebraska', seed: 4, conference: 'Big Ten', kenpom: 18, adjEM: 21.3, adjO: 117.2, adjD: 95.9 },
  troy: { id: 'troy', name: 'Troy', seed: 13, conference: 'Sun Belt', kenpom: 215, adjEM: -22.1, adjO: 100.4, adjD: 122.5 },
  northCarolina: { id: 'nc', name: 'North Carolina', seed: 6, conference: 'ACC', kenpom: 28, adjEM: 16.7, adjO: 115.2, adjD: 98.5 },
  vcu: { id: 'vcu', name: 'VCU', seed: 11, conference: 'A10', kenpom: 72, adjEM: 0.3, adjO: 108.5, adjD: 108.2 },
  illinois: { id: 'illinois', name: 'Illinois', seed: 3, conference: 'Big Ten', kenpom: 12, adjEM: 25.5, adjO: 119.8, adjD: 94.3 },
  penn: { id: 'penn', name: 'Penn', seed: 14, conference: 'Ivy', kenpom: 245, adjEM: -28.5, adjO: 99.2, adjD: 127.7 },
  stMary: { id: 'stmary', name: "Saint Mary's", seed: 7, conference: 'WCC', kenpom: 35, adjEM: 13.2, adjO: 113.8, adjD: 100.6 },
  texasAM: { id: 'tamu', name: 'Texas A&M', seed: 10, conference: 'SEC', kenpom: 55, adjEM: 5.8, adjO: 110.5, adjD: 104.7 },
  houston: { id: 'houston', name: 'Houston', seed: 2, conference: 'American', kenpom: 7, adjEM: 31.2, adjO: 123.4, adjD: 92.2 },
  idaho: { id: 'idaho', name: 'Idaho', seed: 15, conference: 'WAC', kenpom: 278, adjEM: -35.2, adjO: 97.8, adjD: 133.0 },
  howard: { id: 'howard', name: 'Howard', seed: 16, conference: 'MEAC', kenpom: 305, adjEM: -42.1, adjO: 95.3, adjD: 137.4 },
  duke: { id: 'duke', name: 'Duke', seed: 1, conference: 'ACC', kenpom: 5, adjEM: 32.4, adjO: 124.2, adjD: 91.8 },
  ohioState: { id: 'osu', name: 'Ohio St', seed: 8, conference: 'Big Ten', kenpom: 44, adjEM: 9.7, adjO: 112.1, adjD: 102.4 },
  tcu: { id: 'tcu', name: 'TCU', seed: 9, conference: 'Big 12', kenpom: 50, adjEM: 7.8, adjO: 111.7, adjD: 103.9 },
  stJohns: { id: 'stjohns', name: "St John's", seed: 5, conference: 'Big East', kenpom: 25, adjEM: 18.3, adjO: 115.8, adjD: 97.5 },
  northernIowa: { id: 'uni', name: 'Northern Iowa', seed: 12, conference: 'MVC', kenpom: 190, adjEM: -16.2, adjO: 101.8, adjD: 117.9 },
  kansas: { id: 'kansas', name: 'Kansas', seed: 4, conference: 'Big 12', kenpom: 19, adjEM: 20.9, adjO: 117.1, adjD: 96.2 },
  calBaptist: { id: 'cbu', name: 'Cal Baptist', seed: 13, conference: 'WAC', kenpom: 220, adjEM: -23.4, adjO: 100.1, adjD: 123.5 },
  louisville: { id: 'louisville', name: 'Louisville', seed: 6, conference: 'ACC', kenpom: 30, adjEM: 15.9, adjO: 114.9, adjD: 98.9 },
  southFlorida: { id: 'usf', name: 'South Florida', seed: 11, conference: 'American', kenpom: 68, adjEM: 1.2, adjO: 108.9, adjD: 107.7 },
  michiganState: { id: 'msu', name: 'Michigan St', seed: 3, conference: 'Big Ten', kenpom: 14, adjEM: 24.7, adjO: 119.2, adjD: 94.5 },
  nDakotaSt: { id: 'ndsu', name: 'North Dakota St', seed: 14, conference: 'Summit', kenpom: 250, adjEM: -29.8, adjO: 99.0, adjD: 128.8 },
  ucla: { id: 'ucla', name: 'UCLA', seed: 7, conference: 'Pac-12', kenpom: 37, adjEM: 12.5, adjO: 113.6, adjD: 101.1 },
  ucf: { id: 'ucf', name: 'UCF', seed: 10, conference: 'American', kenpom: 58, adjEM: 5.1, adjO: 110.2, adjD: 105.1 },
  uconn: { id: 'uconn', name: 'UConn', seed: 2, conference: 'Big East', kenpom: 8, adjEM: 30.8, adjO: 122.9, adjD: 92.1 },
  furman: { id: 'furman', name: 'Furman', seed: 15, conference: 'SoCon', kenpom: 285, adjEM: -36.5, adjO: 97.6, adjD: 134.1 },
  michigan: { id: 'michigan', name: 'Michigan', seed: 1, conference: 'Big Ten', kenpom: 3, adjEM: 34.6, adjO: 125.8, adjD: 91.2 },
  georgia: { id: 'georgia', name: 'Georgia', seed: 8, conference: 'SEC', kenpom: 46, adjEM: 9.2, adjO: 111.9, adjD: 102.7 },
  stLouris: { id: 'slu', name: 'Saint Louis', seed: 9, conference: 'A10', kenpom: 52, adjEM: 7.3, adjO: 111.4, adjD: 104.1 },
  texasTech: { id: 'ttech', name: 'Texas Tech', seed: 5, conference: 'Big 12', kenpom: 26, adjEM: 17.8, adjO: 115.5, adjD: 97.7 },
  akron: { id: 'akron', name: 'Akron', seed: 12, conference: 'MAC', kenpom: 195, adjEM: -17.1, adjO: 101.5, adjD: 118.6 },
  alabama: { id: 'alabama', name: 'Alabama', seed: 4, conference: 'SEC', kenpom: 21, adjEM: 20.3, adjO: 116.8, adjD: 96.5 },
  hofstra: { id: 'hofstra', name: 'Hofstra', seed: 13, conference: 'CAA', kenpom: 225, adjEM: -24.7, adjO: 99.9, adjD: 124.6 },
  tennessee: { id: 'tennessee', name: 'Tennessee', seed: 6, conference: 'SEC', kenpom: 32, adjEM: 15.3, adjO: 114.6, adjD: 99.3 },
  tennesseeSt: { id: 'tnst', name: 'Tennessee St', seed: 15, conference: 'OVC', kenpom: 290, adjEM: -37.8, adjO: 97.4, adjD: 135.2 },
  virginia: { id: 'virginia', name: 'Virginia', seed: 3, conference: 'ACC', kenpom: 15, adjEM: 24.1, adjO: 118.7, adjD: 94.6 },
  wrightState: { id: 'wright', name: 'Wright St', seed: 14, conference: 'Horizon', kenpom: 255, adjEM: -31.2, adjO: 98.8, adjD: 130.0 },
  kentucky: { id: 'kentucky', name: 'Kentucky', seed: 7, conference: 'SEC', kenpom: 39, adjEM: 12.0, adjO: 113.3, adjD: 101.3 },
  santaClara: { id: 'sc', name: 'Santa Clara', seed: 10, conference: 'WCC', kenpom: 60, adjEM: 4.8, adjO: 110.0, adjD: 105.2 },
  iowaState: { id: 'isu', name: 'Iowa State', seed: 2, conference: 'Big 12', kenpom: 9, adjEM: 29.5, adjO: 122.3, adjD: 92.8 },
  arizona: { id: 'arizona', name: 'Arizona', seed: 1, conference: 'Pac-12', kenpom: 2, adjEM: 35.9, adjO: 126.4, adjD: 90.5 },
  villanova: { id: 'villanova', name: 'Villanova', seed: 8, conference: 'Big East', kenpom: 45, adjEM: 9.5, adjO: 112.4, adjD: 102.9 },
  utahState: { id: 'usu', name: 'Utah State', seed: 9, conference: 'Mountain West', kenpom: 51, adjEM: 8.0, adjO: 111.8, adjD: 103.8 },
  wisconsin: { id: 'wisconsin', name: 'Wisconsin', seed: 5, conference: 'Big Ten', kenpom: 24, adjEM: 18.9, adjO: 116.2, adjD: 97.3 },
  highPoint: { id: 'highpoint', name: 'High Point', seed: 12, conference: 'Big South', kenpom: 200, adjEM: -18.3, adjO: 101.2, adjD: 119.5 },
  arkansas: { id: 'arkansas', name: 'Arkansas', seed: 4, conference: 'SEC', kenpom: 20, adjEM: 21.1, adjO: 117.4, adjD: 96.3 },
  kennesaw: { id: 'ksu', name: 'Kennesaw St', seed: 14, conference: 'ASUN', kenpom: 260, adjEM: -32.5, adjO: 98.5, adjD: 131.0 },
  byu: { id: 'byu', name: 'BYU', seed: 6, conference: 'Pac-12', kenpom: 31, adjEM: 15.7, adjO: 115.3, adjD: 99.6 },
  missouri: { id: 'mizzou', name: 'Missouri', seed: 10, conference: 'SEC', kenpom: 62, adjEM: 4.2, adjO: 109.8, adjD: 105.6 },
  gonzaga: { id: 'gonzaga', name: 'Gonzaga', seed: 3, conference: 'WCC', kenpom: 11, adjEM: 26.2, adjO: 120.3, adjD: 94.1 },
  miamiFL: { id: 'miami', name: 'Miami FL', seed: 7, conference: 'ACC', kenpom: 38, adjEM: 12.3, adjO: 113.9, adjD: 101.6 },
  purdue: { id: 'purdue', name: 'Purdue', seed: 2, conference: 'Big Ten', kenpom: 6, adjEM: 31.8, adjO: 123.8, adjD: 92.0 },
  queens: { id: 'queens', name: 'Queens', seed: 15, conference: 'ASUN', kenpom: 295, adjEM: -39.1, adjO: 97.1, adjD: 136.2 },
  liu: { id: 'liu', name: 'LIU', seed: 16, conference: 'Northeast', kenpom: 315, adjEM: -45.0, adjO: 94.9, adjD: 139.9 },
};

function createGame(id: string, homeTeam: Team, awayTeam: Team): Game {
  const probs = calculateWinProbability(homeTeam, awayTeam);
  return {
    id,
    homeTeam,
    awayTeam,
    status: 'pending',
    winProbability: {
      home: probs.team1,
      away: probs.team2,
    },
  };
}

export function createInitialBracket(): Bracket {
  const bracket: Bracket = {
    firstFour: [
      createGame('ff-1', TEAMS.howard, TEAMS.florida),
      createGame('ff-2', TEAMS.louisville, TEAMS.houston),
      createGame('ff-3', TEAMS.idaho, TEAMS.nebraska),
      createGame('ff-4', TEAMS.penn, TEAMS.stMary),
    ],
    r64: [
      createGame('s-r64-1', TEAMS.florida, TEAMS.idaho),
      createGame('s-r64-2', TEAMS.clemson, TEAMS.iowa),
      createGame('s-r64-3', TEAMS.vanderbilt, TEAMS.mcneese),
      createGame('s-r64-4', TEAMS.nebraska, TEAMS.troy),
      createGame('s-r64-5', TEAMS.northCarolina, TEAMS.vcu),
      createGame('s-r64-6', TEAMS.illinois, TEAMS.penn),
      createGame('s-r64-7', TEAMS.stMary, TEAMS.texasAM),
      createGame('s-r64-8', TEAMS.houston, TEAMS.idaho),
      createGame('e-r64-1', TEAMS.duke, TEAMS.howard),
      createGame('e-r64-2', TEAMS.ohioState, TEAMS.tcu),
      createGame('e-r64-3', TEAMS.stJohns, TEAMS.northernIowa),
      createGame('e-r64-4', TEAMS.kansas, TEAMS.calBaptist),
      createGame('e-r64-5', TEAMS.louisville, TEAMS.southFlorida),
      createGame('e-r64-6', TEAMS.michiganState, TEAMS.nDakotaSt),
      createGame('e-r64-7', TEAMS.ucla, TEAMS.ucf),
      createGame('e-r64-8', TEAMS.uconn, TEAMS.furman),
      createGame('m-r64-1', TEAMS.michigan, TEAMS.idaho),
      createGame('m-r64-2', TEAMS.georgia, TEAMS.stLouris),
      createGame('m-r64-3', TEAMS.alabama, TEAMS.hofstra),
      createGame('m-r64-4', TEAMS.virginia, TEAMS.wrightState),
      createGame('m-r64-5', TEAMS.tennessee, TEAMS.tennesseeSt),
      createGame('m-r64-6', TEAMS.iowaState, TEAMS.akron),
      createGame('m-r64-7', TEAMS.kentucky, TEAMS.santaClara),
      createGame('m-r64-8', TEAMS.texasTech, TEAMS.stLouris),
      createGame('w-r64-1', TEAMS.arizona, TEAMS.liu),
      createGame('w-r64-2', TEAMS.villanova, TEAMS.utahState),
      createGame('w-r64-3', TEAMS.wisconsin, TEAMS.highPoint),
      createGame('w-r64-4', TEAMS.arkansas, TEAMS.kennesaw),
      createGame('w-r64-5', TEAMS.byu, TEAMS.queens),
      createGame('w-r64-6', TEAMS.gonzaga, TEAMS.calBaptist),
      createGame('w-r64-7', TEAMS.miamiFL, TEAMS.missouri),
      createGame('w-r64-8', TEAMS.purdue, TEAMS.queens),
    ],
    r32: Array(16).fill(null).map((_, i) => ({
      id: `r32-${i}`,
      homeTeam: TEAMS.florida,
      awayTeam: TEAMS.florida,
      status: 'pending' as const,
    })),
    sweet16: Array(8).fill(null).map((_, i) => ({
      id: `s16-${i}`,
      homeTeam: TEAMS.florida,
      awayTeam: TEAMS.florida,
      status: 'pending' as const,
    })),
    elite8: Array(4).fill(null).map((_, i) => ({
      id: `e8-${i}`,
      homeTeam: TEAMS.florida,
      awayTeam: TEAMS.florida,
      status: 'pending' as const,
    })),
    finalFour: Array(2).fill(null).map((_, i) => ({
      id: `ff-s-${i}`,
      homeTeam: TEAMS.florida,
      awayTeam: TEAMS.florida,
      status: 'pending' as const,
    })),
    championship: {
      id: 'championship',
      homeTeam: TEAMS.florida,
      awayTeam: TEAMS.florida,
      status: 'pending' as const,
    },
  };

  return bracket;
}

export { TEAMS };
