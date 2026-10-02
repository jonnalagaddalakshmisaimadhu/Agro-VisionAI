
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, Mic, MicOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { askFarmIQAI } from "@/services/geminiService";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface EmbeddedAIChatProps {
    diseaseName: string;
    contextData: string;
}

const EmbeddedAIChat: React.FC<EmbeddedAIChatProps> = ({ diseaseName, contextData }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const simulateTyping = async (text: string) => {
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        const typingSpeed = 5; // ms per char
        let currentText = '';

        for (let i = 0; i < text.length; i++) {
            await new Promise(resolve => setTimeout(resolve, typingSpeed));
            currentText += text[i];
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                    lastMsg.content = currentText;
                }
                return newMessages;
            });
        }
    };

    // Fetch initial AI recommendation on mount
    useEffect(() => {
        const fetchInitialRecommendation = async () => {
            setIsInitialLoading(true);
            try {
                const isBackground = diseaseName.toLowerCase().includes('background') || diseaseName.toLowerCase().includes('no plant');
                const initialPrompt = isBackground
                    ? `The user uploaded an image that was detected as: ${diseaseName}. Context: ${contextData}. 
                       Explain that No Plant was detected and give tips for better photography. Do NOT suggest pesticides.`
                    : `I have detected ${diseaseName}. Here is the detailed context: ${contextData}. 
                       Please provide a professional agricultural advisory starting with a short introduction, 
                       then a 'Chemical Control Module' table with Recommended Pesticides and Purchase Links 
                       (Google search URLs in markdown format: [Order Now](https://www.google.com/search?q=buy+pesticide_name)), 
                       followed by 'User Safety Precautions' and a brief 'Conclusion'.`;

                const aiResponse = await askFarmIQAI(initialPrompt, [], "en", contextData);
                await simulateTyping(aiResponse);
            } catch (error) {
                console.error('Error fetching initial advice:', error);
                setMessages([{
                    role: 'assistant',
                    content: `I'm here to help with **${diseaseName}**, but I'm having trouble generating a detailed report right now. Please ask me any specific questions you have!`
                }]);
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchInitialRecommendation();
    }, [diseaseName, contextData]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = { role: 'user' as const, content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const apiHistory = [
                {
                    role: "assistant",
                    content: `Context: The user is looking at a report for ${diseaseName}. Details: ${contextData}.`
                },
                ...messages.map(msg => ({ role: msg.role, content: msg.content }))
            ];

            const aiResponse = await askFarmIQAI(userMessage.content, apiHistory, "en", contextData);
            await simulateTyping(aiResponse);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I apologize, but I encountered an issue generating a response. Please check your internet connection or ask again."
            }]);
            setIsLoading(false);
        }
    };

    const [isListening, setIsListening] = useState(false);
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
            setInputValue('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Card id="embedded-ai-disease-chat" className="mt-6 sm:mt-8 border-2 border-green-100 shadow-md bg-gradient-to-b from-white to-green-50/20 overflow-hidden">
            <CardHeader className="border-b border-green-100 bg-green-50/50 p-3.5 sm:p-5 pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-xl text-green-800 font-bold">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
                    <span>AI Disease Consultant</span>
                </CardTitle>
                <p className="text-xs sm:text-sm text-green-700 leading-snug">
                    Ask follow-up questions about {diseaseName} treatment and care
                </p>
            </CardHeader>

            <CardContent className="p-0">
                <ScrollArea className="h-[340px] sm:h-[400px] p-2.5 sm:p-4">
                    <div className="space-y-3 sm:space-y-4">
                        {isInitialLoading && messages.length === 0 && (
                            <div className="flex items-start gap-2 sm:gap-3">
                                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 bg-green-100 border border-green-200 shrink-0">
                                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-green-700 m-auto" />
                                </Avatar>
                                <div className="bg-white border border-gray-100 px-3.5 py-2 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-green-600" />
                                    <span className="text-xs sm:text-sm text-gray-500">Preparing customized advisory chart...</span>
                                </div>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-start gap-2 sm:gap-3 w-full max-w-full sm:max-w-[95%]",
                                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <Avatar className={cn("h-7 w-7 sm:h-8 sm:w-8 shrink-0", msg.role === 'assistant' ? "bg-green-100 border border-green-200" : "bg-blue-100 border border-blue-200")}>
                                    {msg.role === 'assistant' ? (
                                        <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-green-700 m-auto" />
                                    ) : (
                                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700 m-auto" />
                                    )}
                                </Avatar>

                                <div
                                    className={cn(
                                        "rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm shadow-xs min-w-0 max-w-[calc(100%-2.25rem)] overflow-hidden",
                                        msg.role === 'user'
                                            ? "bg-green-600 text-white rounded-tr-none"
                                            : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                                    )}
                                >
                                    <div className="prose prose-xs sm:prose-sm max-w-none dark:prose-invert break-words overflow-hidden text-slate-800">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h3: ({ node, ...props }) => <h3 className="text-slate-950 font-bold text-sm sm:text-base mt-3 mb-1.5 block break-words border-l-3 border-green-500 pl-2" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 sm:pl-5 space-y-1 my-2 block text-xs sm:text-sm" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 sm:pl-5 space-y-1 my-2 block text-xs sm:text-sm" {...props} />,
                                                li: ({ node, ...props }) => <li className="text-green-800 font-medium break-words leading-relaxed" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-2 text-slate-800 block break-words leading-relaxed last:mb-0 text-xs sm:text-sm" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-slate-950 underline decoration-green-500/30 underline-offset-2" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-4 font-semibold transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                                                table: ({ node, ...props }) => (
                                                    <div className="my-2.5 w-full overflow-x-auto rounded-lg border border-slate-200 shadow-xs touch-pan-x bg-white">
                                                        <table className="w-full text-left text-xs divide-y divide-slate-200" {...props} />
                                                    </div>
                                                ),
                                                thead: ({ node, ...props }) => <thead className="bg-slate-50 text-slate-900" {...props} />,
                                                tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-slate-100" {...props} />,
                                                tr: ({ node, ...props }) => <tr className="hover:bg-slate-50/50 transition-colors" {...props} />,
                                                th: ({ node, ...props }) => <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-800 bg-green-50/70 whitespace-normal break-words" {...props} />,
                                                td: ({ node, ...props }) => <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs text-slate-700 align-top border-r last:border-0 border-slate-100 whitespace-normal break-words" {...props} />,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-2 sm:gap-3 mr-auto max-w-[85%]">
                                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 bg-green-100 border border-green-200 shrink-0">
                                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-green-700 m-auto" />
                                </Avatar>
                                <div className="bg-white border border-gray-100 px-3.5 py-2 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-green-600" />
                                    <span className="text-xs sm:text-sm text-gray-500">Evaluating...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-2 sm:p-3 bg-white border-t border-green-100">
                <div className="flex w-full gap-1.5 sm:gap-2 items-center">
                    <div className="flex-1 flex gap-1.5 sm:gap-2 items-center min-w-0">
                        <Input
                            placeholder={`Ask about ${diseaseName || 'crop care'}...`}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="flex-1 h-9 sm:h-10 text-xs sm:text-sm border-green-200 focus-visible:ring-green-500 bg-green-50/30 px-3 min-w-0"
                            disabled={isLoading}
                        />
                        <Button
                            size="icon"
                            variant={isListening ? "destructive" : "outline"}
                            onClick={toggleListening}
                            className={cn(
                                "h-9 w-9 sm:h-10 sm:w-10 shrink-0 transition-colors border-green-200 hover:bg-green-50",
                                isListening && "animate-pulse"
                            )}
                            disabled={isLoading}
                            title="Voice Input"
                        >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-green-600" />}
                        </Button>
                    </div>
                    <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputValue.trim()}
                        className="h-9 px-3 sm:px-4 bg-green-600 hover:bg-green-700 text-white shadow-xs shrink-0 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold rounded-lg"
                    >
                        <Send className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Send</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default EmbeddedAIChat;
