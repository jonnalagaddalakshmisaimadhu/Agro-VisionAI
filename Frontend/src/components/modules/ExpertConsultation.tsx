import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Stethoscope, 
  Phone, 
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Lock,
  MessageCircle, 
  Clock, 
  Star,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  BarChart3,
  Calendar,
  MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Expert {
  id: number;
  name: string;
  specialization: string;
  experience: string;
  rating: number;
  availability: string;
  location: string;
  consultationFee: number;
  languages: string[];
  image: string;
}

interface LowAccuracyCase {
  id: number;
  plantType: string;
  confidence: number;
  symptoms: string[];
  imageUrl: string;
  timestamp: string;
  status: 'pending' | 'consulted' | 'resolved';
  expertId?: number;
  expertName?: string;
  recommendations?: string[];
}

const ExpertConsultation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("experts");
  const [lowAccuracyCases, setLowAccuracyCases] = useState<LowAccuracyCase[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

  // Instagram-style In-App WebRTC Calling State
  const [isCallingModalOpen, setIsCallingModalOpen] = useState(false);
  const [callingExpert, setCallingExpert] = useState<Expert | null>(null);
  const [callStatus, setCallStatus] = useState<"ringing" | "connected" | "ended">("ringing");
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const ringToneOscillatorRef = useRef<any>(null);

  // Timer for active call duration
  useEffect(() => {
    let timer: any = null;
    if (isCallingModalOpen && callStatus === "connected") {
      timer = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCallingModalOpen, callStatus]);

  const startRingtone = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      ringToneOscillatorRef.current = { ctx, osc, gain };
    } catch (e) {}
  };

  const stopRingtone = () => {
    if (ringToneOscillatorRef.current) {
      try {
        ringToneOscillatorRef.current.osc.stop();
        ringToneOscillatorRef.current.ctx.close();
      } catch (e) {}
      ringToneOscillatorRef.current = null;
    }
  };

  const handleConsultExpert = (expert: Expert) => {
    setCallingExpert(expert);
    setCallStatus("ringing");
    setCallSeconds(0);
    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsCallingModalOpen(true);
    startRingtone();

    setTimeout(() => {
      stopRingtone();
      setCallStatus("connected");
    }, 2200);
  };

  const endCall = () => {
    stopRingtone();
    setCallStatus("ended");
    setTimeout(() => {
      setIsCallingModalOpen(false);
    }, 600);
  };

  const formatCallDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // Mock data for experts
  const experts: Expert[] = [
    {
      id: 1,
      name: "Dr. Raj Kumar",
      specialization: "Plant Pathologist",
      experience: "20+ years",
      rating: 4.9,
      availability: "Available Now",
      location: "Delhi, India",
      consultationFee: 500,
      languages: ["English", "Hindi", "Punjabi"],
      image: "👨‍⚕️"
    },
    {
      id: 2,
      name: "Dr. Priya Sharma",
      specialization: "Crop Protection Specialist",
      experience: "15+ years",
      rating: 4.8,
      availability: "Available in 2 hours",
      location: "Mumbai, India",
      consultationFee: 400,
      languages: ["English", "Hindi", "Marathi"],
      image: "👩‍⚕️"
    },
    {
      id: 3,
      name: "Dr. Amit Singh",
      specialization: "Agricultural Entomologist",
      experience: "12+ years",
      rating: 4.7,
      availability: "Available Tomorrow",
      location: "Pune, India",
      consultationFee: 350,
      languages: ["English", "Hindi", "Gujarati"],
      image: "👨‍🔬"
    },
    {
      id: 4,
      name: "Dr. Sunita Patel",
      specialization: "Plant Disease Specialist",
      experience: "18+ years",
      rating: 4.9,
      availability: "Available Now",
      location: "Ahmedabad, India",
      consultationFee: 450,
      languages: ["English", "Hindi", "Gujarati"],
      image: "👩‍🔬"
    }
  ];

  // Mock data for low accuracy cases
  useEffect(() => {
    const mockCases: LowAccuracyCase[] = [
      {
        id: 1,
        plantType: "Tomato Plant",
        confidence: 65,
        symptoms: ["Yellow spots on leaves", "Wilting", "Brown patches"],
        imageUrl: "/api/placeholder/300/200",
        timestamp: "2024-01-15 10:30 AM",
        status: 'pending'
      },
      {
        id: 2,
        plantType: "Rice Plant",
        confidence: 58,
        symptoms: ["White streaks", "Stunted growth", "Leaf discoloration"],
        imageUrl: "/api/placeholder/300/200",
        timestamp: "2024-01-14 2:15 PM",
        status: 'consulted',
        expertId: 1,
        expertName: "Dr. Raj Kumar",
        recommendations: ["Apply fungicide", "Improve drainage", "Monitor closely"]
      },
      {
        id: 3,
        plantType: "Wheat Plant",
        confidence: 72,
        symptoms: ["Rust-colored spots", "Yellowing leaves"],
        imageUrl: "/api/placeholder/300/200",
        timestamp: "2024-01-13 9:45 AM",
        status: 'resolved',
        expertId: 2,
        expertName: "Dr. Priya Sharma",
        recommendations: ["Treatment applied", "Plant recovered", "Prevention measures in place"]
      }
    ];
    setLowAccuracyCases(mockCases);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'consulted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'consulted': return <MessageCircle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle2 className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expert Consultation</h1>
            <p className="text-gray-600">Get professional help for low-confidence disease detections</p>
          </div>
        </div>
      </div>

      {/* Alert for low accuracy cases */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Low Accuracy Detected:</strong> Some plant disease detections had confidence below 75%. 
          Our experts can provide more accurate diagnosis and treatment recommendations.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("experts")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "experts" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Available Experts
        </button>
        <button
          onClick={() => setActiveTab("cases")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "cases" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Low Accuracy Cases ({lowAccuracyCases.length})
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "analytics" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Experts Tab */}
      {activeTab === "experts" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map((expert) => (
              <Card key={expert.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{expert.image}</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{expert.name}</CardTitle>
                      <p className="text-sm text-gray-600">{expert.specialization}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{expert.rating}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {expert.experience}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{expert.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className={expert.availability === "Available Now" ? "text-green-600 font-medium" : "text-gray-600"}>
                        {expert.availability}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500">Fee:</span>
                      <span className="font-medium">₹{expert.consultationFee}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Languages:</p>
                    <div className="flex flex-wrap gap-1">
                      {expert.languages.map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => handleConsultExpert(expert)}
                      disabled={expert.availability !== "Available Now"}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Consult Now
                    </Button>
                    <Button variant="outline">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cases Tab */}
      {activeTab === "cases" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {lowAccuracyCases.map((case_) => (
              <Card key={case_.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{case_.plantType}</CardTitle>
                    <Badge className={getStatusColor(case_.status)}>
                      {getStatusIcon(case_.status)}
                      <span className="ml-1 capitalize">{case_.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Confidence: {case_.confidence}%</span>
                    <span>•</span>
                    <span>{case_.timestamp}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Observed Symptoms:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {case_.symptoms.map((symptom, idx) => (
                        <li key={idx}>{symptom}</li>
                      ))}
                    </ul>
                  </div>

                  {case_.expertName && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        Consulted with: {case_.expertName}
                      </p>
                      {case_.recommendations && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-blue-800 mb-1">Recommendations:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
                            {case_.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Follow Up
                    </Button>
                    <Button variant="outline">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Low Accuracy Cases</p>
                    <p className="text-2xl font-bold text-gray-900">{lowAccuracyCases.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Available Experts</p>
                    <p className="text-2xl font-bold text-gray-900">{experts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Resolved Cases</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {lowAccuracyCases.filter(c => c.status === 'resolved').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Accuracy Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High Accuracy (75%+)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                    <span className="text-sm font-medium">70%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low Accuracy (&lt;75%)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* INSTAGRAM-STYLE AGRONOMIST IN-APP CONSULTATION CALL MODAL */}
      <Dialog open={isCallingModalOpen} onOpenChange={setIsCallingModalOpen}>
        <DialogContent className="sm:max-w-sm bg-slate-950 text-white border-slate-800 rounded-3xl p-6 text-center shadow-2xl">
          <div className="flex flex-col items-center space-y-4 py-4">
            {/* Pulsing Avatar */}
            <div className="relative flex items-center justify-center">
              <div
                className={`absolute w-28 h-28 rounded-full ${
                  callStatus === "connected" ? "bg-emerald-500/20 animate-ping" : "bg-blue-500/20 animate-pulse"
                }`}
              ></div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-3xl shadow-xl relative z-10">
                {callingExpert?.image || "👨‍⚕️"}
              </div>
            </div>

            {/* Expert Details */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">{callingExpert?.name || "Agronomist"}</h3>
              <p className="text-xs text-emerald-400 font-medium">{callingExpert?.specialization}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-emerald-400 text-[11px] font-medium">
                <Lock className="h-3 w-3" />
                <span>Live Audio Consultation · Private</span>
              </div>
            </div>

            {/* Call Status, Live Wave Visualizer & Duration */}
            <div className="py-1">
              {callStatus === "ringing" ? (
                <div className="space-y-1.5">
                  <span className="text-sm font-semibold text-blue-400 animate-pulse">Connecting with Expert...</span>
                  <p className="text-[10px] text-slate-500">Establishing WebRTC Secure Audio Channel</p>
                </div>
              ) : callStatus === "connected" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1 h-5">
                    <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3"></div>
                    <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s] h-5"></div>
                    <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-4"></div>
                    <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.2s] h-2.5"></div>
                    <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.35s] h-4.5"></div>
                  </div>

                  <p className="text-2xl font-mono font-bold text-white tracking-wider">
                    {formatCallDuration(callSeconds)}
                  </p>
                </div>
              ) : (
                <span className="text-sm font-semibold text-red-400">Consultation Ended</span>
              )}
            </div>

            {/* Call Audio Controls (Mute / Speaker / End Call) */}
            <div className="flex items-center justify-center gap-5 pt-3">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-full transition-all ${
                  isMuted ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={endCall}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 transition-transform hover:scale-105 active:scale-95"
                title="End Consultation"
              >
                <PhoneOff className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`p-3.5 rounded-full transition-all ${
                  isSpeakerOn ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
                title="Toggle Speaker"
              >
                {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertConsultation;

