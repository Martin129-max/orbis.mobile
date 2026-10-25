import { useEffect, useState } from 'react';
import * as Atom from '@atom';

import { API_URL, getServerStatus } from '@/lib/api';

export function ServerStatus() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    getServerStatus()
      .then((text) => current && setStatus(text))
      .catch(() => current && setStatus(`Server unreachable at ${API_URL}`));
    return () => {
      current = false;
    };
  }, []);

  return (
    <Atom.ThemedText themeColor="textSecondary">
      {status ?? 'Connecting to server…'}
    </Atom.ThemedText>
  );
}
