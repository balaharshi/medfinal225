import Pusher from 'pusher-js';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || '';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || '';
const PUSHER_CHANNEL = import.meta.env.VITE_PUSHER_CHANNEL || 'medziva-notifications';

export const subscribeToNotifications = (
  onNotification: (payload: { message?: string; event?: string; [key: string]: unknown }) => void
) => {
  if (!PUSHER_KEY || !PUSHER_CLUSTER) return () => undefined;

  const pusher = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
  });
  const channel = pusher.subscribe(PUSHER_CHANNEL);

  const handler = (payload: { message?: string; event?: string; [key: string]: unknown }) => {
    onNotification(payload || {});
  };

  channel.bind('notification:new', handler);
  channel.bind('auth:login-success', handler);
  channel.bind('order:update', handler);
  channel.bind('appointment:update', handler);

  return () => {
    channel.unbind('notification:new', handler);
    channel.unbind('auth:login-success', handler);
    channel.unbind('order:update', handler);
    channel.unbind('appointment:update', handler);
    pusher.unsubscribe(PUSHER_CHANNEL);
    pusher.disconnect();
  };
};
