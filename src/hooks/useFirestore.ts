import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, setDoc, doc, updateDoc, getDoc, getDocs, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Booth, Attendee, Scan, TierInfo, ScanResult } from '../types';
import { TIERS_CONFIG, getTierForRank, INITIAL_BOOTHS } from '../utils/storage';

export function useBooths() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'booths'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const b: Booth[] = [];
      snapshot.forEach(doc => b.push(doc.data() as Booth));
      setBooths(b.sort((a, b) => a.id.localeCompare(b.id)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'booths');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { booths, loading };
}

export function useScansForBooth(boothId: string) {
  const [scans, setScans] = useState<Scan[]>([]);
  
  useEffect(() => {
    if (!boothId) return;
    const q = query(collection(db, 'scans'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const s: Scan[] = [];
      snapshot.forEach(doc => {
        const scan = doc.data() as Scan;
        if (scan.booth_id.toLowerCase() === boothId.toLowerCase()) {
          s.push(scan);
        }
      });
      // Sort descending by timestamp
      s.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setScans(s);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'scans'));

    return unsubscribe;
  }, [boothId]);

  return scans;
}

export function useAttendees() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, 'attendees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const a: Attendee[] = [];
      snapshot.forEach(doc => a.push(doc.data() as Attendee));
      setAttendees(a);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendees'));

    return unsubscribe;
  }, []);

  return attendees;
}

export async function processScanFirebase(boothId: string, rawAttendeeInput: string, boothName: string): Promise<ScanResult> {
  const trimmedInput = rawAttendeeInput.trim();
  if (!trimmedInput) {
    return {
      success: false,
      message: 'Invalid QR code: Empty data received.',
      attendeeId: '',
      timestamp: new Date().toISOString(),
    };
  }

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

  try {
    // We should use a transaction or batch to ensure atomicity, but for simplicity we will just do reads then a batch write
    
    // 1. Get all scans for this attendee at this booth
    const scansQuery = query(collection(db, 'scans'));
    const scansSnap = await getDocs(scansQuery);
    let previousScan: Scan | null = null;
    let currentUniqueCount = 0;
    const uniqueAttendees = new Set<string>();
    
    scansSnap.forEach(doc => {
      const scan = doc.data() as Scan;
      if (scan.booth_id.toLowerCase() === boothId.toLowerCase()) {
        uniqueAttendees.add(scan.attendee_id);
        if (scan.attendee_id.toLowerCase() === attendeeId.toLowerCase()) {
          previousScan = scan;
        }
      }
    });

    currentUniqueCount = uniqueAttendees.size;

    let attendeeData: Attendee | null = null;
    const attendeeRef = doc(db, 'attendees', attendeeId);
    const attendeeSnap = await getDoc(attendeeRef);
    if (attendeeSnap.exists()) {
      attendeeData = attendeeSnap.data() as Attendee;
    }

    if (previousScan) {
      const pt = attendeeData?.total_points || 0;
      return {
        success: false,
        isDuplicate: true,
        message: 'Attendee already scanned at this booth.',
        attendeeId,
        updatedTotalPoints: pt,
        previousScan: previousScan,
        timestamp: new Date().toISOString(),
        boothName: boothName,
      };
    }

    const newVisitorRank = currentUniqueCount + 1;
    const tier = getTierForRank(newVisitorRank);
    const pointsToAward = tier.points;

    const batch = writeBatch(db);

    if (!attendeeData) {
      const formattedName = attendeeId.startsWith('QR-') ? `Attendee ${attendeeId.replace('QR-', '')}` : attendeeId;
      attendeeData = {
        id: attendeeId,
        name: formattedName,
        company: 'Event Guest',
        total_points: pointsToAward,
        created_at: new Date().toISOString(),
      };
      batch.set(attendeeRef, attendeeData);
    } else {
      attendeeData.total_points += pointsToAward;
      batch.update(attendeeRef, { total_points: attendeeData.total_points });
    }

    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newScan: Scan = {
      id: scanId,
      attendee_id: attendeeId,
      booth_id: boothId,
      timestamp: new Date().toISOString(),
      tier_points: pointsToAward,
      visitor_rank: newVisitorRank,
    };
    
    const scanRef = doc(db, 'scans', scanId);
    batch.set(scanRef, newScan);

    await batch.commit();

    return {
      success: true,
      isDuplicate: false,
      message: `Scan successful! Awarded ${pointsToAward} points.`,
      attendeeId: attendeeId,
      pointsAwarded: pointsToAward,
      updatedTotalPoints: attendeeData.total_points,
      visitorRank: newVisitorRank,
      timestamp: newScan.timestamp,
      boothName: boothName,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'scans/attendees');
    throw err;
  }
}

export async function seedBooths() {
  try {
    const boothsQuery = query(collection(db, 'booths'));
    const boothsSnap = await getDocs(boothsQuery);
    if (boothsSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_BOOTHS.forEach(b => {
        const ref = doc(db, 'booths', b.id);
        batch.set(ref, b);
      });
      await batch.commit();
      console.log('Seeded booths successfully!');
    }
  } catch (err) {
    console.error('Failed to seed booths', err);
  }
}
