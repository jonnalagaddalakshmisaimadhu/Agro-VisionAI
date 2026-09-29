import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    RecaptchaVerifier, 
    signInWithPhoneNumber,
    ConfirmationResult 
} from "firebase/auth";

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
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        const user = result.user;

        console.log("Firebase Login Success:", user);
        return { user, token };
    } catch (error: any) {
        console.error("Firebase Login Error:", error.code, error.message);
        throw error;
    }
};

/**
 * Initializes Invisible reCAPTCHA verifier attached to a specific container or button
 */
export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
    const globalWindow = window as unknown as { recaptchaVerifier?: RecaptchaVerifier };
    if (globalWindow.recaptchaVerifier) {
        try {
            globalWindow.recaptchaVerifier.clear();
        } catch (e) {
            console.debug("Error clearing previous recaptcha verifier:", e);
        }
    }
    
    const verifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: () => {
            console.log("Invisible reCAPTCHA verified successfully.");
        },
        "expired-callback": () => {
            console.warn("reCAPTCHA expired. Please request a new OTP.");
        }
    });

    globalWindow.recaptchaVerifier = verifier;
    return verifier;
};

/**
 * Sends a real SMS OTP via Firebase Phone Authentication with invisible reCAPTCHA
 */
export const sendPhoneOtp = async (
    rawPhoneNumber: string, 
    appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
    // Format to E.164 (+91XXXXXXXXXX)
    let formattedNumber = rawPhoneNumber.trim().replace(/[\s-]/g, "");
    if (!formattedNumber.startsWith("+")) {
        if (formattedNumber.length === 10) {
            formattedNumber = `+91${formattedNumber}`;
        } else {
            formattedNumber = `+${formattedNumber}`;
        }
    }

    try {
        const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
        return confirmationResult;
    } catch (error: any) {
        console.error("SMS OTP Send Error:", error.code, error.message);
        throw error;
    }
};
