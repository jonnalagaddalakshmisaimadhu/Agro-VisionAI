import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  HelpCircle,
  Phone,
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
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocation } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";

const HelpPage = () => {
  const { locationData } = useLocation();
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  // Community Forum State
  const [isForumOpen, setIsForumOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [regData, setRegData] = useState({ name: "", expertise: "", mobile: "" });

  useEffect(() => {
    if (user) {
      setRegData(prev => ({
        ...prev,
        name: user.full_name || "",
        mobile: user.phone || ""
      }));
    }
  }, [user]);

  useEffect(() => {
    if (selectedCommunity && isRegistered) {
      // Connect to WebSocket
      const communityId = selectedCommunity.id;
      const socket = new WebSocket(`ws://localhost:8000/api/community/ws/${communityId}`);

      socket.onopen = () => {
        console.log(`Connected to community ${communityId}`);
      };

      socket.onmessage = (event) => {
        try {
          const newMessage = JSON.parse(event.data);
          setMessages(prev => {
            // Check if message already exists (to avoid duplicates from broadcast)
            if (prev.find(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        } catch (e) {
          console.error("Failed to parse message", e);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        console.log(`Disconnected from community ${communityId}`);
      };

      socketRef.current = socket;

      return () => {
        socket.close();
        setMessages([]); // Clear messages when leaving community
      };
    }
  }, [selectedCommunity, isRegistered]);

  const communities = [
    { id: 1, name: "Local Farmers Network", members: 1250, type: "Local", description: "Connect with farmers in your immediate vicinity." },
    { id: 2, name: "Organic Wheat Growers", members: 850, type: "Specialty", description: "Deep dive into organic wheat techniques." },
    { id: 3, name: "Modern Irrigation Experts", members: 420, type: "Technical", description: "Sharing the latest in water-saving tech." },
    { id: 4, name: "Pest Control Pioneers", members: 930, type: "Specialty", description: "Innovative ways to protect crops." }
  ];

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regData.name && regData.expertise && regData.mobile) {
      setIsRegistered(true);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim() && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const messagePayload = {
        sender: regData.name || "Me",
        text: chatMessage,
      };
      socketRef.current.send(JSON.stringify(messagePayload));
      setChatMessage("");
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle contact form submission
    console.log("Contact form submitted:", contactForm);
    alert("Thank you for your message! We'll get back to you soon.");
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  const handleInputChange = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  const agricultureCategories = [
    { name: "Crop Management", icon: <Wheat className="h-4 w-4" />, color: "bg-green-100 text-green-800" },
    { name: "Disease Control", icon: <AlertTriangle className="h-4 w-4" />, color: "bg-red-100 text-red-800" },
    { name: "Weather & Climate", icon: <Sun className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-800" },
    { name: "Market Insights", icon: <TrendingUp className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
    { name: "Soil & Nutrients", icon: <Leaf className="h-4 w-4" />, color: "bg-orange-100 text-orange-800" },
    { name: "Water Management", icon: <Droplets className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-800" }
  ];

  const faqs = [
    {
      question: "How do I use the disease detection feature?",
      answer: "Simply upload a clear photo of your plant leaves using the camera icon in the Disease Detection module. Our AI will analyze the image and provide diagnosis and treatment recommendations."
    },
    {
      question: "How accurate is the crop recommendation system?",
      answer: "Our AI-powered crop recommendation system considers soil type, weather conditions, market prices, and your location to provide highly accurate suggestions with 90%+ success rate."
    },
    {
      question: "Can I access government schemes through FarmIQ?",
      answer: "Yes! Our Government Schemes module provides information about subsidies, loans, and schemes available in your area. You can also apply directly through the platform."
    },
    {
      question: "How do I rent farming equipment?",
      answer: "Browse available equipment in the Equipment Rental section, select your preferred dates, and book directly. Equipment owners will contact you to confirm the rental."
    },
    {
      question: "Is my data secure on FarmIQ?",
      answer: "Absolutely! We use enterprise-grade security measures to protect your personal and farming data. All data is encrypted and stored securely."
    }
  ];

  return (
    <div className="p-6 lg:pl-0">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-600 rounded-lg">
              <HelpCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-600">Help & Support Center</h1>
              <p className="text-muted-foreground">Get assistance with FarmIQ features and farming guidance</p>
              {locationData?.locationName && (
                <div className="flex items-center space-x-2 mt-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">Location: {locationData.locationName}</span>
                  {locationData.weatherData && (
                    <span className="text-sm text-gray-600">
                      • {Math.round(locationData.weatherData.main.temp)}°C, {locationData.weatherData.main.humidity}% humidity
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Help Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">User Guide</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Learn how to use all FarmIQ features effectively</p>
                  <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        View Guide
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0">
                      <DialogHeader className="p-6 border-b bg-green-600 text-white">
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                          <BookOpen className="h-6 w-6" />
                          FarmIQ Complete User Guide
                        </DialogTitle>
                      </DialogHeader>

                      <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Introduction */}
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                          <h2 className="text-xl font-bold text-green-800 mb-3">Welcome to FarmIQ</h2>
                          <p className="text-green-700 leading-relaxed">
                            This guide helps you understand how to use each feature of the platform to manage your farm efficiently and confidently. FarmIQ is designed to be simple, farmer-friendly, and focused on improving your productivity.
                          </p>
                        </div>

                        {/* Features Grid */}
                        <div className="space-y-8">
                          {/* Home Dashboard */}
                          <section className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Sun className="h-5 w-5" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">🏠 Home – Smart Farming Dashboard</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <Card className="border-none bg-gray-50">
                                <CardContent className="p-4">
                                  <h4 className="font-bold text-blue-700 mb-2 underline decoration-blue-200 underline-offset-4">What you can see</h4>
                                  <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex gap-2"><span>•</span> Live weather conditions (temp, humidity, alerts)</li>
                                    <li className="flex gap-2"><span>•</span> Crop profit prediction for the season</li>
                                    <li className="flex gap-2"><span>•</span> Current market price trends</li>
                                    <li className="flex gap-2"><span>•</span> Active government subsidy information</li>
                                  </ul>
                                </CardContent>
                              </Card>
                              <Card className="border-none bg-blue-50/50">
                                <CardContent className="p-4">
                                  <h4 className="font-bold text-blue-700 mb-2 underline decoration-blue-200 underline-offset-4">Benefit to you</h4>
                                  <p className="text-sm text-gray-700">Saves time and helps in daily decision-making by providing a quick overview of your farm's status.</p>
                                </CardContent>
                              </Card>
                            </div>
                          </section>

                          {/* Profit Predictor */}
                          <section className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <TrendingUp className="h-5 w-5" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">📈 Crop Profit Predictor (AI)</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <p className="text-sm text-gray-600 italic">Predicts expected profit or loss using advanced AI analysis of crop type, season, market prices, and weather.</p>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                  <h4 className="text-sm font-bold text-gray-900 mb-2">How to use:</h4>
                                  <ol className="text-sm text-gray-600 space-y-1 list-decimal ml-4">
                                    <li>Open Crop Profit Predictor</li>
                                    <li>Select your crop and season</li>
                                    <li>View estimated profit vs last season</li>
                                  </ol>
                                </div>
                              </div>
                              <div className="bg-green-50/50 p-4 rounded-xl flex items-center">
                                <div>
                                  <h4 className="font-bold text-green-700 mb-1">Impact:</h4>
                                  <p className="text-sm text-gray-700">Helps plan expenses and avoids risky crop choices through AI-driven income planning.</p>
                                </div>
                              </div>
                            </div>
                          </section>

                          {/* Weather & Alerts */}
                          <section className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                <AlertTriangle className="h-5 w-5" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">🌦️ Weather & Alerts (Live)</h3>
                            </div>
                            <div className="bg-yellow-50/30 border border-yellow-100 p-5 rounded-2xl">
                              <p className="text-sm text-gray-700 mb-3">Real-time updates to protect your crops from rain, heat, or storms.</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {['Temperature', 'Conditions', 'Humidity', 'Active Alerts'].map((item) => (
                                  <div key={item} className="bg-white p-2 rounded-lg text-center text-xs font-semibold text-yellow-700 shadow-sm">{item}</div>
                                ))}
                              </div>
                              <p className="text-sm text-gray-600 mt-4 leading-relaxed font-medium">✨ Use alerts to plan irrigation and spraying schedules effectively.</p>
                            </div>
                          </section>

                          {/* Government Schemes */}
                          <section className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Shield className="h-5 w-5" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">🏛️ Government Schemes</h3>
                            </div>
                            <div className="p-4 bg-purple-50/30 rounded-xl">
                              <p className="text-sm text-gray-700">Access active schemes like PM-KISAN. Check eligibility and status directly to ensure you never miss available benefits or subsidies.</p>
                            </div>
                          </section>

                          {/* Marketplace */}
                          <section className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <Search className="h-5 w-5" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">🛒 Marketplace</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-900">What you can do:</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  <li>• Sell crops directly to buyers</li>
                                  <li>• Buy seeds & fertilizers locally</li>
                                  <li>• Track transparent market prices</li>
                                </ul>
                              </div>
                              <div className="bg-orange-50/50 p-4 rounded-xl">
                                <h4 className="text-sm font-bold text-orange-700 mb-1">Your Benefit:</h4>
                                <p className="text-sm text-gray-700">Fair pricing by reducing middlemen and making better selling decisions.</p>
                              </div>
                            </div>
                          </section>

                          {/* Disease Detection */}
                          <section className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <Leaf className="h-5 w-5" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">🌿 Crop Disease Detection (AI)</h3>
                            </div>
                            <div className="flex flex-col md:flex-row gap-6 p-4 border rounded-2xl bg-red-50/20">
                              <div className="flex-1 space-y-2">
                                <p className="text-sm text-gray-700">Early detection via AI image analysis. Just upload or capture a crop leaf image to get instant diagnosis and solution suggestions.</p>
                              </div>
                              <div className="flex-1">
                                <div className="bg-white p-3 rounded-xl shadow-sm border border-red-100 text-sm">
                                  <p className="font-bold text-red-600 mb-1">Key Value:</p>
                                  <p className="text-gray-600 italic">Reduces crop loss through timely and proper treatment guidance.</p>
                                </div>
                              </div>
                            </div>
                          </section>

                          {/* Equipment Rentals */}
                          <section className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-cyan-100 rounded-lg text-cyan-600">
                                <Plus className="h-5 w-5" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">🚜 Equipment Rentals</h3>
                            </div>
                            <div className="p-5 bg-cyan-50/30 rounded-2xl border border-cyan-100">
                              <p className="text-sm text-gray-700 mb-4 font-medium italic">Rent modern agricultural equipment easily from nearby providers.</p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-white rounded-lg shadow-sm">Select Equipment</div>
                                <div className="p-3 bg-white rounded-lg shadow-sm">Choose Optional Services</div>
                                <div className="p-3 bg-white rounded-lg shadow-sm">Confirm Booking</div>
                              </div>
                              <p className="text-sm text-gray-600 mt-4 underline underline-offset-4 decoration-cyan-200">Lower your farming costs with modern equipment without the high purchase price.</p>
                            </div>
                          </section>
                        </div>

                        {/* Summary Footer */}
                        <div className="pt-8 border-t">
                          <div className="bg-green-600 text-white p-6 rounded-2xl shadow-xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                              <Shield className="h-5 w-5" />
                              Final Summary
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4 text-sm font-medium opacity-90">
                              <p>✓ Simple & Farmer-friendly</p>
                              <p>✓ Reduces Farming Risks</p>
                              <p>✓ Improves Income Planning</p>
                              <p>✓ Accessible 24/7 Support</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Community Forum</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Connect with other farmers and share experiences</p>
                  <Dialog open={isForumOpen} onOpenChange={setIsForumOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        Join Forum
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col p-0">
                      <DialogHeader className="p-4 border-b bg-green-600 text-white">
                        <DialogTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          FarmIQ Community Forum
                        </DialogTitle>
                      </DialogHeader>

                      <div className="flex-1 overflow-y-auto p-4">
                        {!isRegistered ? (
                          <div className="space-y-6 py-4">
                            <div className="text-center">
                              <h3 className="text-lg font-bold text-gray-900">Register for Communities</h3>
                              <p className="text-sm text-gray-600">Join our growing network of expert farmers</p>
                            </div>
                            <form onSubmit={handleRegister} className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                  placeholder="Enter your name"
                                  value={regData.name}
                                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Mobile Number</label>
                                <Input
                                  placeholder="Enter your mobile number"
                                  value={regData.mobile}
                                  onChange={(e) => setRegData({ ...regData, mobile: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Key Expertise</label>
                                <Input
                                  placeholder="e.g., Organic Farming, Irrigation"
                                  value={regData.expertise}
                                  onChange={(e) => setRegData({ ...regData, expertise: e.target.value })}
                                  required
                                />
                              </div>
                              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                                Complete Registration
                              </Button>
                            </form>
                          </div>
                        ) : !selectedCommunity ? (
                          <div className="space-y-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                className="pl-10"
                                placeholder="Search communities (Local, Specialty...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                            </div>
                            <div className="grid gap-3">
                              {filteredCommunities.map(community => (
                                <Card key={community.id} className="cursor-pointer hover:border-green-600 transition-colors" onClick={() => setSelectedCommunity(community)}>
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-bold text-green-700">{community.name}</h4>
                                      <Badge variant="secondary">{community.type}</Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">{community.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                      <Users className="h-3 w-3" />
                                      {community.members.toLocaleString()} members
                                      <Plus className="h-3 w-3 ml-auto text-green-600" />
                                      <span className="text-green-600">View & Join</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col h-[500px]">
                            <div className="flex items-center gap-3 pb-3 border-b mb-4">
                              <Button variant="ghost" size="icon" onClick={() => setSelectedCommunity(null)}>
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                              <div>
                                <h3 className="font-bold text-gray-900">{selectedCommunity.name}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Active Now</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                              {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                  <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
                                  <p className="text-sm font-medium">Welcome to {selectedCommunity.name}!</p>
                                  <p className="text-xs">Start a conversation with your fellow farmers.</p>
                                </div>
                              ) : (
                                messages.map(msg => (
                                  <div key={msg.id} className={`flex flex-col ${msg.sender === regData.name ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-3 ${msg.sender === regData.name ? 'bg-green-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                                      <p className="text-xs font-bold mb-1 opacity-80">{msg.sender}</p>
                                      <p className="text-sm">{msg.text}</p>
                                      <p className="text-[10px] mt-1 text-right opacity-70">{msg.time}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t">
                              <Input
                                placeholder="Type your message..."
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                              />
                              <Button type="submit" size="icon" className="bg-green-600 hover:bg-green-700 shrink-0">
                                <Send className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-sm text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <Input
                        value={contactForm.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <Input
                      value={contactForm.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      placeholder="What can we help you with?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <Textarea
                      value={contactForm.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Please describe your question or issue in detail..."
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agriculture Categories */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" />
                  Agriculture Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {agricultureCategories.map((category, index) => (
                    <div key={index} className={`p-3 rounded-xl ${category.color} hover:shadow-md transition-all duration-200 cursor-pointer`}>
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-white/50 rounded-lg">
                          {category.icon}
                        </div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Emergency Helpline</p>
                    <p className="text-sm text-blue-700">1800-FARM-HELP</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Email Support</p>
                    <p className="text-sm text-green-700">help@farmiq.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-orange-900">Office Hours</p>
                    <p className="text-sm text-orange-700">Mon-Fri: 9AM-6PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-yellow-50">
              <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-green-600 rounded-lg">
                      <Leaf className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Soil Testing</p>
                      <p className="text-xs text-green-700 mt-1">Test your soil every 2-3 years for optimal crop yields</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-600 rounded-lg">
                      <Sun className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Weather Monitoring</p>
                      <p className="text-xs text-blue-700 mt-1">Check weather forecasts daily for better planning</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-orange-600 rounded-lg">
                      <Wheat className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-800">Crop Rotation</p>
                      <p className="text-xs text-orange-700 mt-1">Rotate crops to maintain soil fertility</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-800">Your Data is Secure</p>
                    <p className="text-xs text-green-700">We use enterprise-grade encryption to protect your information</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>Last updated: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;