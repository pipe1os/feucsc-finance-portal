// src/lib/firebase.ts
import { initializeApp, type FirebaseApp } from "firebase/app";
// No importar getFirestore, getStorage, getAuth aquí estáticamente

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Variable para guardar la instancia de app inicializada
let app: FirebaseApp | null = null;

// Función para inicializar (si no existe) y devolver la app
const initializeFirebaseApp = (): FirebaseApp => {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
};

// Exportar la función para obtener la app (puede ser útil)
export const getFirebaseApp = (): FirebaseApp => initializeFirebaseApp();

// --- Exportar funciones getter asíncronas para los servicios ---

// Variable para cachear la instancia de Firestore
let dbInstance: any | null = null; // Usar 'any' temporalmente o importar el tipo Firestore dinámicamente si es necesario
export const getDb = async () => {
  if (!dbInstance) {
    const { getFirestore } = await import("firebase/firestore");
    dbInstance = getFirestore(initializeFirebaseApp());
  }
  return dbInstance;
};

// Variable para cachear la instancia de Storage
let storageInstance: any | null = null;
export const getStorageInstance = async () => {
  if (!storageInstance) {
    const { getStorage } = await import("firebase/storage");
    storageInstance = getStorage(initializeFirebaseApp());
  }
  return storageInstance;
};

// Variable para cachear la instancia de Auth
let authInstance: any | null = null;
export const getAuthInstance = async () => {
  if (!authInstance) {
    const { getAuth } = await import("firebase/auth");
    authInstance = getAuth(initializeFirebaseApp());
  }
  return authInstance;
};

// Ya no necesitamos exportar las instancias directamente ni la app como default
// export default app;
// export const db = getFirestore(app);
// export const storage = getStorage(app);
// export const auth = getAuth(app);
