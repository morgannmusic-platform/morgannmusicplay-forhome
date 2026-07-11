// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// CONFIGURATION FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyDSPUArpApBuK0Cn9VbeMtqk4JC-gqruJc",
    authDomain: "morgann-music-cp.firebaseapp.com",
    projectId: "morgann-music-cp",
    storageBucket: "morgann-music-cp.firebasestorage.app",
    messagingSenderId: "666812685196",
    appId: "1:666812685196:web:8973e1d62b28b90a8494a9",
    measurementId: "G-M0ZQQ2RZYZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ÉLÉMENTS DU DOM
const authCard = document.getElementById('auth-card');
const dashboardCard = document.getElementById('dashboard-card');
const welcomeMessage = document.getElementById('welcome-message');
const userEmailDisplay = document.getElementById('user-email-display');
const userAvatar = document.getElementById('user-avatar');
const container = document.getElementById('auth-card');

// --- DÉTECTION DES PARAMÈTRES GOOGLE HOME (OAuth) ---
const urlParams = new URLSearchParams(window.location.search);
const redirectUri = urlParams.get('redirect_uri');
const state = urlParams.get('state');
const clientId = urlParams.get('client_id');

// Fonction cruciale qui renvoie l'utilisateur vers Google Home après sa connexion
async function handleGoogleHomeRedirect(user) {
    if (redirectUri && state) {
        // 1. On génère un code d'autorisation temporaire unique
        const authCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        try {
            // 2. On stocke ce code temporaire dans Firestore pour que notre Worker puisse le valider plus tard
            await addDoc(collection(db, "oauth_codes"), {
                code: authCode,
                uid: user.uid,
                clientId: clientId,
                createdAt: serverTimestamp()
            });

            // 3. MODIFICATION ICI : On force la redirection brute pour réveiller le mini-navigateur Google Home
            const finalRedirectUrl = `${redirectUri}?code=${encodeURIComponent(authCode)}&state=${encodeURIComponent(state)}`;
            window.location.assign(finalRedirectUrl);

        } catch (error) {
            alert("OAuth Storage Error: " + error.message);
        }
    }
}

// --- LOGIQUE D'ÉCOUTE ET CONNEXIONS ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Si l'utilisateur vient de l'app Google Home, on zappe le dashboard et on le redirige direct !
        if (redirectUri && state) {
            handleGoogleHomeRedirect(user);
            return;
        }

        // Sinon, affichage classique du Dashboard Web
        authCard.classList.add('hidden');
        dashboardCard.classList.remove('hidden');
        welcomeMessage.textContent = `Welcome, ${user.displayName || 'Music Lover'}!`;
        userEmailDisplay.textContent = user.email;
        if (user.photoURL) {
            userAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
    } else {
        authCard.classList.remove('hidden');
        dashboardCard.classList.add('hidden');
    }
});

// Connexion Classique
document.getElementById('sign-in-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) { document.getElementById('login-password-error').textContent = error.message; }
});

// Inscription Classique
document.getElementById('sign-up-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
    } catch (error) { document.getElementById('register-confirm-password-error').textContent = error.message; }
});

// Connexion avec Google
document.getElementById('btn-google-login').addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) { alert("Google Login Error: " + error.message); }
});

// Déconnexion
document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

// Animations des panneaux (Desktop)
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
if (signUpButton && signInButton) {
    signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
    signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));
}