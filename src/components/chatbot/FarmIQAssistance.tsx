
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MessageCircle, X, Send, Mic, MicOff, Sprout, Loader2 } from 'lucide-react';
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

export const FarmIQAssistance = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am Farm IQ Assistance. How can I help you with your farming needs today?' }
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
            recognitionRef.current.lang = navigator.language || 'en-US';

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
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setInputValue(''); // Clear input before listening
            recognitionRef.current?.start();
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

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: history
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            await simulateTyping(data.response);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to the server. If the problem persists, please check your internet connection." }]);
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <Card className="w-[350px] md:w-[400px] shadow-2xl mb-4 border-green-200 animate-in slide-in-from-bottom-5 duration-300">
                    <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-t-xl p-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-white/20 rounded-full">
                                <Sprout className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Farm IQ Assistance</CardTitle>
                                <p className="text-xs text-green-100 opacity-90">AI Agri-Expert Support</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </CardHeader>

                    <CardContent className="p-0 bg-slate-50">
                        <ScrollArea className="h-[400px] p-4">
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex flex-col max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap break-words overflow-hidden",
                                            msg.role === 'user'
                                                ? "ml-auto bg-green-600 text-white rounded-br-none"
                                                : "mr-auto bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                                        )}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h3: ({ node, ...props }) => <h3 className="text-black font-bold text-base mt-3 mb-1 block break-words" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-2 block" {...props} />,
                                                    li: ({ node, ...props }) => <li className="text-green-600 font-medium break-words leading-relaxed" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 text-slate-700 block break-words leading-relaxed" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-bold text-black" {...props} />,
                                                    table: ({ node, ...props }) => <div className="my-3 w-full overflow-x-auto rounded-lg border border-slate-200"><table className="min-w-full divide-y divide-slate-200" {...props} /></div>,
                                                    thead: ({ node, ...props }) => <thead className="bg-slate-50 text-slate-700" {...props} />,
                                                    tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-slate-200" {...props} />,
                                                    tr: ({ node, ...props }) => <tr className="" {...props} />,
                                                    th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100/80 sticky top-0 backdrop-blur-sm" {...props} />,
                                                    td: ({ node, ...props }) => <td className="px-3 py-2 text-sm text-slate-600 align-top" {...props} />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="mr-auto bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2 text-sm text-slate-500 shadow-sm">
                                        <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                                        Thinking...
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <CardFooter className="p-3 bg-white border-t border-slate-100 rounded-b-xl">
                        <div className="flex w-full items-center gap-2">
                            <Input
                                placeholder="Ask about crops, soil, pests..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="bg-slate-50 border-slate-200 focus-visible:ring-green-500"
                                disabled={isLoading}
                            />
                            <Button
                                size="icon"
                                variant={isListening ? "destructive" : "outline"}
                                onClick={toggleListening}
                                className={cn(
                                    "shrink-0 transition-colors",
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
                                className="bg-green-600 hover:bg-green-700 text-white shrink-0 shadow-sm"
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
                    "h-16 w-16 rounded-full shadow-xl transition-all duration-300 hover:scale-105 border-4 border-white",
                    isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                )}
            >
                {isOpen ? (
                    <X className="w-8 h-8 text-white" />
                ) : (
                    <MessageCircle className="w-8 h-8 text-white" />
                )}
            </Button>
        </div>
    );
};
