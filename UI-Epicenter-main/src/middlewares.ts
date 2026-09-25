import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 

const PUBLIC_PATHS = ['/','/panel-feedback']

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl

  // Allow exact public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // Also allow static and image assets
 if (
  pathname.startsWith('/_next/') ||
  pathname === '/favicon.ico' ||
  pathname.startsWith('/images/')
) {
  return NextResponse.next()
}
  

  const token = req.cookies.get('authToken')?.value
  const rolesStr = req.cookies.get('roles')?.value
 

  if (!token || !rolesStr) {
    // Redirect to root login page
    return NextResponse.redirect(new URL('/', req.url))
  }

  const roles = rolesStr.split(',')
  const isApprover = roles.includes('BET Approver');  
  const isAdmin = roles.includes('ADMIN');
  const isPartner = roles.includes('PARTNER');
  
    if (isAdmin) {
    return NextResponse.next();
  }
  
  if (pathname.startsWith('/admin') && !roles.includes('ADMIN')) {
    return NextResponse.rewrite(new URL('/unauthorized', req.url))
  }
 

  const isAllowedApproverPath =
    pathname === '/home/hiring-review-requests' ||
    pathname.startsWith('/home/hiring-review-requests/');

  const isAllowedPartnerPath =  pathname === '/home/candidate-management' || pathname === '/home/partner-slot-management' || pathname.startsWith('/home/candidate-management') || pathname.startsWith('/home/hiring-details') 
  ||  pathname.startsWith('/home/candidate-feedback-review')||  pathname.startsWith('/home/edit-profile') ||  pathname.startsWith('/home/candidate-onboarding');

  // If pathname starts with /home/
  if (isPartner && isAllowedPartnerPath) {
   
    return NextResponse.next();
  }

  if (isPartner && pathname.startsWith('/home')) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));}

  if (isApprover && isAllowedApproverPath) {
    return NextResponse.next();
  }
  if (isApprover && pathname.startsWith('/home')) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }
  // All other protected routes
  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*','/((?!_next|favicon.ico|images).*)','/panel-feedback','/home/:path*'], // apply to all routes
}
