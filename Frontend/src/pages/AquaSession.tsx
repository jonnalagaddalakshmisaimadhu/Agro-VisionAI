
import { useState, useEffect, useRef } from "react";
import { AquaFarmersView } from "@/components/modules/aqua/AquaFarmersView";
import { AquaMarketplaceView } from "@/components/modules/aqua/AquaMarketplaceView";
import { AquaMarketBuyersView } from "@/components/modules/aqua/AquaMarketBuyersView";
import { AquaToolsView } from "@/components/modules/aqua/AquaToolsView";
import { AquaExpertsView } from "@/components/modules/aqua/AquaExpertsView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplets, Fish, ArrowLeft, Activity, Thermometer, Info, ChevronRight, Play, LineChart as LineChartIcon, ShieldCheck, ShoppingBag, Users, Sprout, Home, BookOpen, Calculator, Leaf, MessageCircle, Wrench, DollarSign, Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

// --- Mock Data for Charts ---
const mockChartData = {
    1: [
        { time: '06:00', ph: 7.6, do: 5.8 },
        { time: '09:00', ph: 7.7, do: 6.0 },
        { time: '12:00', ph: 7.9, do: 6.5 },
        { time: '15:00', ph: 7.8, do: 6.3 },
        { time: '18:00', ph: 7.6, do: 5.9 },
    ],
    2: [
        { time: '06:00', ph: 6.2, do: 3.8 },
        { time: '09:00', ph: 6.4, do: 4.0 },
        { time: '12:00', ph: 6.6, do: 4.2 },
        { time: '15:00', ph: 6.5, do: 4.1 },
        { time: '18:00', ph: 6.3, do: 3.9 },
    ],
    3: [
        { time: '06:00', ph: 8.5, do: 3.2 },
        { time: '09:00', ph: 8.7, do: 3.4 },
        { time: '12:00', ph: 9.0, do: 3.6 },
        { time: '15:00', ph: 8.8, do: 3.5 },
        { time: '18:00', ph: 8.6, do: 3.3 },
    ],
    4: [
        { time: '06:00', ph: 7.8, do: 5.9 },
        { time: '09:00', ph: 7.9, do: 6.1 },
        { time: '12:00', ph: 8.0, do: 6.2 },
        { time: '15:00', ph: 7.9, do: 6.0 },
        { time: '18:00', ph: 7.8, do: 5.8 },
    ],
    5: []
};

// --- Types & Constants ---

interface AquaProfile {
    pondCount: string;
    primarySpecies: string;
    waterSource: string;
    farmingType: string;
}

const AQUA_MENU_ITEMS = [
    {
        title: "Home",
        items: []
    },
    {
        title: "For Farmers",
        items: []
    },
    {
        title: "Knowledge Hub",
        items: ["Fish Farming Guides", "Shrimp Farming Guides", "Species Library", "Disease Library", "Best Practices", "Video Tutorials", "Seasonal Calendar"]
    },
    {
        title: "Marketplace",
        items: []
    },
    {
        title: "Experts",
        items: []
    },
    {
        title: "Market & Buyers",
        items: []
    },
    {
        title: "Tools",
        items: []
    },
    {
        title: "Sustainability",
        items: ["Water Usage Tracking", "Feed Efficiency", "Eco Practices", "Certification / Compliance"]
    },
    {
        title: "Community",
        items: ["Farmer Forum", "Success Stories", "Events & Training", "Announcements"]
    }
];

const HERO_VIDEOS = [
    "/videos/aquaculture/Indian_Aquaculture_Slow_Motion_Video.mp4",
    "/videos/aquaculture/Village_Aquaculture_Video_Generation.mp4",
    "/videos/aquaculture/20251220_1320_New Video_simple_compose_01kcxbs3y8fqks1fpdgwvxn0dy.mp4",
    "/videos/aquaculture/20251220_1324_New Video_simple_compose_01kcxc0heef4eayk6mt1qe75wz.mp4",
    "/videos/aquaculture/20251220_1324_New Video_simple_compose_01kcxc0hgnfx49bmnt62nnb4sv.mp4",
    "/videos/aquaculture/20251220_1326_New Video_simple_compose_01kcxc43wsezxthv9r90fn9maf.mp4",
];

// --- Components ---

const AquaSidebar = ({
    isCollapsed,
    onToggle,
    activeSection,
    setActiveSection
}: {
    isCollapsed: boolean;
    onToggle: () => void;
    activeSection: string;
    setActiveSection: (section: string) => void;
}) => {
    const [expandedSections, setExpandedSections] = useState<string[]>([]);

    const toggleSection = (section: string) => {
        if (isCollapsed) return;
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const getIcon = (title: string) => {
        switch (title) {
            case "Home": return <Home className="h-5 w-5" />;
            case "For Farmers": return <Sprout className="h-5 w-5" />;
            case "Knowledge Hub": return <BookOpen className="h-5 w-5" />;
            case "Marketplace": return <ShoppingBag className="h-5 w-5" />;
            case "Experts": return <Users className="h-5 w-5" />;
            case "Market & Buyers": return <DollarSign className="h-5 w-5" />;
            case "Tools": return <Wrench className="h-5 w-5" />;
            case "Sustainability": return <Leaf className="h-5 w-5" />;
            case "Community": return <MessageCircle className="h-5 w-5" />;
            default: return <Fish className="h-5 w-5" />;
        }
    };

    return (
        <aside className={cn(
            "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg z-40 transition-all duration-300 overflow-y-auto border-r border-slate-200",
            isCollapsed ? "w-16" : "w-64"
        )}>
            {/* Toggle Button for Mobile/Desktop */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                {!isCollapsed && <span className="font-bold text-slate-800">Menu</span>}
                <Button variant="ghost" size="sm" onClick={onToggle} className="ml-auto">
                    {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Button>
            </div>

            <nav className="p-2 space-y-1">
                {AQUA_MENU_ITEMS.map((section) => (
                    <div key={section.title}>
                        <Button
                            variant={activeSection === section.title ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start mb-1",
                                isCollapsed ? "px-2 justify-center" : "px-3 justify-between"
                            )}
                            onClick={() => {
                                setActiveSection(section.title);
                                toggleSection(section.title);
                            }}
                        >
                            <div className="flex items-center">
                                {getIcon(section.title)}
                                {!isCollapsed && <span className="ml-3">{section.title}</span>}
                            </div>
                            {!isCollapsed && section.items.length > 0 && (
                                expandedSections.includes(section.title) ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />
                            )}
                        </Button>

                        {!isCollapsed && expandedSections.includes(section.title) && (
                            <div className="ml-9 border-l-2 border-slate-100 pl-2 space-y-1 my-1 animate-in slide-in-from-top-2 duration-200">
                                {section.items.map((item) => (
                                    <Button
                                        key={item}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-xs text-slate-500 h-8 hover:text-blue-600 block truncate text-left"
                                    >
                                        {item}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
};

const AquaLandingPage = ({ onStart }: { onStart: () => void }) => {
    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden">
            {/* Hero Section with Carousel */}
            <section className="relative h-[85vh] w-full overflow-hidden bg-slate-900">
                <Carousel
                    plugins={[
                        Autoplay({
                            delay: 6000,
                        }) as any,
                    ]}
                    className="w-full h-full"
                >
                    <CarouselContent className="h-[85vh] ml-0">
                        {HERO_VIDEOS.map((videoSrc, index) => (
                            <CarouselItem key={index} className="pl-0 h-full relative">
                                <div className="absolute inset-0 bg-black/40 z-10" />
                                <video
                                    src={videoSrc}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                                    <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-blue-200 drop-shadow-lg mb-6 tracking-tight">
                                        Aquaculture Go!
                                    </h1>
                                    <p className="text-xl md:text-2xl text-blue-100 max-w-2xl font-light mb-10 leading-relaxed drop-shadow-md">
                                        The future of smart fish farming. Monitor, analyze, and optimize your yield with AI-driven insights.
                                    </p>
                                    <Button
                                        size="lg"
                                        onClick={onStart}
                                        className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold text-lg px-8 py-6 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        Get Started Now <ChevronRight className="ml-2 w-6 h-6" />
                                    </Button>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                </Carousel>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
                    <div className="w-8 h-12 border-2 border-white/30 rounded-full flex justify-center p-2 backdrop-blur-sm">
                        <div className="w-1 h-3 bg-white/80 rounded-full animate-scroll-down"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gradient-to-b from-slate-50 to-blue-50/50 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 -left-20 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-20">
                        <span className="text-blue-600 font-semibold tracking-wider text-sm uppercase bg-blue-100 px-3 py-1 rounded-full">Why Choose Us</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4 mb-6">Revolutionary Features</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                            We provide a comprehensive ecosystem for modern aquaculture, combining IoT, AI, and expert knowledge to maximize your success.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Activity className="w-8 h-8 text-white" />}
                            title="Real-Time Monitoring"
                            description="Track pH, temperature, and dissolved oxygen levels in real-time with connected IoT sensors. Get instant alerts straight to your phone."
                            color="bg-blue-500"
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="w-8 h-8 text-white" />}
                            title="AI Disease Detection"
                            description="Early detection saves crops. Upload photos of your fish or shrimp, and our AI scans for symptoms of common diseases instantly."
                            color="bg-emerald-500"
                        />
                        <FeatureCard
                            icon={<Sprout className="w-8 h-8 text-white" />}
                            title="Smart Feed Management"
                            description="Optimize Feed Conversion Ratio (FCR). Get AI-recommended feeding schedules based on biomass and water conditions."
                            color="bg-amber-500"
                        />
                        <FeatureCard
                            icon={<LineChartIcon className="w-8 h-8 text-white" />}
                            title="Profit & Growth Analytics"
                            description="Visualize your farm's performance. Forecast growth, estimate harvest dates, and calculate projected profits."
                            color="bg-indigo-500"
                        />
                        <FeatureCard
                            icon={<ShoppingBag className="w-8 h-8 text-white" />}
                            title="Integrated Marketplace"
                            description="Access a trusted network of suppliers for quality seed, feed, and equipment. Sell your harvest directly to verified buyers."
                            color="bg-rose-500"
                        />
                        <FeatureCard
                            icon={<Users className="w-8 h-8 text-white" />}
                            title="Expert Consultation"
                            description="Stuck? Connect with aquaculture experts for one-on-one video consultations or chat support anytime."
                            color="bg-cyan-500"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-900 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544551763-46a4270d7eb2?q=80&w=2669&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <h2 className="text-4xl font-bold mb-6">Enroll for AquaSession</h2>
                    <p className="text-blue-200 text-xl max-w-2xl mx-auto mb-10">
                        Join thousands of smart farmers using AquaSession to increase yields and sustainability.
                    </p>
                    <Button
                        size="lg"
                        onClick={onStart}
                        variant="secondary"
                        className="text-blue-900 font-bold px-10 py-6 text-lg rounded-full hover:bg-white hover:scale-105 transition-transform"
                    >
                        Launch AquaSession
                    </Button>
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) => (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-md transition-transform group-hover:scale-110", color)}>
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-500 leading-relaxed">
            {description}
        </p>
    </div>
);


const AquaSession = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isRegistered, setIsRegistered] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showLanding, setShowLanding] = useState(true);
    const [selectedPond, setSelectedPond] = useState<number | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeSection, setActiveSection] = useState("Home");

    // Initialize sidebar based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarCollapsed(true);
            } else {
                setSidebarCollapsed(false);
            }
        };

        handleResize(); // Set initial state
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Registration Form State
    const [formData, setFormData] = useState<AquaProfile>({
        pondCount: "",
        primarySpecies: "",
        waterSource: "",
        farmingType: ""
    });

    useEffect(() => {
        // Check local storage for aqua registration
        const storedRegistration = localStorage.getItem("aqua_registration");
        if (storedRegistration) {
            setIsRegistered(true);
        }
        setLoading(false);
    }, []);

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.pondCount || !formData.primarySpecies) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Save to local storage (mock backend)
        localStorage.setItem("aqua_registration", JSON.stringify(formData));
        setIsRegistered(true);
        toast.success("Welcome to AquaSession!");
    };

    const handleInputChange = (field: keyof AquaProfile, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // If user is just loading, show spinner
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-50/50">Loading...</div>;

    // Show Landing Page first
    if (showLanding) {
        return <AquaLandingPage onStart={() => setShowLanding(false)} />;
    }

    // If not registered, show form
    if (!isRegistered) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setShowLanding(true)}>
                            <Fish className="h-6 w-6 text-blue-600" />
                            <span className="font-bold text-lg text-slate-800">AquaSession</span>
                        </div>
                        <Button variant="ghost" onClick={() => navigate('/')}>Back to Main</Button>
                    </div>
                </header>
                <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-cyan-100">
                    <Card className="w-full max-w-lg shadow-2xl border-none">
                        <CardHeader className="text-center space-y-4 pb-8">
                            <div className="mx-auto bg-gradient-to-tr from-blue-500 to-cyan-400 p-4 rounded-full w-fit shadow-lg">
                                <Fish className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-bold text-slate-900">Setup Your Profile</CardTitle>
                                <CardDescription className="text-lg mt-2">
                                    Tell us about your farm to unlock personalized insights.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleRegister} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="pondCount" className="text-slate-700">Number of Lands / Ponds</Label>
                                    <Input
                                        id="pondCount"
                                        type="number"
                                        placeholder="e.g. 5"
                                        value={formData.pondCount}
                                        onChange={(e) => handleInputChange("pondCount", e.target.value)}
                                        className="h-11 border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="species" className="text-slate-700">Primary Species</Label>
                                    <Select onValueChange={(val) => handleInputChange("primarySpecies", val)}>
                                        <SelectTrigger id="species" className="h-11 border-slate-200">
                                            <SelectValue placeholder="Select Species" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="shrimp">Shrimp (Vannamei)</SelectItem>
                                            <SelectItem value="tilapia">Tilapia</SelectItem>
                                            <SelectItem value="carp">Carp (Rohu/Catla)</SelectItem>
                                            <SelectItem value="pangas">Pangasius</SelectItem>
                                            <SelectItem value="catfish">Catfish</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="waterSource" className="text-slate-700">Water Source</Label>
                                    <Select onValueChange={(val) => handleInputChange("waterSource", val)}>
                                        <SelectTrigger id="water" className="h-11 border-slate-200">
                                            <SelectValue placeholder="Select Source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="river">River/Canal</SelectItem>
                                            <SelectItem value="groundwater">Groundwater/Borewell</SelectItem>
                                            <SelectItem value="rain">Rainwater Harvesting</SelectItem>
                                            <SelectItem value="sea">Seawater</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type" className="text-slate-700">Farming Type</Label>
                                    <Select onValueChange={(val) => handleInputChange("farmingType", val)}>
                                        <SelectTrigger id="type" className="h-11 border-slate-200">
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="extensive">Extensive</SelectItem>
                                            <SelectItem value="semi-intensive">Semi-intensive</SelectItem>
                                            <SelectItem value="intensive">Intensive (Biofloc/RAS)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={() => setShowLanding(true)} className="text-slate-500">Back</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 px-8 h-11 text-lg w-full ml-4" onClick={handleRegister}>
                                Get Started
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    // AQUA SESSION DASHBOARD (Registered)
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-50 flex items-center h-16 transition-all duration-200 justify-between px-4">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setShowLanding(true)}>
                    <Fish className="h-8 w-8 text-cyan-400" />
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">AquaSession</h1>
                        <p className="text-xs text-blue-200">Smart Aquaculture Management</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium">{user?.username || "Farmer"}</p>
                        <p className="text-xs text-blue-300">Pro Plan</p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-blue-800 text-blue-100 hover:bg-blue-700 border border-blue-700"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Exit Session
                    </Button>
                </div>
            </header>

            {/* Layout Container */}
            <div className="flex relative">
                <AquaSidebar
                    isCollapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                />

                {/* Main Content */}
                <main className={cn(
                    "flex-1 p-4 md:p-8 space-y-8 transition-all duration-300",
                    sidebarCollapsed ? "ml-16" : "ml-64"
                )}>

                    {activeSection === "For Farmers" ? (
                        <AquaFarmersView />
                    ) : activeSection === "Marketplace" ? (
                        <AquaMarketplaceView />
                    ) : activeSection === "Market & Buyers" ? (
                        <AquaMarketBuyersView />
                    ) : activeSection === "Tools" ? (
                        <AquaToolsView />
                    ) : activeSection === "Experts" ? (
                        <AquaExpertsView />
                    ) : (
                        // Default Dashboard View (Home)
                        <>
                            {/* At a Glance */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6 flex items-center space-x-4">
                                        <div className="p-3 bg-cyan-100 rounded-full text-cyan-700">
                                            <Droplets className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Avg. pH Level</p>
                                            <h3 className="text-2xl font-bold">7.8</h3>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6 flex items-center space-x-4">
                                        <div className="p-3 bg-blue-100 rounded-full text-blue-700">
                                            <Thermometer className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Water Temp</p>
                                            <h3 className="text-2xl font-bold">28°C</h3>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6 flex items-center space-x-4">
                                        <div className="p-3 bg-emerald-100 rounded-full text-emerald-700">
                                            <Activity className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Dissolved Oxygen</p>
                                            <h3 className="text-2xl font-bold">5.2 <span className="text-sm font-normal text-slate-400">mg/L</span></h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Expanded Active Ponds Analysis */}
                            <Card className="border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
                                <CardHeader className="border-b border-white/10 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                <Activity className="text-cyan-400 h-5 w-5" />
                                                Live Pond Monitoring
                                            </CardTitle>
                                            <CardDescription className="text-slate-400">Real-time condition analysis for 5 active units</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-cyan-300 hover:bg-white/10 hover:text-cyan-200">
                                            View Full Report
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                        {[
                                            { id: 1, status: "Optimal", ph: "7.8", temp: "28°C", do: "6.2", species: "Shrimp", color: "bg-emerald-500" },
                                            { id: 2, status: "Warning", ph: "6.5", temp: "29°C", do: "4.1", species: "Tilapia", color: "bg-amber-500" },
                                            { id: 3, status: "Critical", ph: "8.9", temp: "32°C", do: "3.5", species: "Shrimp", color: "bg-red-500" },
                                            { id: 4, status: "Optimal", ph: "7.9", temp: "27°C", do: "6.0", species: "Carp", color: "bg-emerald-500" },
                                            { id: 5, status: "Maintenance", ph: "-", temp: "-", do: "-", species: "-", color: "bg-slate-500" },
                                        ].map((pond) => (
                                            <div
                                                key={pond.id}
                                                onClick={() => setSelectedPond(pond.id)}
                                                className={`bg-white/5 rounded-xl p-4 border transition-all duration-200 relative group cursor-pointer ${selectedPond === pond.id
                                                    ? 'border-cyan-400/50 bg-white/10 ring-2 ring-cyan-400/20'
                                                    : 'border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className={`absolute top-0 left-0 w-full h-1 ${pond.color} rounded-t-xl`} />
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="p-2 rounded-lg bg-white/5">
                                                        <Fish className={`h-5 w-5 ${pond.status === 'Critical' ? 'text-red-400' :
                                                            pond.status === 'Warning' ? 'text-amber-400' :
                                                                pond.status === 'Maintenance' ? 'text-slate-400' : 'text-emerald-400'
                                                            }`} />
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-full border ${pond.status === 'Critical' ? 'border-red-500/30 text-red-300 bg-red-500/10' :
                                                        pond.status === 'Warning' ? 'border-amber-500/30 text-amber-300 bg-amber-500/10' :
                                                            pond.status === 'Maintenance' ? 'border-slate-500/30 text-slate-300 bg-slate-500/10' :
                                                                'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
                                                        }`}>
                                                        {pond.status}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-lg mb-1">Pond {pond.id}</h4>
                                                <p className="text-xs text-slate-400 mb-4">{pond.species}</p>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                                        <span className="text-slate-400">pH</span>
                                                        <span className="font-mono">{pond.ph}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                                        <span className="text-slate-400">Temp</span>
                                                        <span className="font-mono">{pond.temp}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">DO</span>
                                                        <span className="font-mono">{pond.do}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Dashboard Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                {/* Main Chart Area */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="border-none shadow-md">
                                        <CardHeader>
                                            <CardTitle>Water Quality Trends {selectedPond ? `- Pond ${selectedPond}` : "(General)"}</CardTitle>
                                            <CardDescription>
                                                {selectedPond
                                                    ? `Real-time monitoring for Pond ${selectedPond}`
                                                    : "Select a pond above to view detailed analysis"
                                                }
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="h-80 bg-white rounded-lg m-6 p-4">
                                            {selectedPond ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={mockChartData[selectedPond as keyof typeof mockChartData] || []}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                            }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="ph"
                                                            stroke="#0ea5e9"
                                                            strokeWidth={3}
                                                            dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="do"
                                                            stroke="#10b981"
                                                            strokeWidth={3}
                                                            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                                                    <Activity className="h-12 w-12 mb-4 text-slate-300" />
                                                    <p className="font-medium">Select a pond above to start analysis</p>
                                                    <p className="text-sm">Click on any pond card in the Live Monitoring section</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card className="border-none shadow-md bg-orange-50 border-l-4 border-orange-500">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center space-x-2 text-orange-700">
                                                    <Info className="h-5 w-5" />
                                                    <CardTitle className="text-lg">Feed Alert</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-orange-800">Pond #2 requires feeding in 45 minutes. Recommended: High-protein pellets.</p>
                                                <Button size="sm" variant="outline" className="mt-4 border-orange-200 text-orange-700 hover:bg-orange-100">Schedule Now</Button>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-none shadow-md bg-blue-50 border-l-4 border-blue-500">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center space-x-2 text-blue-700">
                                                    <Droplets className="h-5 w-5" />
                                                </div>
                                                <CardTitle className="text-lg text-blue-700">Maintenance</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-blue-800">Aerator check scheduled for tomorrow at 10:00 AM.</p>
                                                <Button size="sm" variant="outline" className="mt-4 border-blue-200 text-blue-700 hover:bg-blue-100">View Details</Button>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                {/* Sidebar / Actions */}
                                <div className="space-y-6">
                                    <Card className="border-none shadow-md">
                                        <CardHeader>
                                            <CardTitle>Quick Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button className="w-full justify-start text-left bg-blue-100 text-blue-800 hover:bg-blue-200 py-6" variant="ghost">
                                                <span className="mr-3 text-xl">📝</span>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-semibold">Log Parameters</span>
                                                    <span className="text-xs text-blue-600">Daily water quality record</span>
                                                </div>
                                            </Button>
                                            <Button className="w-full justify-start text-left bg-slate-100 text-slate-800 hover:bg-slate-200 py-6" variant="ghost">
                                                <span className="mr-3 text-xl">🍞</span>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-semibold">Record Feeding</span>
                                                    <span className="text-xs text-slate-500">Track feed consumption</span>
                                                </div>
                                            </Button>
                                            <Button className="w-full justify-start text-left bg-slate-100 text-slate-800 hover:bg-slate-200 py-6" variant="ghost">
                                                <span className="mr-3 text-xl">⚖️</span>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-semibold">Update Biomass</span>
                                                    <span className="text-xs text-slate-500">Adjust active stock</span>
                                                </div>
                                            </Button>
                                            <Button className="w-full justify-start text-left bg-slate-100 text-slate-800 hover:bg-slate-200 py-6" variant="ghost">
                                                <span className="mr-3 text-xl">🦠</span>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-semibold">Disease Check (AI)</span>
                                                    <span className="text-xs text-slate-500">Analyze symptoms</span>
                                                </div>
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-md">
                                        <CardHeader>
                                            <CardTitle>Recent Activity</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-4 text-sm">
                                                <li className="flex items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-3 flex-shrink-0"></span>
                                                    <div>
                                                        <p className="font-medium text-slate-700">Water exchange completed</p>
                                                        <p className="text-xs text-slate-500">Pond #1 • 2 hours ago</p>
                                                    </div>
                                                </li>
                                                <li className="flex items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-3 flex-shrink-0"></span>
                                                    <div>
                                                        <p className="font-medium text-slate-700">Sensor calibration</p>
                                                        <p className="text-xs text-slate-500">System • 5 hours ago</p>
                                                    </div>
                                                </li>
                                                <li className="flex items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                                    <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 mr-3 flex-shrink-0"></span>
                                                    <div>
                                                        <p className="font-medium text-slate-700">Low Oxygen Warning Resolved</p>
                                                        <p className="text-xs text-slate-500">Pond #3 • Yesterday</p>
                                                    </div>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>

                            </div>
                        </>
                    )}

                </main >
            </div>
        </div >
    );
};

export default AquaSession;
