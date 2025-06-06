// PRD: Auth
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/slices/authSlice';

interface AuthGuardProps {
    children: React.ReactNode;
}

/**
 * AuthGuard component that protects routes by ensuring the user is authenticated
 * Redirects to the login page if the user is not authenticated
 */
export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, getSession } = useAuthStore();
    const [verified, setVerified] = useState(false);
    const redirectedRef = useRef(false);

    // These routes don't require authentication
    const isPublicRoute = (path: string) => {
        const publicRoutes = [
            '/',
            '/login',
            '/signup',
            '/auth/verify',
            '/auth/reset',
            '/api',
            '/explore'
        ];

        return publicRoutes.some(route => {
            if (path === route) return true;
            if (route.endsWith('/') && path.startsWith(route)) return true;
            return false;
        });
    };

    useEffect(() => {
        // Reset redirect flag on route change
        redirectedRef.current = false;

        // Skip auth check for public routes
        if (isPublicRoute(pathname || '')) {
            console.log(`AuthGuard: ${pathname} is a public route, allowing access`);
            setVerified(true);
            return;
        }

        // If user is already authenticated, allow access immediately
        if (isAuthenticated) {
            console.log(`AuthGuard: User is authenticated, allowing access to ${pathname}`);
            setVerified(true);
            return;
        }

        // For protected routes, check authentication
        const checkAuth = async () => {
            try {
                console.log(`AuthGuard: Checking auth for protected route ${pathname}`);
                const valid = await getSession();

                if (valid) {
                    console.log('AuthGuard: Session is valid');
                    setVerified(true);
                } else if (!redirectedRef.current) {
                    console.log('AuthGuard: Not authenticated, redirecting to login');
                    redirectedRef.current = true;
                    router.replace(`/login?redirect=${encodeURIComponent(pathname || '')}`);
                }
            } catch (error) {
                console.error('AuthGuard: Auth check failed', error);
                if (!redirectedRef.current) {
                    redirectedRef.current = true;
                    router.replace('/login');
                }
            }
        };

        checkAuth();
    }, [pathname, isAuthenticated, router, getSession]);

    // Don't render anything until we've verified authentication
    if (!verified && !isPublicRoute(pathname || '')) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="ml-3">Verifying access...</p>
            </div>
        );
    }

    return <>{children}</>;
}

export default AuthGuard; 