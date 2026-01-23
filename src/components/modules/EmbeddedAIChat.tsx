
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

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface EmbeddedAIChatProps {
    diseaseName: string;
    contextData: string;
}

const EmbeddedAIChat: React.FC<EmbeddedAIChatProps> = ({ diseaseName, contextData }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: `I see you've detected **${diseaseName}**. \n\nI have the full context of this disease. Feel free to ask me anything about the symptoms, specific chemical treatments, or organic alternatives.`
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const simulateTyping = async (text: string) => {
        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        const typingSpeed = 5; // ms per char

        for (let i = 0; i < text.length; i++) {
            await new Promise(resolve => setTimeout(resolve, typingSpeed));
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
            // Create a history that includes the context as a hidden system-like message first if needed, 
            // but typically we just append the conversation. 
            // To make the bot "aware", we can prepend a context message to the history sent to the API, 
            // OR we rely on the user's prompt. 
            // Better approach: Prepend a system instruction to the history array we send.

            const apiHistory = [
                {
                    role: "assistant",
                    content: `Context: The user is looking at a report for ${diseaseName}. Details: ${contextData}. I am ready to answer follow-up questions about this.`
                },
                ...messages.map(msg => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: userMessage.content }
            ];

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: apiHistory
                }),
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();
            await simulateTyping(data.response);

        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please try again." }]);
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
                <ScrollArea className="h-[300px] p-6">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-start gap-3 max-w-[85%]",
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
                                                h3: ({ node, ...props }) => <h3 className="text-black font-bold text-base mt-3 mb-1 block break-words" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-2 block" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-2 block" {...props} />,
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
