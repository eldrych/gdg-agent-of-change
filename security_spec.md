# Security Spec

## 1. Data Invariants
- Booths: Can be read by anyone, but created/updated only by verified users.
- Attendees: Can be created/updated by verified users (booth operators) and read by anyone (for leaderboard).
- Scans: Can be created by verified users. Read by anyone.

## 2. Dirty Dozen Payloads
(Assuming these test attempts)
1. Unauthenticated write to scans
2. Unverified email write to scans
3. Missing required fields in scan
4. Invalid type in scan points
5. ID poisoning on scan
6. Unauthenticated update to attendee
7. Shadow field on attendee
8. Unauthenticated read of booths
...

## 3. Test Runner
We will generate the rules and test them.
