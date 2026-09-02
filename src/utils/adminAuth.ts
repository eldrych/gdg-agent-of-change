const SUPER_ADMIN_CREDENTIALS = {
  username: 'gdgbacolod26',
  password: 'kentouchth!$@2026',
};

const ADMIN_SESSION_KEY = 'event_super_admin_session_v1';

export function verifySuperAdmin(usernameInput: string, passwordInput: string): boolean {
  return (
    usernameInput.trim() === SUPER_ADMIN_CREDENTIALS.username &&
    passwordInput === SUPER_ADMIN_CREDENTIALS.password
  );
}

export function isSuperAdminAuthenticated(): boolean {
  try {
    const val = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export function setSuperAdminAuthenticated(val: boolean): void {
  try {
    if (val) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    // Ignore error
  }
}

export function getSuperAdminCredentialsHint() {
  return {
    username: SUPER_ADMIN_CREDENTIALS.username,
    password: SUPER_ADMIN_CREDENTIALS.password,
  };
}
