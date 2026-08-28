import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HelpCircle,
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Mail,
  MapPin,
  Clock,
  BookOpen,
  Lightbulb,
  Leaf,
  Wheat,
  Droplets,
  Sun,
  AlertTriangle,
  TrendingUp,
  Users,
  Shield,
  Search,
  Send,
  ArrowLeft,
  MessageSquare,
  Plus,
  Bot,
  Sparkles,
  CheckCircle2,
  Check,
  Radio,
  Lock,
  Truck,
  Stethoscope,
  ChevronRight,
  RefreshCw,
  FileText,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useLocation } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";

interface HelpPageProps {
  setActiveModule?: (module: string) => void;
}

interface CommunityChannel {
  id: string;
  name: string;
  members: number;
  region: string;
  category: string;
  description: string;
  active_now: number;
}

interface CommunityMessage {
  id: number;
  sender: string;
  text: string;
  time: string;
  is_expert?: boolean;
  reaction?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: "Submitted" | "In Review" | "Resolved";
  createdAt: string;
  response?: string;
}

const COMMUNITY_CHANNELS: CommunityChannel[] = [
  {
    id: "1",
    name: "Delta Paddy & Rice Growers",
    members: 1420,
    region: "Andhra Pradesh & Telangana",
    category: "Paddy & Grains",
    description: "Discussions on MTU-1061 / BPT-5204 nursery, blast prevention, water rotation, and mandi prices.",
    active_now: 42
  },
  {
    id: "2",
    name: "Guntur Chilli & Cotton Circle",
    members: 1980,
    region: "Guntur / Prakasam / Warangal",
    category: "Cash Crops",
    description: "Managing black thrips, pesticide schedules, drip fertigation, and daily Guntur yard rates.",
    active_now: 68
  },
  {
    id: "3",
    name: "Farm Machinery & Drones",
    members: 860,
    region: "South India",
    category: "Mechanization",
    description: "Custom hiring rates, drone spraying tips, tractor implements, rotavators, and laser land leveling.",
    active_now: 24
  },
  {
    id: "4",
    name: "Micro-Irrigation & Solar Pumps",
    members: 650,
    region: "Rayalaseema / Telangana",
    category: "Irrigation",
    description: "Drip automation, subsidy paperwork for APMIP / PM-KUSUM, and borewell management.",
    active_now: 19
  },
  {
    id: "5",
    name: "Organic & Natural Farming",
    members: 1120,
    region: "All Regions",
    category: "Organic",
    description: "Jeevamrutham recipes, neem oil pest management, vermicompost, and zero-budget techniques.",
    active_now: 31
  }
];

const HelpPage: React.FC<HelpPageProps> = ({ setActiveModule }) => {
  const { locationData } = useLocation();
  const { user } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<"guide" | "community" | "ai_helpdesk" | "contact">("guide");
  const [searchQuery, setSearchQuery] = useState("");

  // Community State
  const [channels, setChannels] = useState<CommunityChannel[]>(COMMUNITY_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<CommunityChannel>(COMMUNITY_CHANNELS[0]);
  const [channelSearch, setChannelSearch] = useState("");
  const [chatMessages, setChatMessages] = useState<CommunityMessage[]>([]);
  const [newMsgText, setNewMsgText] = useState("");
  const [userHandle, setUserHandle] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // AI Assistant State
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiChat, setAiChat] = useState<Array<{ sender: "user" | "bot"; text: string; time: string }>>([
    {
      sender: "bot",
      text: "Namaste! I am your AI Farming Assistant. Ask me anything about crop diseases, spray dosages, fertilizer schedules, equipment rental, or government schemes.",
      time: "Just now"
    }
  ]);

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    {
      id: "TK-8402",
      subject: "PM-KISAN 17th Installment Status Check",
      category: "Government Schemes",
      status: "Resolved",
      createdAt: "Yesterday, 3:30 PM",
      response: "Your e-KYC status is verified. The ₹2,000 installment has been credited to your Aadhaar-linked bank account."
    },
    {
      id: "TK-8439",
      subject: "Chilli Thrips Spray Schedule Guidance",
      category: "Crop Management",
      status: "In Review",
      createdAt: "Today, 10:15 AM",
      response: "Dr. Priya Sharma (Entomologist) is reviewing your query. Recommendation will be shared shortly."
    }
  ]);

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    category: "Crop Disease & Soil Health",
    subject: "",
    message: ""
  });
  const [ticketSubmitted, setTicketSubmitted] = useState<string | null>(null);

  // In-App Helpline Call State
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callState, setCallState] = useState<"ringing" | "connected" | "ended">("ringing");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const ringtoneRef = useRef<any>(null);

  // Set User Handle
  useEffect(() => {
    if (user?.full_name) {
      setUserHandle(`${user.full_name} (${locationData?.locationName || "Farmer"})`);
    } else {
      setUserHandle(`Farmer (${locationData?.locationName || "Andhra Pradesh"})`);
    }
  }, [user, locationData]);

  // Fetch Channels from Backend
  useEffect(() => {
    fetch("http://localhost:8000/api/community/channels")
      .then((res) => res.json())
      .then((data) => {
        if (data.channels && data.channels.length > 0) {
          setChannels(data.channels);
          setSelectedChannel(data.channels[0]);
        }
      })
      .catch(() => {
        setChannels(COMMUNITY_CHANNELS);
      });
  }, []);

  // Channel WebSocket & History
  useEffect(() => {
    if (!selectedChannel) return;

    const channelId = selectedChannel.id;

    // Fetch initial chat history
    fetch(`http://localhost:8000/api/community/channels/${channelId}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setChatMessages(data.messages);
        }
      })
      .catch(() => {});

    // Establish WebSocket Connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/api/community/ws/${channelId}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setChatMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } catch (err) {
        console.error("WebSocket message parse error", err);
      }
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [selectedChannel]);

  // Scroll Chat to Bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Call Timer
  useEffect(() => {
    let timer: any = null;
    if (isCallOpen && callState === "connected") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCallOpen, callState]);

  // Navigation
  const navigateTo = (moduleKey: string) => {
    if (setActiveModule) {
      setActiveModule(moduleKey);
    } else {
      window.location.hash = `#${moduleKey}`;
    }
  };

  // Send Message
  const handleSendCommunityMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim() || !selectedChannel) return;

    const payload = {
      id: Date.now(),
      sender: userHandle || "Farmer",
      text: newMsgText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      is_expert: false
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      setChatMessages((prev) => [...prev, payload]);
    }
    setNewMsgText("");
  };

  // Ask AI
  const handleAskAI = async (queryText?: string) => {
    const question = queryText || aiInput;
    if (!question.trim()) return;

    const userMsg = {
      sender: "user" as const,
      text: question,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setAiChat((prev) => [...prev, userMsg]);
    setAiInput("");
    setAiLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          context: {
            location: locationData?.locationName || "Andhra Pradesh",
            temp: locationData?.weatherData?.main?.temp || 28
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiChat((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.response || data.reply || "Here is the recommended agricultural action for your query.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } else {
        throw new Error("Chat error");
      }
    } catch (err) {
      let reply = "General Agricultural Recommendation: Maintain proper field drainage, inspect leaf tips for discoloration, and use balanced NPK fertilizers. For sudden pest flare-ups, consult your nearest Krishi Vigyan Kendra (KVK) or district agricultural officer.";
      if (question.toLowerCase().includes("blast") || question.toLowerCase().includes("paddy")) {
        reply = "For Paddy Blast (Pyricularia oryzae): Spray Tricyclazole 75% WP @ 0.6g per liter of water. Avoid excessive nitrogen application during misty mornings and maintain 2-3 inches standing water.";
      } else if (question.toLowerCase().includes("pm-kisan") || question.toLowerCase().includes("scheme")) {
        reply = "For PM-KISAN & State Schemes: Verify that your Aadhaar e-KYC and land records are seeded on pmkisan.gov.in. Subsidies are credited directly to your bank account via DBT.";
      }

      setAiChat((prev) => [
        ...prev,
        {
          sender: "bot",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Submit Contact Form
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: SupportTicket = {
      id: newId,
      subject: contactForm.subject || "Agricultural Inquiry",
      category: contactForm.category,
      status: "Submitted",
      createdAt: "Just now"
    };

    setSupportTickets((prev) => [newTicket, ...prev]);
    setTicketSubmitted(newId);
    setContactForm({
      name: "",
      email: "",
      category: "Crop Disease & Soil Health",
      subject: "",
      message: ""
    });
  };

  // In-App Call Handlers
  const startCall = () => {
    setCallState("ringing");
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeaker(true);
    setIsCallOpen(true);

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      ringtoneRef.current = { ctx, osc };
    } catch (e) {}

    setTimeout(() => {
      if (ringtoneRef.current) {
        try {
          ringtoneRef.current.osc.stop();
          ringtoneRef.current.ctx.close();
        } catch (e) {}
        ringtoneRef.current = null;
      }
      setCallState("connected");
    }, 2000);
  };

  const endCall = () => {
    if (ringtoneRef.current) {
      try {
        ringtoneRef.current.osc.stop();
        ringtoneRef.current.ctx.close();
      } catch (e) {}
      ringtoneRef.current = null;
    }
    setCallState("ended");
    setTimeout(() => {
      setIsCallOpen(false);
    }, 500);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  const filteredChannels = channels.filter(
    (c) =>
      c.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(channelSearch.toLowerCase())
  );

  const guideCards = [
    {
      title: "Crop Disease Diagnosis",
      category: "AI Health Scanner",
      icon: <Leaf className="h-5 w-5 text-emerald-600" />,
      color: "emerald",
      steps: [
        "Take a clear photo or video of the infected leaf.",
        "AI scans for fungal, bacterial, or viral symptoms.",
        "Get instant medicine name & dosage per acre."
      ],
      moduleKey: "disease-detection",
      buttonText: "Open Disease Detection"
    },
    {
      title: "Equipment & Machinery Rental",
      category: "Machinery Hiring",
      icon: <Truck className="h-5 w-5 text-blue-600" />,
      color: "blue",
      steps: [
        "Filter Tractors, Drones, and Harvesters by district.",
        "Call machine owners directly in-app with full privacy.",
        "Book by day or acre and generate printable challans."
      ],
      moduleKey: "equipment-rental",
      buttonText: "Browse Equipment Rentals"
    },
    {
      title: "Direct Crop Marketplace",
      category: "Farmer Marketplace",
      icon: <Search className="h-5 w-5 text-indigo-600" />,
      color: "indigo",
      steps: [
        "List your crop with quantity, grade, and price.",
        "Chat with verified buyers in real-time.",
        "Make in-app voice calls to finalize the deal."
      ],
      moduleKey: "marketplace",
      buttonText: "Open Crop Marketplace"
    },
    {
      title: "Crop Profit Predictor",
      category: "Yield & Income",
      icon: <TrendingUp className="h-5 w-5 text-amber-600" />,
      color: "amber",
      steps: [
        "Select your district, soil type, and acreage.",
        "Choose target crop for Kharif or Rabi season.",
        "See estimated input costs, yield, and profit per acre."
      ],
      moduleKey: "crop-profit-predictor",
      buttonText: "Open Profit Predictor"
    },
    {
      title: "Agronomist Consultation",
      category: "Scientific Advisory",
      icon: <Stethoscope className="h-5 w-5 text-purple-600" />,
      color: "purple",
      steps: [
        "Browse certified plant pathologists and soil doctors.",
        "Click Consult to start an instant 2-way in-app voice call.",
        "Get personalized advice on soil tests and crop nutrition."
      ],
      moduleKey: "expert-consultation",
      buttonText: "Consult an Agronomist"
    },
    {
      title: "Government Schemes & Subsidies",
      category: "Welfare & Subsidies",
      icon: <Shield className="h-5 w-5 text-teal-600" />,
      color: "teal",
      steps: [
        "Browse Central (PM-KISAN, SMAM) and State schemes.",
        "Check eligibility requirements in 1 click.",
        "Apply directly on official government portals."
      ],
      moduleKey: "government-schemes",
      buttonText: "View Government Schemes"
    }
  ];

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      
      {/* 1. CLEAN, MODERN HEADER */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 rounded-full text-emerald-200 text-[10px] sm:text-xs font-medium">
              <HelpCircle className="h-3 w-3" />
              <span>Help & Knowledge Center</span>
            </div>
            <h1 className="text-base sm:text-2xl font-bold tracking-tight text-white leading-tight">
              How can we help you today?
            </h1>
            <p className="text-emerald-100 text-[11px] sm:text-xs max-w-2xl leading-normal line-clamp-2 sm:line-clamp-none">
              Step-by-step guides for every feature, regional farmer forum, instant AI diagnosis, and toll-free helplines.
            </p>
            {locationData?.locationName && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-200 font-medium pt-0.5">
                <MapPin className="h-3 w-3" />
                <span>Region: {locationData.locationName}</span>
                {locationData.weatherData && (
                  <span>• {Math.round(locationData.weatherData.main.temp)}°C</span>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
            <Button
              onClick={startCall}
              className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold rounded-lg h-8 sm:h-9 px-3.5 shadow-xs flex items-center gap-1.5 text-xs transition-all"
            >
              <PhoneCall className="h-3.5 w-3.5 text-emerald-700" />
              <span>Kisan Helpline</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS - 4 Equal Grid on Mobile */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4 sm:space-y-6">
        <div className="flex justify-center w-full mb-3 sm:mb-5">
          <TabsList className="bg-slate-200/80 p-1 rounded-xl shadow-xs grid grid-cols-4 w-full sm:w-auto sm:inline-flex max-w-2xl h-auto gap-0.5 sm:gap-1">
            <TabsTrigger
              value="guide"
              className="rounded-lg font-medium py-1.5 px-1 sm:px-3 text-[11px] sm:text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-1 truncate"
            >
              <BookOpen className="h-3 w-3 hidden sm:inline" />
              <span>Guides</span>
            </TabsTrigger>
            <TabsTrigger
              value="community"
              className="rounded-lg font-medium py-1.5 px-1 sm:px-3 text-[11px] sm:text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-1 truncate"
            >
              <Users className="h-3 w-3 hidden sm:inline" />
              <span>Forum</span>
            </TabsTrigger>
            <TabsTrigger
              value="ai_helpdesk"
              className="rounded-lg font-medium py-1.5 px-1 sm:px-3 text-[11px] sm:text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-1 truncate"
            >
              <Bot className="h-3 w-3 hidden sm:inline" />
              <span>AI Help</span>
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="rounded-lg font-medium py-1.5 px-1 sm:px-3 text-[11px] sm:text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-1 truncate"
            >
              <Mail className="h-3 w-3 hidden sm:inline" />
              <span>Support</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: USER GUIDES */}
        <TabsContent value="guide" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {guideCards.map((card, idx) => (
              <Card
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                      {card.icon}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-medium text-slate-500 bg-slate-50">
                      {card.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {card.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-0 space-y-4 text-xs">
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    {card.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {stepIdx + 1}
                        </span>
                        <p className="text-slate-600 text-xs leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => navigateTo(card.moduleKey)}
                    variant="outline"
                    className="w-full font-semibold rounded-xl text-xs h-10 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{card.buttonText}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: COMMUNITY FORUM */}
        <TabsContent value="community" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden min-h-[560px]">
            {/* Sidebar Channels */}
            <div className="lg:col-span-4 border-r border-slate-100 p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-700" />
                  <span>Discussion Channels</span>
                </h3>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                  Live
                </Badge>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search channel topic..."
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  className="pl-8 text-xs rounded-xl bg-white h-9 border-slate-200"
                />
              </div>

              {/* List */}
              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {filteredChannels.map((channel) => {
                  const isSelected = selectedChannel?.id === channel.id;

                  return (
                    <div
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-emerald-50/80 border-emerald-300 shadow-xs"
                          : "bg-white border-slate-200/80 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate max-w-[190px]">
                          {channel.name}
                        </h4>
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {channel.active_now}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-1.5">
                        {channel.description}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {channel.members.toLocaleString()} members • {channel.region}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat Stream */}
            <div className="lg:col-span-8 flex flex-col justify-between p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{selectedChannel.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedChannel.description}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs bg-slate-50">
                  {selectedChannel.active_now} Active Now
                </Badge>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 my-3 bg-slate-50/50 rounded-xl max-h-[360px]" ref={chatScrollRef}>
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-1">
                    <MessageSquare className="h-7 w-7 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No messages yet in this channel</p>
                    <p className="text-[11px]">Start the conversation below.</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.sender.startsWith(userHandle.split(" ")[0]);

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? "bg-emerald-700 text-white rounded-tr-xs"
                              : msg.is_expert
                              ? "bg-purple-50 border border-purple-200 text-purple-950 rounded-tl-xs"
                              : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <span className="font-bold text-[11px] opacity-90 flex items-center gap-1">
                              {msg.sender}
                              {msg.is_expert && (
                                <Badge className="bg-purple-600 text-white text-[9px] py-0 px-1 font-semibold">
                                  Agronomist
                                </Badge>
                              )}
                            </span>
                            <span className="text-[10px] opacity-70">{msg.time}</span>
                          </div>
                          <p>{msg.text}</p>
                          {msg.reaction && (
                            <span className="mt-1.5 inline-block text-xs">
                              {msg.reaction}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendCommunityMessage} className="flex gap-2 pt-2 border-t border-slate-100">
                <Input
                  placeholder={`Write in ${selectedChannel.name}...`}
                  value={newMsgText}
                  onChange={(e) => setNewMsgText(e.target.value)}
                  className="rounded-xl text-xs h-11 border-slate-200 focus:ring-emerald-600 bg-white"
                />
                <Button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: AI FARMING ASSISTANT */}
        <TabsContent value="ai_helpdesk" className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">AI Farming & Agronomy Assistant</h3>
                  <p className="text-xs text-slate-500">
                    Instant answers for crop diseases, fertilizer dosing, equipment hiring, and government schemes.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">Suggested Questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "What is the remedy for Paddy Blast disease?",
                  "How to apply for SMAM 50% tractor subsidy in AP?",
                  "Recommended dosage of Tricyclazole per acre",
                  "What are today's average cotton prices?",
                  "How to manage black thrips in Guntur Chilli?"
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskAI(prompt)}
                    className="text-xs bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Feed */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-3.5 max-h-[380px] overflow-y-auto border border-slate-200/70">
              {aiChat.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-2xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-emerald-700 text-white rounded-tr-xs"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1 opacity-80 text-[10px]">
                      <span className="font-semibold">{msg.sender === "user" ? "You" : "FarmIQ Assistant"}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="whitespace-pre-line text-xs">{msg.text}</p>
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium p-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Consulting agricultural database...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Ask any farming question (e.g. fertilizer dosage, pest remedy, subsidy eligibility)..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAskAI();
                }}
                className="rounded-xl text-xs h-11 border-slate-200 focus:ring-emerald-600"
              />
              <Button
                onClick={() => handleAskAI()}
                disabled={aiLoading || !aiInput.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5 shrink-0 font-semibold"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Ask
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: HELPLINES & CONTACT */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Contact Form */}
            <Card className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 sm:p-8 space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Contact Agricultural Support</h3>
                <p className="text-xs text-slate-500">
                  Send your question to our agronomists and support team.
                </p>
              </div>

              {ticketSubmitted && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-semibold">Inquiry submitted successfully!</p>
                      <p className="text-emerald-700 text-[11px]">Ticket reference: <strong>{ticketSubmitted}</strong></p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTicketSubmitted(null)}
                    className="text-xs h-7 text-emerald-800"
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Your Name *</label>
                    <Input
                      placeholder="e.g. V. Srinivasa Rao"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                      className="rounded-xl h-10"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Contact Phone / Email *</label>
                    <Input
                      placeholder="e.g. 9876543210 or name@email.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                      className="rounded-xl h-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Topic</label>
                  <select
                    value={contactForm.category}
                    onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800"
                  >
                    <option value="Crop Disease & Soil Health">Crop Disease & Soil Health</option>
                    <option value="Government Schemes">Government Schemes & PM-KISAN</option>
                    <option value="Equipment Rental">Equipment Rental Inquiry</option>
                    <option value="Marketplace">Marketplace & Selling</option>
                    <option value="Technical Support">App / Technical Question</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Subject *</label>
                  <Input
                    placeholder="Brief description of the issue..."
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                    className="rounded-xl h-10"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Message *</label>
                  <Textarea
                    placeholder="Provide details such as crop variety, field acreage, symptoms, or transaction details..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                    required
                    className="rounded-xl text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-11 rounded-xl text-xs"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Inquiry
                </Button>
              </form>
            </Card>

            {/* Official Directory & Tickets */}
            <div className="lg:col-span-5 space-y-5">
              {/* Toll-Free Directory */}
              <Card className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3.5">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-700" />
                  <span>Official Government Helplines</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Kisan Call Center (KCC)</p>
                      <p className="text-slate-500 text-[11px]">Govt of India • 22 Languages • 6 AM – 10 PM</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                      1800-180-1551
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Krishi Vigyan Kendra (KVK)</p>
                      <p className="text-slate-500 text-[11px]">District Technical Demonstration Desk</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                      1551 (Toll-Free)
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">PM-KISAN Helpdesk</p>
                      <p className="text-slate-500 text-[11px]">Installment & e-KYC Verification</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                      011-24300606
                    </span>
                  </div>
                </div>
              </Card>

              {/* Tickets List */}
              <Card className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3.5">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  <span>Your Support Inquiries</span>
                </h3>
                <div className="space-y-2.5">
                  {supportTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 text-[11px]">#{ticket.id}</span>
                        <Badge
                          variant="outline"
                          className={
                            ticket.status === "Resolved"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-slate-800">{ticket.subject}</p>
                      {ticket.response && (
                        <p className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 text-[11px]">
                          {ticket.response}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 text-right">{ticket.createdAt}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* IN-APP HELPLINE VOIP VOICE CALL DIALOG */}
      <Dialog open={isCallOpen} onOpenChange={setIsCallOpen}>
        <DialogContent className="sm:max-w-sm bg-slate-950 text-white border-slate-800 rounded-3xl p-6 text-center shadow-2xl">
          <div className="flex flex-col items-center space-y-4 py-4">
            {/* Avatar */}
            <div className="relative flex items-center justify-center">
              <div
                className={`absolute w-24 h-24 rounded-full ${
                  callState === "connected" ? "bg-emerald-500/20 animate-ping" : "bg-blue-500/20 animate-pulse"
                }`}
              ></div>
              <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl relative z-10 p-4">
                <PhoneCall className="h-8 w-8" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Kisan Support Helpline</h3>
              <p className="text-xs text-emerald-400 font-medium">On-Duty Agricultural Officer</p>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-900 rounded-full border border-slate-800 text-slate-400 text-[10px]">
                <Lock className="h-2.5 w-2.5" />
                <span>In-App Voice Connection</span>
              </div>
            </div>

            {/* Status & Timer */}
            <div className="py-1">
              {callState === "ringing" ? (
                <span className="text-xs font-semibold text-blue-400 animate-pulse">Connecting...</span>
              ) : callState === "connected" ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-1 h-4">
                    <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s] h-2.5"></div>
                    <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4"></div>
                    <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-3"></div>
                    <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.2s] h-2"></div>
                  </div>
                  <p className="text-xl font-mono font-bold text-white tracking-wider">
                    {formatTime(callDuration)}
                  </p>
                </div>
              ) : (
                <span className="text-xs font-semibold text-red-400">Call Ended</span>
              )}
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full transition-all ${
                  isMuted ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              {/* End Call */}
              <button
                type="button"
                onClick={endCall}
                className="p-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform hover:scale-105"
                title="Hang Up"
              >
                <PhoneOff className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsSpeaker(!isSpeaker)}
                className={`p-3 rounded-full transition-all ${
                  isSpeaker ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
                title="Speaker"
              >
                {isSpeaker ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelpPage;