import { shopifyApp } from '@shopify/shopify-app-remix';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: ['write_products', 'read_products'],
  appUrl: process.env.SHOPIFY_APP_URL || '',
  sessionStorage: new SQLiteSessionStorage('sessions.sqlite'),
});

export default shopify; 