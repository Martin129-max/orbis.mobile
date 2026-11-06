import { presenceLabel, presenceStatus } from '../presence';

describe('presence helpers', () => {
  it('reports offline when the connection is not online', () => {
    expect(presenceStatus(false, 'streaming')).toBe('offline');
    expect(presenceStatus(true, 'streaming')).toBe('streaming');
  });

  it('uses the web presence labels', () => {
    expect(presenceLabel('online')).toBe('Online');
    expect(presenceLabel('idle')).toBe('Idle');
    expect(presenceLabel('busy')).toBe('Busy');
    expect(presenceLabel('streaming')).toBe('Live on Twitch');
    expect(presenceLabel('offline')).toBe('Offline');
  });
});
