import { useEffect } from 'react';

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: () => void;
    }
}

const GoogleTranslate = () => {
    useEffect(() => {
        // Define global init function
        window.googleTranslateElementInit = () => {
            try {
                if (window.google && window.google.translate) {
                    new window.google.translate.TranslateElement(
                        {
                            pageLanguage: 'en',
                            includedLanguages: 'en,hi,bn,te,mr,ta,ur,gu,kn,ml,pa,or,as',
                            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                            autoDisplay: false,
                        },
                        'google_translate_element'
                    );
                }
            } catch (err) {
                console.error('Google Translate init error:', err);
            }
        };

        // Check if script is already present
        if (!document.querySelector('script[src*="translate.google.com"]')) {
            const script = document.createElement('script');
            script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.body.appendChild(script);
        } else if (window.google && window.google.translate) {
            window.googleTranslateElementInit();
        }
        // Prevent body shifting and hide any banner frame injected by Google
        const observer = new MutationObserver(() => {
            if (document.body.style.top && document.body.style.top !== '0px') {
                document.body.style.top = '0px';
            }
            const banner = document.querySelector<HTMLElement>('.goog-te-banner-frame, iframe.skiptranslate');
            if (banner) {
                banner.style.display = 'none';
                banner.style.visibility = 'hidden';
            }
        });

        observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'], childList: true });

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div
            id="google_translate_element"
            style={{
                position: 'fixed',
                top: '-9999px',
                left: '-9999px',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
                opacity: 0,
                pointerEvents: 'none',
                zIndex: -100
            }}
            aria-hidden="true"
        />
    );
};

export default GoogleTranslate;

