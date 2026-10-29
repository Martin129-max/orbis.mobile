import { useEffect, useState } from 'react';

import { useAuthStore } from '@/stores/auth-store';

export function useCurrentProfile() {
  const token = useAuthStore((state) => state.token);
  const profile = useAuthStore((state) => state.profile);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token || profile) return;
    let active = true;
    fetchProfile().catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [attempt, fetchProfile, profile, token]);

  function retry() {
    setFailed(false);
    setAttempt((current) => current + 1);
  }

  return { profile, failed: failed && !profile, retry };
}
