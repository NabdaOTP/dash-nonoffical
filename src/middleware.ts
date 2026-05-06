import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const TOKEN_COOKIE = 'nadba-token';
const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password'];

function isAuthPage(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/';
  return AUTH_PAGES.some((page) =>
    withoutLocale === page || withoutLocale.startsWith(page + '/')
  );
}

function getRoleFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    );
    return decoded?.role ?? null;
  } catch {
    return null;
  }
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (token && isAuthPage(pathname)) {
    const locale = pathname.split('/')[1] || routing.defaultLocale;
    const role = getRoleFromToken(token);
    const redirectPath = role === 'ADMIN' ? `/${locale}/admin` : `/${locale}/dashboard`;
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};