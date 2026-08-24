import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Phone, Video, Calendar, Clock, Paperclip, Send, User, Star, MapPin } from "lucide-react";

export const AquaExpertsView = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Expert Consultation</h2>
                <p className="text-slate-500 mt-2">Get real-time advice from certified aquaculture professionals.</p>
            </div>

            <Tabs defaultValue="chat" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md h-auto p-1 bg-slate-100/80 backdrop-blur rounded-xl mb-6">
                    <TabsTrigger value="chat" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                        <MessageSquare className="w-4 h-4 mr-2" /> Live Expert Chat
                    </TabsTrigger>
                    <TabsTrigger value="book" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                        <Calendar className="w-4 h-4 mr-2" /> Book Consultation
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB: LIVE CHAT --- */}
                <TabsContent value="chat" className="h-[600px] flex gap-4">
                    {/* Chat Sidebar - Active Experts */}
                    <Card className="w-1/3 hidden md:flex flex-col h-full border-none shadow-md">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg">Online Experts</CardTitle>
                            <CardDescription>Available for immediate help</CardDescription>
                        </CardHeader>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-4">
                                <ExpertMiniCard
                                    name="Dr. Suresh Kumar"
                                    role="Pathologist"
                                    status="online"
                                    image="/placeholder-user.jpg"
                                />
                                <ExpertMiniCard
                                    name="Ramesh Varma"
                                    role="Water Quality Specialist"
                                    status="busy"
                                    image="/placeholder-user.jpg"
                                />
                                <ExpertMiniCard
                                    name="Priya Reddy"
                                    role="Nutritionist"
                                    status="online"
                                    image="/placeholder-user.jpg"
                                />
                            </div>
                        </ScrollArea>
                    </Card>

                    {/* Chat Area */}
                    <Card className="flex-1 flex flex-col h-full border-none shadow-md overflow-hidden relative">
                        {/* Chat Header */}
                        <div className="p-4 border-b bg-white flex justify-between items-center z-10">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-green-500">
                                    <AvatarImage src="/placeholder-user.jpg" />
                                    <AvatarFallback>SK</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-bold text-slate-800">Dr. Suresh Kumar</h4>
                                    <div className="flex items-center text-xs text-green-600">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                        Online Now
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="border-green-200 text-green-700 bg-green-50 hover:bg-green-100">
                                    <Phone className="h-4 w-4 mr-2" /> Call Now
                                </Button>
                                <Button size="sm" variant="outline" className="hidden md:flex">
                                    <Video className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 bg-slate-50 p-4">
                            <div className="space-y-4">
                                <ChatBubble
                                    message="Hello! I'm Dr. Suresh. How can I assist you with your pond today?"
                                    time="10:30 AM"
                                    sender="expert"
                                />
                                <ChatBubble
                                    message="Hi Doctor, my Vannamei shrimp are showing slow growth. The water pH is 8.2."
                                    time="10:32 AM"
                                    sender="user"
                                />
                                <ChatBubble
                                    message="I see. Can you share a recent photo of the shrimp and the pond water color?"
                                    time="10:33 AM"
                                    sender="expert"
                                />
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t">
                            <div className="flex items-end gap-2">
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                                <div className="flex-1 relative">
                                    <Textarea
                                        placeholder="Type your message..."
                                        className="min-h-[50px] resize-none pr-10 border-slate-200 focus-visible:ring-blue-500"
                                    />
                                </div>
                                <Button className="bg-blue-600 hover:bg-blue-700 h-[50px] w-[50px] rounded-xl">
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-center">
                                You can upload images of your pond or test reports for better analysis.
                            </p>
                        </div>
                    </Card>
                </TabsContent>

                {/* --- TAB: BOOK CONSULTATION --- */}
                <TabsContent value="book" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Filters */}
                        <Card className="lg:col-span-1 border-none shadow-md h-fit">
                            <CardHeader>
                                <CardTitle>Find an Expert</CardTitle>
                                <CardDescription>Filter by specialization</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Specialization</label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Specialists" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="disease">Disease Management</SelectItem>
                                            <SelectItem value="water">Water Quality</SelectItem>
                                            <SelectItem value="feed">Nutrition & Feed</SelectItem>
                                            <SelectItem value="harvest">Harvest Planning</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Availability</label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any Time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="tomorrow">Tomorrow</SelectItem>
                                            <SelectItem value="weekend">This Weekend</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full mt-2">Apply Filters</Button>
                            </CardContent>
                        </Card>

                        {/* Expert Listings */}
                        <div className="lg:col-span-2 space-y-4">
                            <ExpertProfileCard
                                name="Dr. Suresh Kumar"
                                role="Senior Pathologist"
                                exp="15+ Years Experience"
                                rating="4.9"
                                reviews="120"
                                price="₹500 / Session"
                                tags={["Disease Control", "Shrimp Specialist"]}
                            />
                            <ExpertProfileCard
                                name="Ramesh Varma"
                                role="Aquaculture Engineer"
                                exp="8 Years Experience"
                                rating="4.7"
                                reviews="85"
                                price="₹350 / Session"
                                tags={["Pond Design", "Aeration Systems"]}
                            />
                            <ExpertProfileCard
                                name="Priya Reddy"
                                role="Aqua Nutritionist"
                                exp="10 Years Experience"
                                rating="4.8"
                                reviews="92"
                                price="₹400 / Session"
                                tags={["Feed Formulation", "Growth Optimization"]}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const ExpertMiniCard = ({ name, role, status, image }: any) => (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100">
        <div className="relative">
            <Avatar>
                <AvatarImage src={image} />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${status === 'online' ? 'bg-green-500' : 'bg-amber-500'
                }`}></div>
        </div>
        <div>
            <h4 className="text-sm font-semibold text-slate-800">{name}</h4>
            <p className="text-xs text-slate-500">{role}</p>
        </div>
    </div>
);

const ChatBubble = ({ message, time, sender }: any) => (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] rounded-2xl p-4 ${sender === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-sm'
            }`}>
            <p className="text-sm">{message}</p>
            <p className={`text-[10px] mt-1 text-right ${sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                {time}
            </p>
        </div>
    </div>
);

const ExpertProfileCard = ({ name, role, exp, rating, reviews, price, tags }: any) => (
    <Card className="border-none shadow-md hover:shadow-lg transition-all">
        <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center">
                    <Avatar className="h-20 w-20">
                        <AvatarFallback className="text-xl bg-slate-100 text-slate-600">{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center mt-3 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                        <span className="text-xs font-bold text-yellow-700">{rating} ({reviews})</span>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                            <p className="text-slate-500 font-medium">{role}</p>
                            <div className="flex items-center text-sm text-slate-400 mt-1">
                                <Briefcase className="h-3 w-3 mr-1" /> {exp}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-xl font-bold text-blue-600">{price}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-600">{tag}</Badge>
                        ))}
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="bg-slate-50/50 p-4 flex justify-end gap-3 border-t">
            <Button variant="outline">View Profile</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Book Appointment</Button>
        </CardFooter>
    </Card>
);

const Briefcase = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
)
