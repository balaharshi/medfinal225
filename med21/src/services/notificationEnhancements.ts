import { setupNotificationSoundUnlock } from './notificationSound';

let configured = false;

export const setupNotificationEnhancements = () => {
  if (configured) return;
  configured = true;

  setupNotificationSoundUnlock();
};
