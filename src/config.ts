// src/config.ts
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  connectionString: process.env.CONNECTION_STRING || '',
  callbackUri: process.env.CALLBACK_URI || '',
  port: parseInt(process.env.PORT || '8080'),
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  sourcePhoneNumber: process.env.SOURCE_PHONE_NUMBER || '',
  targetPhoneNumber: process.env.TARGET_PHONE_NUMBER || ''
};
