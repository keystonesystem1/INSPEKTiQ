import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next();

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/claims') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/dispatch') ||
    pathname.startsWith('/adjusters') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/billing') ||
    pathname.startsWith('/settings');

  if (isProtected && !request.cookies.get('inspektiq-role')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return response;
}
