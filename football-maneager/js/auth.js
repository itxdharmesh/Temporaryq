import { auth } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { handleAuthState } from './app.js';

let currentMode = 'login'; // 'login' or 'signup'

window.switchAuthTab = function(mode) {
  currentMode = mode;
  const loginBtn = document.getElementById('tab-login-btn');
  const signupBtn = document.getElementById('tab-signup-btn');
  const submitBtn = document.getElementById('auth-submit-btn');
  const errorBadge = document.getElementById('auth-error');

  errorBadge.classList.add('hidden');

  if (mode === 'login') {
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
    submitBtn.innerText = 'Log In';
  } else {
    signupBtn.classList.add('active');
    loginBtn.classList.remove('active');
    submitBtn.innerText = 'Create Account';
  }
};

export function initAuthListeners() {
  const authForm = document.getElementById('auth-form');
  const logoutBtn = document.getElementById('logout-btn');

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorBadge = document.getElementById('auth-error');

    errorBadge.classList.add('hidden');

    try {
      if (currentMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      errorBadge.innerText = formatAuthError(err.code);
      errorBadge.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  });

  // Track auth state continuously
  onAuthStateChanged(auth, (user) => {
    handleAuthState(user);
  });
}

function formatAuthError(code) {
  switch (code) {
    case 'auth/invalid-email': return 'Invalid email address format.';
    case 'auth/user-not-found': return 'No user found with this email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password': return 'Password should be at least 6 characters.';
    default: return 'Authentication error. Check Firebase credentials.';
  }
}
