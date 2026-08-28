
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
        <Card className="mt-8 border-2 border-green-100 shadow-lg bg-gradient-to-b from-white to-green-50/20">
            <CardHeader className="border-b border-green-100 bg-green-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-green-800">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    AI Disease Consultant
                </CardTitle>
                <p className="text-sm text-green-600">
                    Ask follow-up questions about {diseaseName} treatment and care
                </p>
            </CardHeader>

            <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-6">
                    <div className="space-y-4">
                        {isInitialLoading && messages.length === 0 && (
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 bg-green-100 border border-green-200">
                                    <Bot className="h-5 w-5 text-green-700 m-auto" />
                                </Avatar>
                                <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                    <span className="text-sm text-gray-500">Preparing customized advisory chart...</span>
                                </div>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-start gap-3 max-w-[95%]",
                                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <Avatar className={cn("h-8 w-8", msg.role === 'assistant' ? "bg-green-100 border border-green-200" : "bg-blue-100 border border-blue-200")}>
                                    {msg.role === 'assistant' ? (
                                        <Bot className="h-5 w-5 text-green-700 m-auto" />
                                    ) : (
                                        <User className="h-5 w-5 text-blue-700 m-auto" />
                                    )}
                                </Avatar>

                                <div
                                    className={cn(
                                        "rounded-2xl px-4 py-2 text-sm shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-green-600 text-white rounded-tr-none"
                                            : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                                    )}
                                >
                                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-white">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h3: ({ node, ...props }) => <h3 className="text-slate-950 font-bold text-lg mt-4 mb-2 block break-words border-l-4 border-green-500 pl-2" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-2 my-3 block" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 space-y-2 my-3 block" {...props} />,
                                                li: ({ node, ...props }) => <li className="text-green-700 font-semibold break-words leading-relaxed" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-3 text-slate-800 block break-words leading-relaxed last:mb-0" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-slate-950 underline decoration-green-500/30 underline-offset-2" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-4 font-semibold transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                                                table: ({ node, ...props }) => (
                                                    <div className="my-4 w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                                                        <table className="min-w-full divide-y divide-slate-200" {...props} />
                                                    </div>
                                                ),
                                                thead: ({ node, ...props }) => <thead className="bg-slate-50 text-slate-900" {...props} />,
                                                tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-slate-100" {...props} />,
                                                tr: ({ node, ...props }) => <tr className="hover:bg-slate-50/50 transition-colors" {...props} />,
                                                th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-green-800 bg-green-50/50" {...props} />,
                                                td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-slate-700 align-top border-r last:border-0 border-slate-50" {...props} />,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3 mr-auto max-w-[85%]">
                                <Avatar className="h-8 w-8 bg-green-100 border border-green-200">
                                    <Bot className="h-5 w-5 text-green-700 m-auto" />
                                </Avatar>
                                <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                    <span className="text-sm text-gray-500">Evaluating...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-4 bg-white border-t border-green-100">
                <div className="flex w-full gap-2">
                    <div className="flex-1 flex gap-2">
                        <Input
                            placeholder={`Ask about ${diseaseName} specifics...`}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="flex-1 border-green-200 focus-visible:ring-green-500 bg-green-50/30"
                            disabled={isLoading}
                        />
                        <Button
                            size="icon"
                            variant={isListening ? "destructive" : "outline"}
                            onClick={toggleListening}
                            className={cn(
                                "shrink-0 transition-colors border-green-200 hover:bg-green-50",
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
                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default EmbeddedAIChat;
