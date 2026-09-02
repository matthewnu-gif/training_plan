import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDqNd_EjU9TAqO4Xk1olv5ZdxBI23OCHyw',
  authDomain: 'training-plan-88b80.firebaseapp.com',
  projectId: 'training-plan-88b80',
  storageBucket: 'training-plan-88b80.firebasestorage.app',
  messagingSenderId: '794033434286',
  appId: '1:794033434286:web:09f2eb9e5c63ff074d473f'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const authReady = signInAnonymously(auth).catch((error) => {
  console.warn('Firebase anonymous authentication is unavailable', error);
  return null;
});

export { auth, authReady, db };