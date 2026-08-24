import { useEffect, useState } from 'react';

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: () => void;
    }
}

const GoogleTranslate = () => {
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        // Check if script is already added
        if (document.querySelector('script[src*="translate.google.com"]')) {
            setScriptLoaded(true);
            return;
        }

        // Add global init function
        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,bn,te,mr,ta,ur,gu,kn,ml,pa,or,as',
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                },
                'google_translate_element'
            );
        };

        // Inject script
        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        document.body.appendChild(script);
    }, []);

    return (
        <div
            id="google_translate_element"
            className="hidden" // Hidden because we use custom trigger
            style={{ display: 'none' }}
        />
    );
};

export default GoogleTranslate;
