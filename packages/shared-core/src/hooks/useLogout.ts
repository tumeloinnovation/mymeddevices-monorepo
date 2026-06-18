'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { toast } from 'sonner';

interface UseLogoutOptions {
    redirectPath?: string;
}

export function useLogout(options: UseLogoutOptions = {}) {
    const { redirectPath = '/login' } = options;
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { clearAuth } = useAuthStore();
    const router = useRouter();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            // Mock logout delay
            await new Promise(resolve => setTimeout(resolve, 800));
            clearAuth();
            toast.success('Logged out successfully');
            router.push(redirectPath);
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout. Please try again.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return {
        handleLogout,
        isLoggingOut,
    };
}
