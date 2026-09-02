export interface Booth {
  id: string;
  name: string;
  category?: string;
  location?: string;
  description?: string;
  total_unique_scans?: number;
  event_id?: string;
}

export interface Attendee {
  id: string;
  name: string;
  email?: string;
  company?: string;
  qr_code_id?: string;
  total_points: number;
  created_at: string;
  last_updated_timestamp?: string;
  event_id?: string;
}

export interface Scan {
  id: string;
  attendee_id: string;
  booth_id: string;
  timestamp: string;
  tier_points: number;
  points_awarded?: number;
  visitor_rank: number;
  event_id?: string;
}

export interface TierInfo {
  tierNumber: number;
  label: string;
  minVisits: number;
  maxVisits: number | null;
  points: number;
  badgeColor: string;
}

export interface ScanResult {
  success: boolean;
  isDuplicate?: boolean;
  message: string;
  attendeeId: string;
  pointsAwarded?: number;
  updatedTotalPoints?: number;
  visitorRank?: number;
  previousScan?: Scan;
  timestamp: string;
  boothName?: string;
}
