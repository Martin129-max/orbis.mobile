import type { PresenceStatus } from './api';

export function presenceStatus(online: boolean, status: PresenceStatus): PresenceStatus {
  return online ? status : 'offline';
}

export function presenceLabel(status: PresenceStatus) {
  switch (status) {
    case 'online':
      return 'Online';
    case 'idle':
      return 'Idle';
    case 'busy':
      return 'Busy';
    case 'streaming':
      return 'Live on Twitch';
    case 'offline':
      return 'Offline';
  }
}
