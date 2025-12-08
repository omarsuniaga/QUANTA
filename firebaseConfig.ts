import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";

// Helper to get env vars with a fallback
// Checks Vite (VITE_) and Expo (EXPO_PUBLIC_) prefixes
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // Check Vite
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
    }
    
    // Check Expo / Create React App / Node
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[`EXPO_PUBLIC_${key}`]) return process.env[`EXPO_PUBLIC_${key}`];
      if (process.env[`REACT_APP_${key}`]) return process.env[`REACT_APP_${key}`];
    }
  } catch (e) {
    console.warn("Error reading env var", key);
  }
  
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnvVar("FIREBASE_API_KEY", ""),
  authDomain: getEnvVar("FIREBASE_AUTH_DOMAIN", ""),
  projectId: getEnvVar("FIREBASE_PROJECT_ID", ""),
  storageBucket: getEnvVar("FIREBASE_STORAGE_BUCKET", ""),
  messagingSenderId: getEnvVar("FIREBASE_MESSAGING_SENDER_ID", ""),
  appId: getEnvVar("FIREBASE_APP_ID", ""),
  measurementId: getEnvVar("FIREBASE_MEASUREMENT_ID", "")
};

// Validate that all required Firebase credentials are configured
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  const errorMessage = `
🔒 FIREBASE CONFIGURATION ERROR 🔒

Missing required environment variables:
${missingKeys.map(key => `  - VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`).join('\n')}

Please create a .env.local file in the project root with your Firebase credentials.
See .env.example for the template.

Firebase Console: https://console.firebase.google.com/
  `.trim();
  
  console.error(errorMessage);
  throw new Error('Firebase configuration incomplete. Check console for details.');
}


// Initialize Firebase
// Only initialize if config is present to avoid errors
const app = firebase.apps.length 
  ? firebase.app() 
  : firebase.initializeApp(firebaseConfig);

export const db = app.firestore();
export const auth = app.auth();
export { app };