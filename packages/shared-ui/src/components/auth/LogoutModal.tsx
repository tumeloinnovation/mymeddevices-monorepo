'use client';

import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Loader2 } from 'lucide-react';

interface LogoutModalProps {
    open: boolean;
}

export function LogoutModal({ open }: LogoutModalProps) {
    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-[280px] text-center [&>button]:hidden">
                <div className="flex flex-col items-center gap-4 py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <DialogTitle className="text-lg font-medium">Signing out...</DialogTitle>
                </div>
            </DialogContent>
        </Dialog>
    );
}
