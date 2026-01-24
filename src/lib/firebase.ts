import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyApk4q4cGJFIUNCwcrXcvqxkJKS9a-kxgA",
    authDomain: "farmiq-agrovisionai.firebaseapp.com",
    projectId: "farmiq-agrovisionai",
    storageBucket: "farmiq-agrovisionai.firebasestorage.app",
    messagingSenderId: "995463400294",
    appId: "1:995463400294:web:7f60b42cd4911b824616a7",
    measurementId: "G-L0663WQXTC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        // This gives you a Google Access Token. You can use it to access Google APIs.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        // The signed-in user info.
        const user = result.user;

        console.log("Firebase Login Success:", user);
        return { user, token };
    } catch (error: any) {
        console.error("Firebase Login Error:", error.code, error.message);
        throw error;
    }
};
