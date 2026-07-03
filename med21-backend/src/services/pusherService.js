import Pusher from 'pusher';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const isConfigured =
  env.pusher.appId &&
  env.pusher.key &&
  env.pusher.secret &&
  env.pusher.cluster;

const pusher = isConfigured
  ? new Pusher({
      appId: env.pusher.appId,
      key: env.pusher.key,
      secret: env.pusher.secret,
      cluster: env.pusher.cluster,
      useTLS: env.pusher.useTLS,
    })
  : null;

export const triggerPusherEvent = async (eventName, payload = {}, channel = env.pusher.channel) => {
  if (!pusher) return false;

  try {
    await pusher.trigger(channel, eventName, {
      event: eventName,
      timestamp: new Date().toISOString(),
      ...payload,
    });
    return true;
  } catch (error) {
    logger.warn(`Pusher event failed: ${eventName}`, error);
    return false;
  }
};

export const triggerNotification = (message, payload = {}) =>
  triggerPusherEvent('notification:new', {
    type: 'notification',
    message,
    ...payload,
  });
