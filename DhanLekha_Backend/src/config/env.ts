import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

const optional = (key: string, fallback: string = ''): string =>
  process.env[key] ?? fallback;

export const config = {
  env: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '3000')),
  apiVersion: optional('API_VERSION', 'v1'),

  db: {
    url: required('DATABASE_URL'),
  },

  redis: {
    url: optional('REDIS_URL', 'redis://localhost:6379'),
  },

  jwt: {
    secret: required('JWT_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    expiresIn: optional('JWT_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  encryption: {
    key: optional('ENCRYPTION_KEY', 'dev-encryption-key-32bytes!!!!!!!'),
    iv: optional('ENCRYPTION_IV', 'dev-iv-16bytes!!'),
  },

  twilio: {
    accountSid: optional('TWILIO_ACCOUNT_SID'),
    authToken: optional('TWILIO_AUTH_TOKEN'),
    phoneNumber: optional('TWILIO_PHONE_NUMBER'),
  },

  smtp: {
    host: optional('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(optional('SMTP_PORT', '587')),
    user: optional('SMTP_USER'),
    pass: optional('SMTP_PASS'),
    fromEmail: optional('FROM_EMAIL', 'noreply@dhanlekha.com'),
    fromName: optional('FROM_NAME', 'DhanLekha'),
  },

  storage: {
    provider: optional('STORAGE_PROVIDER', 'local') as 'local' | 's3',
    localPath: optional('LOCAL_UPLOAD_PATH', './uploads'),
    aws: {
      accessKeyId: optional('AWS_ACCESS_KEY_ID'),
      secretAccessKey: optional('AWS_SECRET_ACCESS_KEY'),
      region: optional('AWS_REGION', 'ap-south-1'),
      bucket: optional('AWS_S3_BUCKET', 'dhanlekha-vault'),
    },
  },

  blockchain: {
    polygonRpcUrl: optional('POLYGON_RPC_URL', 'https://polygon-rpc.com'),
    chainId: parseInt(optional('POLYGON_CHAIN_ID', '137')),
    vaultContractAddress: optional('VAULT_CONTRACT_ADDRESS'),
    deployerPrivateKey: optional('DEPLOYER_PRIVATE_KEY'),
  },

  razorpay: {
    keyId: optional('RAZORPAY_KEY_ID', 'rzp_test_1DP5mmOlF5G5ag'),
    keySecret: optional('RAZORPAY_KEY_SECRET', 'thisShouldBeYourTestSecret'),
    webhookSecret: optional('RAZORPAY_WEBHOOK_SECRET', 'dhanlekha_webhook_secret'),
  },

  pricing: {
    documentUpload: parseInt(optional('PRICE_DOCUMENT_UPLOAD', '500')),   // paise = ₹5
    apiIntegration: parseInt(optional('PRICE_API_INTEGRATION', '1000')),  // paise = ₹10
  },

  cors: {
    allowedOrigins: optional('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
  },

  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000')),
    max: parseInt(optional('RATE_LIMIT_MAX', '100')),
  },

  otp: {
    expiresMinutes: parseInt(optional('OTP_EXPIRES_MINUTES', '10')),
    length: parseInt(optional('OTP_LENGTH', '6')),
  },

  deadManCron: optional('DEAD_MAN_CRON', '0 9 * * *'),

  frontendUrl: optional('FRONTEND_URL', 'http://localhost:3000'),
  backendUrl: optional('BACKEND_URL', 'http://localhost:3001'),

  isDev: optional('NODE_ENV', 'development') === 'development',
  isProd: optional('NODE_ENV', 'development') === 'production',
};
