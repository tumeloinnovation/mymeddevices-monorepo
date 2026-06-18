'use client';

import { Suspense } from 'react';
import { ResetPasswordForm, LoginBackground } from "@mymeddevices/shared-admin";

export default function ResetPasswordPage() {
    return (
        <LoginBackground theme="vendor">
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <ResetPasswordForm theme="vendor" />
            </Suspense>
        </LoginBackground>
    );
}
