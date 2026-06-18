'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalInfo } from '../_components/PersonalInfo';
import { PasswordChange } from '../_components/PasswordChange';
import { DeleteAccount } from '../_components/DeleteAccount';
import { PreferencesTab } from '../_components/PreferencesTab';
import { SecurityTab } from '../_components/SecurityTab';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences
                </p>
            </div>

            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-5 max-w-2xl">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-6">
                    <PersonalInfo />
                </TabsContent>

                <TabsContent value="password" className="mt-6">
                    <PasswordChange />
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                    <SecurityTab />
                </TabsContent>

                <TabsContent value="preferences" className="mt-6">
                    <PreferencesTab />
                </TabsContent>

                <TabsContent value="account" className="mt-6">
                    <DeleteAccount />
                </TabsContent>
            </Tabs>
        </div>
    );
}
