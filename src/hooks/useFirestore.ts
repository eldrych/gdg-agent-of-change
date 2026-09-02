import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Booth, Attendee, Scan, ScanResult } from '../types';
import { getTierForRank, INITIAL_BOOTHS } from '../utils/storage';
import { getActiveEventId } from '../utils/events';

export function useBooths() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState(getActiveEventId());

  useEffect(() => {
    const handleEventChange = () => {
      setEventId(getActiveEventId());
      setLoading(true);
    };
    window.addEventListener('event_changed', handleEventChange);

    const q = query(collection(db, 'booths'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeEventId = getActiveEventId();
      const b: Booth[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as Booth;
        if (!data.event_id || data.event_id === activeEventId) {
          b.push(data);
        }
      });
      setBooths(b.sort((a, b) => a.id.localeCompare(b.id)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'booths');
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('event_changed', handleEventChange);
    };
  }, [eventId]);

  return { booths, loading };
}

export function useScansForBooth(boothId: string) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [eventId, setEventId] = useState(getActiveEventId());
  
  useEffect(() => {
    if (!boothId) return;
    const handleEventChange = () => {
      setEventId(getActiveEventId());
      setScans([]);
    };
    window.addEventListener('event_changed', handleEventChange);

    const q = query(collection(db, 'scans'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeEventId = getActiveEventId();
      const s: Scan[] = [];
      snapshot.forEach(doc => {
        const scan = doc.data() as Scan;
        if (scan.booth_id.toLowerCase() === boothId.toLowerCase()) {
          if (!scan.event_id || scan.event_id === activeEventId) {
            s.push(scan);
          }
        }
      });
      // Sort descending by timestamp
      s.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setScans(s);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'scans'));

    return () => {
      unsubscribe();
      window.removeEventListener('event_changed', handleEventChange);
    };
  }, [boothId, eventId]);

  return scans;
}

export function useAttendees() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [eventId, setEventId] = useState(getActiveEventId());
  
  useEffect(() => {
    const handleEventChange = () => {
      setEventId(getActiveEventId());
      setAttendees([]);
    };
    window.addEventListener('event_changed', handleEventChange);

    const q = query(collection(db, 'attendees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeEventId = getActiveEventId();
      const a: Attendee[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as Attendee;
        if (!data.event_id || data.event_id === activeEventId) {
          a.push(data);
        }
      });
      setAttendees(a);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendees'));

    return () => {
      unsubscribe();
      window.removeEventListener('event_changed', handleEventChange);
    };
  }, [eventId]);

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

  const activeEventId = getActiveEventId();
  // Scope the attendeeId to the eventId to avoid cross-event collisions
  const docAttendeeId = `${activeEventId}_${attendeeId}`;

  try {
    const scansQuery = query(collection(db, 'scans'));
    const scansSnap = await getDocs(scansQuery);
    let previousScan: Scan | null = null;
    let currentUniqueCount = 0;
    const uniqueAttendees = new Set<string>();
    
    scansSnap.forEach(doc => {
      const scan = doc.data() as Scan;
      if (scan.booth_id.toLowerCase() === boothId.toLowerCase() && (!scan.event_id || scan.event_id === activeEventId)) {
        uniqueAttendees.add(scan.attendee_id);
        if (scan.attendee_id.toLowerCase() === attendeeId.toLowerCase()) {
          previousScan = scan;
        }
      }
    });

    currentUniqueCount = uniqueAttendees.size;

    let attendeeData: Attendee | null = null;
    const attendeeRef = doc(db, 'attendees', docAttendeeId);
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
    const now = new Date().toISOString();

    if (!attendeeData) {
      const formattedName = attendeeId.startsWith('QR-') ? `Attendee ${attendeeId.replace('QR-', '')}` : attendeeId;
      attendeeData = {
        id: attendeeId, // Store original ID for UI
        name: formattedName,
        company: 'Event Guest',
        total_points: pointsToAward,
        created_at: now,
        last_updated_timestamp: now,
        event_id: activeEventId,
      };
      batch.set(attendeeRef, attendeeData);
    } else {
      attendeeData.total_points += pointsToAward;
      attendeeData.last_updated_timestamp = now;
      batch.update(attendeeRef, { 
        total_points: attendeeData.total_points,
        last_updated_timestamp: now
      });
    }

    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newScan: Scan = {
      id: scanId,
      attendee_id: attendeeId,
      booth_id: boothId,
      timestamp: now,
      tier_points: pointsToAward,
      visitor_rank: newVisitorRank,
      event_id: activeEventId,
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
    const activeEventId = getActiveEventId();
    const boothsQuery = query(collection(db, 'booths'));
    const boothsSnap = await getDocs(boothsQuery);
    
    // Check if we already have booths for THIS event
    let hasEventBooths = false;
    boothsSnap.forEach(doc => {
      const data = doc.data() as Booth;
      if (data.event_id === activeEventId) {
        hasEventBooths = true;
      }
    });

    if (!hasEventBooths) {
      const batch = writeBatch(db);
      INITIAL_BOOTHS.forEach(b => {
        // use a composite ID so we don't overwrite other events' booths
        const docId = `${activeEventId}_${b.id}`;
        const ref = doc(db, 'booths', docId);
        batch.set(ref, { ...b, id: b.id, event_id: activeEventId });
      });
      await batch.commit();
      console.log(`Seeded booths successfully for event ${activeEventId}!`);
    }
  } catch (err) {
    console.error('Failed to seed booths', err);
  }
}

