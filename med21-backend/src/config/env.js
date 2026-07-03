import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5001),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSchema: process.env.DB_SCHEMA || 'public',
  skipDatabaseBootstrap: process.env.SKIP_DATABASE_BOOTSTRAP === 'true',
  seedDatabase: process.env.SEED_DATABASE === 'true',
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET must be set in production'); })() : 'dev-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || '*',
  frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  appleClientId: process.env.APPLE_CLIENT_ID || '',
  enbdpay: {
    baseUrl: process.env.ENBDPAY_BASE_URL || 'https://enbduat-acquiring-apigw.creditpluspinelabs.com',
    username: process.env.ENBDPAY_USERNAME || '',
    apiKey: process.env.ENBDPAY_API_KEY || '',
    currency: process.env.ENBDPAY_CURRENCY || 'AED',
    paymentMethod: process.env.ENBDPAY_PAYMENT_METHOD || 'CARD',
    transactionType: process.env.ENBDPAY_TRANSACTION_TYPE || 'PURCHASE',
    redirectUrl: process.env.ENBDPAY_REDIRECT_URL || '',
    webhookUrl: process.env.ENBDPAY_WEBHOOK_URL || '',
    webhookSecret: process.env.ENBDPAY_WEBHOOK_SECRET || '',
    mock: process.env.ENBDPAY_MOCK === 'true',
  },
  pusher: {
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.PUSHER_CLUSTER || '',
    useTLS: process.env.PUSHER_USE_TLS !== 'false',
    channel: process.env.PUSHER_CHANNEL || 'medziva-notifications',
  },
};

if (!env.databaseUrl) {
  console.warn('DATABASE_URL is not set. The backend will fail to connect until it is provided.');
}
