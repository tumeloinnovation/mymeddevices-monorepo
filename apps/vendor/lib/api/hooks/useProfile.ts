import { useState, useEffect, useCallback } from 'react';
import { profileApi } from '../endpoints/profile';
import type { StoreProfile, UpdateStoreProfileDto } from '../types';

export function useProfile() {
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await profileApi.getStoreProfile();
      if (data) setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateStoreProfileDto) => {
    try {
      const response = await profileApi.updateStoreProfile(data);
      await fetchProfile();
      return true;
    } catch (err) {
      return false;
    }
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile, updateProfile };
}
