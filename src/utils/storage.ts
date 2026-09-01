import { Booth, Attendee, Scan, TierInfo, ScanResult } from '../types';

const STORAGE_KEYS = {
  BOOTHS: 'booth_event_booths_v1',
  ATTENDEES: 'booth_event_attendees_v1',
  SCANS: 'booth_event_scans_v1',
  SESSION: 'booth_active_session_v1',
  SOUND_ENABLED: 'booth_sound_enabled_v1',
};

export const TIERS_CONFIG: TierInfo[] = [
  {
    tierNumber: 1,
    label: 'Tier 1 (Early Bird)',
    minVisits: 1,
    maxVisits: 10,
    points: 100,
    badgeColor: 'emerald',
  },
  {
    tierNumber: 2,
    label: 'Tier 2 (Prime Time)',
    minVisits: 11,
    maxVisits: 50,
    points: 85,
    badgeColor: 'blue',
  },
  {
    tierNumber: 3,
    label: 'Tier 3 (Rush Hour)',
    minVisits: 51,
    maxVisits: 90,
    points: 65,
    badgeColor: 'amber',
  },
  {
    tierNumber: 4,
    label: 'Tier 4 (Standard Visit)',
    minVisits: 91,
    maxVisits: null,
    points: 45,
    badgeColor: 'purple',
  },
];

export const INITIAL_BOOTHS: Booth[] = [
  {
    id: 'Booth1',
    name: 'Booth 1: AI & Robotics Innovation',
    category: 'Robotics & AI',
    location: 'Hall A - Stand 101',
    description: 'Autonomous robotics, humanoid agents, and edge computing demonstrations.',
  },
  {
    id: 'Booth2',
    name: 'Booth 2: Cloud & DevOps Infrastructure',
    category: 'Cloud Architecture',
    location: 'Hall A - Stand 102',
    description: 'Kubernetes orchestration, serverless microservices, and CI/CD pipelines.',
  },
  {
    id: 'Booth3',
    name: 'Booth 3: Cyber Security & Zero Trust',
    category: 'Security & Auth',
    location: 'Hall A - Stand 103',
    description: 'Threat hunting, biometric authentication, and penetration testing demos.',
  },
  {
    id: 'Booth4',
    name: 'Booth 4: Quantum Computing & Hardware',
    category: 'Quantum Tech',
    location: 'Hall B - Stand 201',
    description: 'Superconducting qubits, cryogenic processors, and algorithm speedups.',
  },
  {
    id: 'Booth5',
    name: 'Booth 5: Mobile & Web Technologies',
    category: 'Modern Web & App',
    location: 'Hall B - Stand 202',
    description: 'Cross-platform mobile frameworks, PWA innovations, and WebAssembly.',
  },
  {
    id: 'Booth6',
    name: 'Booth 6: BioTech & Health Analytics',
    category: 'HealthTech',
    location: 'Hall B - Stand 203',
    description: 'Genomic data modeling, telehealth wearables, and diagnostic AI models.',
  },
  {
    id: 'Booth7',
    name: 'Booth 7: Gaming & XR Simulation',
    category: 'XR / VR / Gaming',
    location: 'Hall C - Stand 301',
    description: 'Immersive spatial computing, Unreal Engine live render, and haptic feedback.',
  },
  {
    id: 'Booth8',
    name: 'Booth 8: CleanTech & Green Energy',
    category: 'Sustainability',
    location: 'Hall C - Stand 302',
    description: 'Smart grid management, solar efficiency tech, and carbon capture analytics.',
  },
  {
    id: 'Booth9',
    name: 'Booth 9: Data Science & Predictive ML',
    category: 'Data & Analytics',
    location: 'Hall C - Stand 303',
    description: 'Real-time ETL data pipelines, predictive forecasting, and vector embeddings.',
  },
  {
    id: 'Booth10',
    name: 'Booth 10: FinTech & Decentralized Systems',
    category: 'Finance & Web3',
    location: 'Hall C - Stand 304',
    description: 'Instant settlement networks, smart contracts, and algorithmic liquidity.',
  },
];

const INITIAL_ATTENDEES: Attendee[] = [
  { id: 'QR-attendee1', name: 'Alex Johnson', company: 'Nova Labs', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee2', name: 'Samantha Chen', company: 'Apex Systems', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee3', name: 'Marcus Rivera', company: 'OmniCorp', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee4', name: 'Elena Rostova', company: 'Aero Dynamics', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee5', name: 'Devon Patel', company: 'Synthetix AI', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee6', name: 'Zoe Nakamura', company: 'PixelForge', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee7', name: 'Liam O\'Connor', company: 'BioVanguard', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee8', name: 'Priya Sharma', company: 'QuantumScale', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee9', name: 'Lucas Silva', company: 'Veritas Security', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee10', name: 'Chloe Dubois', company: 'HyperLink Inc', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee11', name: 'Tariq Al-Mansoor', company: 'FinPulse', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee12', name: 'Ingrid Hansen', company: 'Nordic CleanTech', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee13', name: 'Kenji Takahashi', company: 'CyberDynamics', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee14', name: 'Maya Lin', company: 'CloudMatrix', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee15', name: 'Carlos Mendez', company: 'EcoEngineers', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee16', name: 'Aisha Bello', company: 'AfroTech Innovations', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee17', name: 'Felix Weber', company: 'Bavaria Robotics', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee18', name: 'Grace Hopper Fan', company: 'CompSci Vanguard', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee19', name: 'Noah Miller', company: 'NextGen Silicon', total_points: 0, created_at: new Date().toISOString() },
  { id: 'QR-attendee20', name: 'Sofia Kowalski', company: 'Quantum Horizon', total_points: 0, created_at: new Date().toISOString() },
];

export function getBooths(): Booth[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOTHS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BOOTHS, JSON.stringify(INITIAL_BOOTHS));
      return INITIAL_BOOTHS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOTHS;
  }
}

export function getBoothById(id: string): Booth | undefined {
  const booths = getBooths();
  const normalized = id.trim().toLowerCase();
  return booths.find(b => b.id.toLowerCase() === normalized);
}

export function getAttendees(): Record<string, Attendee> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDEES);
    if (!raw) {
      const map: Record<string, Attendee> = {};
      INITIAL_ATTENDEES.forEach(att => {
        map[att.id] = att;
      });
      localStorage.setItem(STORAGE_KEYS.ATTENDEES, JSON.stringify(map));
      return map;
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getAttendee(id: string): Attendee | undefined {
  const attendees = getAttendees();
  return attendees[id];
}

export function saveAttendee(attendee: Attendee): void {
  const attendees = getAttendees();
  attendees[attendee.id] = attendee;
  localStorage.setItem(STORAGE_KEYS.ATTENDEES, JSON.stringify(attendees));
}

export function getScans(): Scan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCANS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getScansForBooth(boothId: string): Scan[] {
  const scans = getScans();
  return scans.filter(s => s.booth_id.toLowerCase() === boothId.toLowerCase());
}

export function getScansForAttendee(attendeeId: string): Scan[] {
  const scans = getScans();
  return scans.filter(s => s.attendee_id === attendeeId);
}

export function getUniqueVisitorCountForBooth(boothId: string): number {
  const boothScans = getScansForBooth(boothId);
  const uniqueAttendees = new Set(boothScans.map(s => s.attendee_id));
  return uniqueAttendees.size;
}

export function getTierForRank(rank: number): TierInfo {
  if (rank <= 10) return TIERS_CONFIG[0];
  if (rank <= 50) return TIERS_CONFIG[1];
  if (rank <= 90) return TIERS_CONFIG[2];
  return TIERS_CONFIG[3];
}

export function getCurrentActiveTierForBooth(boothId: string): {
  currentRankForNextScan: number;
  activeTier: TierInfo;
  currentVisitorsCount: number;
  pointsForNextScan: number;
  nextTierStartsAt: number | null;
  visitsUntilNextTier: number | null;
} {
  const currentVisitorsCount = getUniqueVisitorCountForBooth(boothId);
  const currentRankForNextScan = currentVisitorsCount + 1;
  const activeTier = getTierForRank(currentRankForNextScan);

  let nextTierStartsAt: number | null = null;
  let visitsUntilNextTier: number | null = null;

  if (activeTier.maxVisits !== null) {
    nextTierStartsAt = activeTier.maxVisits + 1;
    visitsUntilNextTier = activeTier.maxVisits - currentVisitorsCount;
  }

  return {
    currentRankForNextScan,
    activeTier,
    currentVisitorsCount,
    pointsForNextScan: activeTier.points,
    nextTierStartsAt,
    visitsUntilNextTier,
  };
}

/**
 * Business Logic & Scoring Rules:
 * 1. Unique Visit Rule: Attendee can only earn points once per booth.
 * 2. Per-Booth Visitor Counter: Track cumulative number of unique attendees who visited this booth.
 * 3. Point Tiers:
 *    - Visits 1 – 10: 100 points
 *    - Visits 11 – 50: 85 points
 *    - Visits 51 – 90: 65 points
 *    - Visits 91+: 45 points
 */
export function processScan(boothId: string, rawAttendeeInput: string): ScanResult {
  const trimmedInput = rawAttendeeInput.trim();
  if (!trimmedInput) {
    return {
      success: false,
      message: 'Invalid QR code: Empty data received.',
      attendeeId: '',
      timestamp: new Date().toISOString(),
    };
  }

  // Support QR codes formatted like "QR-attendee1", json '{"id":"QR-attendee1"}', or raw string
  let attendeeId = trimmedInput;
  try {
    if (trimmedInput.startsWith('{') && trimmedInput.endsWith('}')) {
      const parsed = JSON.parse(trimmedInput);
      if (parsed.id) attendeeId = parsed.id;
      else if (parsed.attendeeId) attendeeId = parsed.attendeeId;
    }
  } catch {
    // raw string is fine
  }

  // Ensure booth exists
  const booth = getBoothById(boothId);
  if (!booth) {
    return {
      success: false,
      message: `Invalid Booth Session: "${boothId}" not found.`,
      attendeeId,
      timestamp: new Date().toISOString(),
    };
  }

  // Check 1: Unique Visit Rule
  const existingScans = getScansForBooth(booth.id);
  const previousScan = existingScans.find(
    s => s.attendee_id.toLowerCase() === attendeeId.toLowerCase()
  );

  if (previousScan) {
    const attendee = getAttendee(attendeeId) || {
      id: attendeeId,
      name: attendeeId,
      total_points: 0,
      created_at: previousScan.timestamp,
    };
    return {
      success: false,
      isDuplicate: true,
      message: 'Attendee already scanned at this booth.',
      attendeeId,
      updatedTotalPoints: attendee.total_points,
      previousScan,
      timestamp: new Date().toISOString(),
      boothName: booth.name,
    };
  }

  // Calculate new visitor rank for this booth
  const currentUniqueCount = existingScans.length;
  const newVisitorRank = currentUniqueCount + 1;
  const tier = getTierForRank(newVisitorRank);
  const pointsToAward = tier.points;

  // Retrieve or Auto-register Attendee
  const attendeesMap = getAttendees();
  let attendee = attendeesMap[attendeeId];
  if (!attendee) {
    // Auto-register attendee
    const formattedName = attendeeId.startsWith('QR-')
      ? `Attendee ${attendeeId.replace('QR-', '')}`
      : attendeeId;

    attendee = {
      id: attendeeId,
      name: formattedName,
      company: 'Event Guest',
      total_points: 0,
      created_at: new Date().toISOString(),
    };
  }

  // Update points
  attendee.total_points += pointsToAward;
  attendeesMap[attendee.id] = attendee;
  localStorage.setItem(STORAGE_KEYS.ATTENDEES, JSON.stringify(attendeesMap));

  // Save scan record
  const newScan: Scan = {
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    attendee_id: attendee.id,
    booth_id: booth.id,
    timestamp: new Date().toISOString(),
    tier_points: pointsToAward,
    visitor_rank: newVisitorRank,
  };

  const allScans = getScans();
  allScans.unshift(newScan);
  localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(allScans));

  return {
    success: true,
    isDuplicate: false,
    message: `Scan successful! Awarded ${pointsToAward} points.`,
    attendeeId: attendee.id,
    pointsAwarded: pointsToAward,
    updatedTotalPoints: attendee.total_points,
    visitorRank: newVisitorRank,
    timestamp: newScan.timestamp,
    boothName: booth.name,
  };
}

export function getActiveSession(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.SESSION);
  } catch {
    return null;
  }
}

export function setActiveSession(boothId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, boothId);
  } catch {
    // Ignore error
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch {
    // Ignore error
  }
}

export function isSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
  } catch {
    // Ignore
  }
}

export function resetAllDataToDefault(): void {
  localStorage.removeItem(STORAGE_KEYS.SCANS);
  localStorage.removeItem(STORAGE_KEYS.ATTENDEES);
  localStorage.removeItem(STORAGE_KEYS.BOOTHS);
  getBooths();
  getAttendees();
}

/**
 * Test helper to populate visits up to a specific number (e.g. 10, 50, 90)
 * to easily test tier transitions!
 */
export function simulateVisitsForBooth(boothId: string, count: number): void {
  const currentScans = getScansForBooth(boothId);
  const currentCount = currentScans.length;
  if (count <= currentCount) return;

  const needed = count - currentCount;
  for (let i = 1; i <= needed; i++) {
    const fakeId = `Simulated-Attendee-${currentCount + i}`;
    processScan(boothId, fakeId);
  }
}
