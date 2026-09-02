export interface BoothCredential {
  boothId: string;
  index: number;
  username: string;
  password: string;
}

/**
 * Generates credentials for Booth 1 through Booth 10 (and dynamic booth numbers)
 * Username Pattern: gdgbooth001 ... gdgbooth010
 * Password Pattern: booth1-001 ... booth10-010
 */
export function generateBoothCredentials(totalBooths: number = 10): BoothCredential[] {
  const credentials: BoothCredential[] = [];
  for (let i = 1; i <= totalBooths; i++) {
    const padded = String(i).padStart(3, '0');
    credentials.push({
      boothId: `Booth${i}`,
      index: i,
      username: `gdgbooth${padded}`,
      password: `booth${i}-${padded}`,
    });
  }
  return credentials;
}

export const SEEDED_BOOTH_CREDENTIALS = generateBoothCredentials(10);

/**
 * Verify booth login credentials.
 * Returns the matching Booth ID (e.g., "Booth1") if valid, otherwise null.
 */
export function verifyBoothCredentials(
  usernameInput: string,
  passwordInput: string
): { success: boolean; boothId?: string; error?: string } {
  const u = usernameInput.trim().toLowerCase();
  const p = passwordInput.trim();

  if (!u || !p) {
    return { success: false, error: 'Please enter both Username and Password.' };
  }

  // Check known 10 booths or dynamic matching pattern
  const match = SEEDED_BOOTH_CREDENTIALS.find(
    (c) => c.username.toLowerCase() === u && c.password === p
  );

  if (match) {
    return { success: true, boothId: match.boothId };
  }

  // Dynamic regex fallback for higher booth numbers if any (e.g. gdgbooth011 / booth11-011)
  const userRegex = /^gdgbooth(\d{3,})$/i;
  const userMatch = u.match(userRegex);
  if (userMatch) {
    const num = parseInt(userMatch[1], 10);
    const expectedPassword = `booth${num}-${userMatch[1]}`;
    if (p === expectedPassword) {
      return { success: true, boothId: `Booth${num}` };
    }
  }

  return {
    success: false,
    error: 'Invalid Booth credentials. Format: gdgbooth001 / booth1-001 (for Booth 1)',
  };
}

export const BOOTH_SESSION_KEY = 'booth_active_session_v1';
export const BOOTH_AUTH_TOKEN_KEY = 'booth_auth_token_v1';

export interface BoothActiveSessionData {
  boothId: string;
  name: string;
  category: string;
  location: string;
  authenticatedAt: string;
}

export function saveBoothSession(sessionData: BoothActiveSessionData): void {
  try {
    localStorage.setItem(BOOTH_SESSION_KEY, sessionData.boothId);
    localStorage.setItem(BOOTH_AUTH_TOKEN_KEY, JSON.stringify(sessionData));
  } catch (err) {
    console.error('Failed to save booth session:', err);
  }
}

export function getBoothSession(): BoothActiveSessionData | null {
  try {
    const raw = localStorage.getItem(BOOTH_AUTH_TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearBoothSession(): void {
  try {
    localStorage.removeItem(BOOTH_SESSION_KEY);
    localStorage.removeItem(BOOTH_AUTH_TOKEN_KEY);
  } catch {
    // Ignore error
  }
}
