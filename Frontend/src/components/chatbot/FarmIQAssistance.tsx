
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MessageCircle, X, Send, Mic, MicOff, Sprout, Loader2, ArrowRight, Leaf, Search, Cloud, ShoppingCart, Tractor, GraduationCap, Building2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Extend window interface for SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const BCP47_LANG_MAP: Record<string, string> = {
    te: "te-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    bn: "bn-IN",
    mr: "mr-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    gu: "gu-IN",
    pa: "pa-IN",
    ur: "ur-IN",
    or: "or-IN",
    as: "as-IN",
    en: "en-IN"
};

const GREETINGS: Record<string, string> = {
    te: "నమస్కారం! నేను ఫార్మ్ ఐక్యూ అసిస్టెంట్‌ని. ఈరోజు మీ వ్యవసాయానికి నేను ఎలా సహాయపడగలను?",
    hi: "नमस्ते! मैं फार्म आईक्यू सहायक हूं। आज मैं आपकी खेती में क्या मदद कर सकता हूँ?",
    ta: "வணக்கம்! நான் Farm IQ உதவியாளர். இன்று உங்கள் விவசாயத் தேவைகளுக்கு நான் எவ்வாறு உதவ முடியும்?",
    bn: "নমস্কার! আমি Farm IQ সহকারী। আজ আপনার কৃষিকাজে কীভাবে সাহায্য করতে পারি?",
    mr: "नमस्कार! मी Farm IQ सहाय्यक आहे. आज मी तुमच्या शेती कामात कशी मदत करू शकतो?",
    kn: "ನಮಸ್ಕಾರ! ನಾನು Farm IQ ಸಹಾಯಕ. ಇಂದು ನಿಮ್ಮ ಕೃಷಿ ಅಗತ್ಯಗಳಿಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    ml: "നമസ്കാരം! ഞാൻ Farm IQ അസിസ്റ്റന്റാണ്. നിങ്ങളുടെ കൃഷി സംബന്ധമായ സംശയങ്ങൾക്ക് എനിക്ക് എങ്ങനെ സഹായിക്കാനാകും?",
    gu: "નમસ્તે! હું Farm IQ સહાયક છું. આજે હું તમારી ખેતીમાં કેવી રીતે મદદ કરી શકું?",
    pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ Farm IQ ਸਹਾਇਕ ਹਾਂ। ਅੱਜ ਤੁਹਾਡੀ ਖੇਤੀ ਵਿੱਚ ਮੈਂ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
    ur: "ہیلو! میں Farm IQ اسسٹنٹ ہوں۔ آج میں آپ کی زراعت میں کس طرح مدد کر سکتا ہوں؟",
    en: "Hello! I am Farm IQ Assistance. How can I help you with your farming needs today?"
};

export const FarmIQAssistance = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    const getActiveLang = () => {
        const stored = localStorage.getItem("farmiq_language");
        if (stored) return stored;
        const match = document.cookie.match(/googtrans=\/(?:[a-zA-Z]+)\/([a-zA-Z]+)/);
        return match ? match[1] : "en";
    };

    const currentLang = getActiveLang();

    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: GREETINGS[currentLang] || GREETINGS['en'] }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Voice Recognition Setup
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = BCP47_LANG_MAP[currentLang] || 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [currentLang]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setInputValue(''); // Clear input before listening
            if (recognitionRef.current) {
                recognitionRef.current.lang = BCP47_LANG_MAP[getActiveLang()] || 'en-US';
                recognitionRef.current.start();
            }
            setIsListening(true);
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const simulateTyping = async (text: string) => {
        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        for (let i = 0; i < text.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 3));
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                    lastMsg.content = text.substring(0, i + 1);
                }
                return newMessages;
            });
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = { role: 'user' as const, content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const history = messages.map(msg => ({ role: msg.role, content: msg.content }));
            const activeLang = getActiveLang();

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: history,
                    language: activeLang
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            await simulateTyping(data.response);
        } catch (error) {
            console.error('Error sending message:', error);
            const errFallback = activeLang === 'te' 
                ? "సర్వర్‌తో కనెక్ట్ అవ్వడంలో సమస్య ఉంది. దయచేసి కాసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి."
                : (activeLang === 'hi'
                    ? "सर्वर से कनेक्ट करने में समस्या आ रही है। कृपया थोड़ी देर बाद पुनः प्रयास करें。"
                    : "I'm having trouble connecting to the server. If the problem persists, please check your internet connection.");
            setMessages(prev => [...prev, { role: 'assistant', content: errFallback }]);
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getFeatureDetails = (path: string) => {
        switch(path) {
            case 'disease-detection': return { label: 'Go to Disease Detection', icon: <Search className="w-4 h-4" />, bg: 'bg-red-100 text-red-700 hover:bg-red-200' };
            case 'crop-recommendation': return { label: 'Go to Crop Recommendation', icon: <Leaf className="w-4 h-4" />, bg: 'bg-green-100 text-green-700 hover:bg-green-200' };
            case 'marketplace': return { label: 'Go to Marketplace', icon: <ShoppingCart className="w-4 h-4" />, bg: 'bg-blue-100 text-blue-700 hover:bg-blue-200' };
            case 'weather-alerts': return { label: 'Go to Weather Alerts', icon: <Cloud className="w-4 h-4" />, bg: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' };
            case 'equipment-rental': return { label: 'Go to Equipment Rental', icon: <Tractor className="w-4 h-4" />, bg: 'bg-amber-100 text-amber-700 hover:bg-amber-200' };
            case 'expert-consultation': return { label: 'Go to Expert Consultation', icon: <GraduationCap className="w-4 h-4" />, bg: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' };
            case 'government-schemes': return { label: 'Go to Government Schemes', icon: <Building2 className="w-4 h-4" />, bg: 'bg-purple-100 text-purple-700 hover:bg-purple-200' };
            default: return { label: 'Explore Feature', icon: <ArrowRight className="w-4 h-4" />, bg: 'bg-green-100 text-green-700 hover:bg-green-200' };
        }
    };

    return (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <Card className="w-[calc(100vw-2rem)] sm:w-[380px] md:w-[400px] max-w-[420px] shadow-2xl mb-3 sm:mb-4 border-green-200 animate-in slide-in-from-bottom-5 duration-300">
                    <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-t-xl p-3 sm:p-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 sm:p-2 bg-white/20 rounded-full">
                                <Sprout className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-base sm:text-lg font-bold">Farm IQ Assistance</CardTitle>
                                <p className="text-[10px] sm:text-xs text-green-100 opacity-90">AI Agri-Expert Support</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                    </CardHeader>

                    <CardContent className="p-0 bg-slate-50">
                        <ScrollArea className="h-[340px] sm:h-[400px] p-3 sm:p-4">
                            <div className="flex flex-col gap-3 sm:gap-4">
                                {messages.map((msg, index) => {
                                    // Parse redirect tags
                                    const redirectMatch = msg.content.match(/\[REDIRECT:\s*([a-zA-Z0-9-]+)\]/);
                                    const redirectPath = redirectMatch ? redirectMatch[1] : null;
                                    const cleanContent = msg.content.replace(/\[REDIRECT:\s*[a-zA-Z0-9-]+\]/, '').trim();
                                    
                                    return (
                                        <div key={index} className="flex flex-col gap-2">
                                            <div
                                                className={cn(
                                                    "flex flex-col max-w-[88%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm shadow-sm whitespace-pre-wrap break-words overflow-hidden",
                                                    msg.role === 'user'
                                                        ? "ml-auto bg-green-600 text-white rounded-br-none"
                                                        : "mr-auto bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                                                )}
                                            >
                                                {msg.role === 'assistant' ? (
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5" {...props} />,
                                                            li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className="font-semibold text-green-800 dark:text-green-300" {...props} />,
                                                            h3: ({ node, ...props }) => <h3 className="font-bold text-sm sm:text-base mt-2 mb-1" {...props} />,
                                                            h4: ({ node, ...props }) => <h4 className="font-semibold text-xs sm:text-sm mt-1 mb-0.5" {...props} />,
                                                        }}
                                                    >
                                                        {cleanContent}
                                                    </ReactMarkdown>
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>

                                            {/* Smart Action Button if redirect is present */}
                                            {redirectPath && msg.role === 'assistant' && !isLoading && (
                                                <div className="mr-auto pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => {
                                                            setIsOpen(false);
                                                            window.location.href = `/dashboard/${redirectPath}`;
                                                        }}
                                                        className={cn(
                                                            "rounded-full gap-1.5 text-xs font-semibold shadow-sm transition-all h-7 px-3",
                                                            getFeatureDetails(redirectPath).bg
                                                        )}
                                                    >
                                                        {getFeatureDetails(redirectPath).icon}
                                                        {getFeatureDetails(redirectPath).label}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {isLoading && (
                                    <div className="mr-auto bg-white border border-slate-200 px-3.5 py-2 rounded-2xl rounded-bl-none flex items-center gap-2 text-xs sm:text-sm text-slate-500 shadow-sm">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />
                                        Thinking...
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <CardFooter className="p-2.5 sm:p-3 bg-white border-t border-slate-100 rounded-b-xl">
                        <div className="flex w-full items-center gap-1.5 sm:gap-2">
                            <Input
                                placeholder="Ask about crops, soil, pests..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="bg-slate-50 border-slate-200 focus-visible:ring-green-500 text-xs sm:text-sm h-9"
                                disabled={isLoading}
                            />
                            <Button
                                size="icon"
                                variant={isListening ? "destructive" : "outline"}
                                onClick={toggleListening}
                                className={cn(
                                    "shrink-0 transition-colors h-9 w-9",
                                    isListening && "animate-pulse"
                                )}
                                disabled={isLoading}
                                title="Voice Input"
                            >
                                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-slate-600" />}
                            </Button>
                            <Button
                                size="icon"
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputValue.trim()}
                                className="bg-green-600 hover:bg-green-700 text-white shrink-0 shadow-sm h-9 w-9"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-105 border-2 border-white p-0 flex items-center justify-center",
                    isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                )}
                aria-label="Farm IQ Assistance Chatbot"
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-white" />
                )}
            </Button>
        </div>
    );
};
