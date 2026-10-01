import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    getRedirectResult,
    RecaptchaVerifier, 
    signInWithPhoneNumber,
    ConfirmationResult 
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";

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
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Universal Google Sign-In that works seamlessly on both Web and Mobile Android APK.
 * Uses native Google Play Services Credential Manager / Firebase Auth on Android APK.
 * Uses Firebase signInWithPopup on Desktop Web browsers.
 */
export const signInWithGoogle = async () => {
    const isNative = Capacitor.isNativePlatform();

    // 1. On Mobile Android APK, use Real Native Google Firebase Authentication
    if (isNative) {
        try {
            const result = await FirebaseAuthentication.signInWithGoogle();
            const nativeUser = result.user;
            if (nativeUser) {
                const user = {
                    uid: nativeUser.uid,
                    displayName: nativeUser.displayName || nativeUser.email?.split("@")[0] || "Farmer",
                    email: nativeUser.email,
                    photoURL: nativeUser.photoUrl
                };
                return { 
                    user: user as any, 
                    token: (result as any)?.credential?.idToken || "native_google_token"
                };
            }
            return { user: null, token: null, error: new Error("Google Sign-In returned no user") };
        } catch (nativeErr: any) {
            console.error("Native Google Sign-In error:", nativeErr);
            let friendlyMessage = nativeErr?.message || "Google Sign-In failed.";
            if (friendlyMessage.includes("10:") || friendlyMessage.includes("DEVELOPER_ERROR")) {
                friendlyMessage = "Google Play Services error (SHA-1 fingerprint must be added to Firebase Console).";
            }
            return { user: null, token: null, error: new Error(friendlyMessage) };
        }
    }

    // 2. On Web desktop browsers, use real Firebase signInWithPopup
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        const user = result.user;

        console.log("Firebase Google Login Success:", user);
        return { user, token };
    } catch (popupError: any) {
        console.warn("Google popup error code:", popupError?.code, popupError?.message);
        return { user: null, token: null, error: popupError };
    }
};

/**
 * Checks if user just returned from a Google OAuth redirect flow (Web only)
 */
export const checkGoogleRedirectResult = async () => {
    if (Capacitor.isNativePlatform()) {
        return null;
    }
    try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            return { user: result.user, token: credential?.accessToken };
        }
    } catch (err) {
        console.debug("Redirect result check notice:", err);
    }
    return null;
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
