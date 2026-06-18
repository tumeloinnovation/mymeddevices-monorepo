'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageIcon, Upload, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface LogoUploadSectionProps {
    logoUrl: string;
    logoId: number;
    onChange: (id: number, url: string) => void;
}

export function LogoUploadSection({ logoUrl, logoId, onChange }: LogoUploadSectionProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>(logoUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 5MB.');
            return;
        }

        // Show preview immediately
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/vendor/media/upload', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to upload image');
            }

            const data = await response.json();
            const uploadedImage = data.data;

            onChange(uploadedImage.id, uploadedImage.url);
            setPreviewUrl(uploadedImage.url);
            toast.success('Logo uploaded successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
            setPreviewUrl(logoUrl); // Revert to original
        } finally {
            setIsUploading(false);
            URL.revokeObjectURL(localPreview);
        }
    };

    const handleRemoveLogo = () => {
        onChange(0, '');
        setPreviewUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Store Logo
                </CardTitle>
                <CardDescription>
                    Upload a logo for your store (recommended: 256x256 pixels)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-start gap-6">
                    {/* Logo Preview */}
                    <div className="relative h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50">
                        {previewUrl ? (
                            <Image
                                src={previewUrl}
                                alt="Store logo"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                        )}
                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Upload Controls */}
                    <div className="space-y-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="logo-upload"
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {previewUrl ? 'Change Logo' : 'Upload Logo'}
                            </Button>
                            {previewUrl && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleRemoveLogo}
                                    disabled={isUploading}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Accepted formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
