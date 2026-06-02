const USER_TOKEN_KEY = "nadba-token";
const USER_TOKEN_COOKIE = "nadba-token";
const INSTANCE_TOKEN_KEY = "nadba-instance-token";
const ADMIN_BACKUP_TOKEN_KEY = "nadba-impersonator-token";
const IMPERSONATION_INFO_KEY = "nadba-impersonation-info";

export interface ImpersonationUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
}

export interface ImpersonationInfo {
    user: ImpersonationUser;
    actor: ImpersonationUser;
}

// cookie helpers
function setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// start impersonation 
export function startImpersonation(
    accessToken: string,
    info: ImpersonationInfo
) {
    // 1. save the admin's current token so we can restore it later
    const adminToken = localStorage.getItem(USER_TOKEN_KEY);
    if (adminToken) {
        localStorage.setItem(ADMIN_BACKUP_TOKEN_KEY, adminToken);
    }

    // 2. clear any instance-scoped token (different user = different instances)
    localStorage.removeItem(INSTANCE_TOKEN_KEY);
    deleteCookie(INSTANCE_TOKEN_KEY);

    // 3. set the impersonated user's token
    localStorage.setItem(USER_TOKEN_KEY, accessToken);
    setCookie(USER_TOKEN_COOKIE, accessToken, 7);

    // 4. store impersonation metadata for the banner
    localStorage.setItem(IMPERSONATION_INFO_KEY, JSON.stringify(info));
}

// stop impersonation 
export function stopImpersonation() {
    // 1. Restore the admin's original token
    const adminToken = localStorage.getItem(ADMIN_BACKUP_TOKEN_KEY);
    if (adminToken) {
        localStorage.setItem(USER_TOKEN_KEY, adminToken);
        setCookie(USER_TOKEN_COOKIE, adminToken, 7);
    }

    // 2. Clean up all impersonation data
    localStorage.removeItem(ADMIN_BACKUP_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATION_INFO_KEY);
    localStorage.removeItem(INSTANCE_TOKEN_KEY);
    deleteCookie(INSTANCE_TOKEN_KEY);
}

// check if currently impersonating 
export function isImpersonating(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ADMIN_BACKUP_TOKEN_KEY) !== null;
}

// get impersonation info for the banner 
export function getImpersonationInfo(): ImpersonationInfo | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(IMPERSONATION_INFO_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}