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

export function useAllScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState(getActiveEventId());

  useEffect(() => {
    const handleEventChange = () => {
      setEventId(getActiveEventId());
      setScans([]);
      setLoading(true);
    };
    window.addEventListener('event_changed', handleEventChange);

    const q = query(collection(db, 'scans'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeEventId = getActiveEventId();
      const s: Scan[] = [];
      snapshot.forEach(doc => {
        const scan = doc.data() as Scan;
        if (!scan.event_id || scan.event_id === activeEventId) {
          s.push(scan);
        }
      });
      s.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setScans(s);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scans');
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('event_changed', handleEventChange);
    };
  }, [eventId]);

  return { scans, loading };
}

export async function adminAdjustUserPoints(attendeeId: string, deltaPoints: number): Promise<void> {
  const activeEventId = getActiveEventId();
  const docAttendeeId = `${activeEventId}_${attendeeId}`;
  const attendeeRef = doc(db, 'attendees', docAttendeeId);
  const snap = await getDoc(attendeeRef);
  const now = new Date().toISOString();

  if (snap.exists()) {
    const current = snap.data() as Attendee;
    const updated = Math.max(0, (current.total_points || 0) + deltaPoints);
    await writeBatch(db).update(attendeeRef, {
      total_points: updated,
      last_updated_timestamp: now,
    }).commit();
  }
}

export async function adminSetUserPoints(attendeeId: string, newTotalPoints: number): Promise<void> {
  const activeEventId = getActiveEventId();
  const docAttendeeId = `${activeEventId}_${attendeeId}`;
  const attendeeRef = doc(db, 'attendees', docAttendeeId);
  const now = new Date().toISOString();

  await writeBatch(db).update(attendeeRef, {
    total_points: Math.max(0, newTotalPoints),
    last_updated_timestamp: now,
  }).commit();
}

export async function adminUpdateUserProfile(attendeeId: string, data: { name: string; qr_code_id?: string; company?: string }): Promise<void> {
  const activeEventId = getActiveEventId();
  const docAttendeeId = `${activeEventId}_${attendeeId}`;
  const attendeeRef = doc(db, 'attendees', docAttendeeId);
  const now = new Date().toISOString();

  const updatePayload: any = {
    name: data.name.trim(),
    last_updated_timestamp: now,
  };
  if (data.qr_code_id !== undefined) {
    updatePayload.qr_code_id = data.qr_code_id.trim();
  }
  if (data.company !== undefined) {
    updatePayload.company = data.company.trim();
  }

  await writeBatch(db).update(attendeeRef, updatePayload).commit();
}

export async function adminUpdateBoothDetails(
  boothId: string,
  data: { name: string; category?: string; location?: string; description?: string }
): Promise<void> {
  const activeEventId = getActiveEventId();
  const docBoothId = `${activeEventId}_${boothId}`;
  const boothRef = doc(db, 'booths', docBoothId);
  const snap = await getDoc(boothRef);

  const cleanName = data.name.trim();
  const cleanCategory = (data.category || '').trim() || 'General';
  const cleanLocation = (data.location || '').trim() || 'Exhibition Hall';
  const cleanDesc = (data.description !== undefined ? data.description.trim() : '');

  if (snap.exists()) {
    const existing = snap.data() as Booth;
    await writeBatch(db).update(boothRef, {
      name: cleanName,
      category: cleanCategory,
      location: cleanLocation,
      description: cleanDesc || existing.description || 'Exhibition Booth',
    }).commit();
  } else {
    // Check fallback doc with un-prefixed ID
    const fallbackRef = doc(db, 'booths', boothId);
    const fallbackSnap = await getDoc(fallbackRef);
    if (fallbackSnap.exists()) {
      const existing = fallbackSnap.data() as Booth;
      await writeBatch(db).update(fallbackRef, {
        name: cleanName,
        category: cleanCategory,
        location: cleanLocation,
        description: cleanDesc || existing.description || 'Exhibition Booth',
      }).commit();
    } else {
      const newBooth: Booth = {
        id: boothId,
        name: cleanName,
        category: cleanCategory,
        location: cleanLocation,
        description: cleanDesc || 'Exhibition Booth',
        event_id: activeEventId,
      };
      await writeBatch(db).set(boothRef, newBooth).commit();
    }
  }

  // Update in localStorage fallback
  try {
    const raw = localStorage.getItem('booth_event_booths_v1');
    if (raw) {
      const list = JSON.parse(raw) as Booth[];
      const idx = list.findIndex((b) => b.id.toLowerCase() === boothId.toLowerCase());
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          name: cleanName,
          category: cleanCategory,
          location: cleanLocation,
          description: cleanDesc || list[idx].description,
        };
        localStorage.setItem('booth_event_booths_v1', JSON.stringify(list));
      }
    }
  } catch (err) {
    console.error('LocalStorage booth update sync error:', err);
  }
}

export async function adminDeleteUser(attendeeId: string): Promise<void> {
  const activeEventId = getActiveEventId();
  const docAttendeeId = `${activeEventId}_${attendeeId}`;
  const attendeeRef = doc(db, 'attendees', docAttendeeId);
  
  const batch = writeBatch(db);
  batch.delete(attendeeRef);

  // Also remove scans associated with this user
  const scansQ = query(collection(db, 'scans'));
  const snap = await getDocs(scansQ);
  snap.forEach(d => {
    const s = d.data() as Scan;
    if (s.attendee_id === attendeeId && (!s.event_id || s.event_id === activeEventId)) {
      batch.delete(doc(db, 'scans', d.id));
    }
  });

  await batch.commit();
}

export async function adminDeleteScan(scanId: string, attendeeId: string, pointsAwarded: number): Promise<void> {
  const activeEventId = getActiveEventId();
  const docAttendeeId = `${activeEventId}_${attendeeId}`;
  const attendeeRef = doc(db, 'attendees', docAttendeeId);
  const scanRef = doc(db, 'scans', scanId);

  const batch = writeBatch(db);
  batch.delete(scanRef);

  const attendeeSnap = await getDoc(attendeeRef);
  if (attendeeSnap.exists()) {
    const current = attendeeSnap.data() as Attendee;
    const newTotal = Math.max(0, (current.total_points || 0) - pointsAwarded);
    batch.update(attendeeRef, {
      total_points: newTotal,
      last_updated_timestamp: new Date().toISOString(),
    });
  }

  await batch.commit();
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
      else if (parsed.qr_code_id) attendeeId = parsed.qr_code_id;
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
        qr_code_id: attendeeId,
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
        last_updated_timestamp: now,
        qr_code_id: attendeeData.qr_code_id || attendeeId,
      });
    }

    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newScan: Scan = {
      id: scanId,
      attendee_id: attendeeId,
      booth_id: boothId,
      timestamp: now,
      tier_points: pointsToAward,
      points_awarded: pointsToAward,
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

