import { useEffect, useState } from 'react';
import * as Atom from '@atom';

import { API_URL, getServerStatus } from '@/lib/api';

export function ServerStatus() {
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    let current = true;
    getServerStatus().catch(() => current && setUnreachable(true));
    return () => {
      current = false;
    };
  }, []);

  if (!unreachable) return null;

  return (
    <Atom.ErrorMessage>
      {__DEV__
        ? `Can't reach the Orbis server at ${API_URL}.`
        : "Can't reach Orbis right now. Check your connection and try again."}
    </Atom.ErrorMessage>
  );
}
