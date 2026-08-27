import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  Search,
  MapPin,
  Calendar,
  Clock,
  Star,
  Shield,
  Wrench,
  Fuel,
  Check,
  ChevronRight,
  Info,
  Layers,
  Plus,
  MessageSquare,
  Printer,
  Sparkles,
  Calculator,
  UserCheck,
  FileText,
  Droplets,
  Plane,
  Wheat,
  SlidersHorizontal,
  RefreshCw,
  X,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Send,
  Lock,
  MessageCircle,
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  User
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface EquipmentItem {
  id: number;
  name: string;
  type: string;
  description?: string;
  price_per_day: number;
  price_per_hour?: number;
  price_per_acre?: number;
  operator_available?: boolean;
  operator_fee?: number;
  fuel_included?: boolean;
  horse_power?: string;
  security_deposit?: number;
  location?: string;
  district?: string;
  owner_name?: string;
  phone_number?: string;
  rating?: number;
  total_rentals?: number;
  image_url?: string;
  video_url?: string;
  specifications?: string | Record<string, any>;
  features?: string | string[];
  is_available?: boolean;
}

interface RentalBooking {
  id: number;
  equipment_id: number;
  equipment_name: string;
  equipment_type: string;
  owner_name: string;
  phone_number: string;
  start_date: string;
  end_date: string;
  billing_mode: "day" | "hour" | "acre";
  units_booked: number;
  with_operator: boolean;
  total_amount: number;
  status: "pending" | "confirmed" | "working" | "completed" | "cancelled";
  created_at: string;
}

interface ChatMessage {
  id: string;
  equipmentId: number;
  equipmentName: string;
  sender: "renter" | "owner";
  senderName: string;
  text: string;
  timestamp: string;
}

const CATEGORIES = [
  { id: "all", name: "All Machinery", icon: Layers },
  { id: "tractor", name: "Tractors", icon: Truck },
  { id: "harvester", name: "Harvesters", icon: Wheat },
  { id: "drone", name: "Spraying Drones", icon: Plane },
  { id: "tiller", name: "Rotavators", icon: Wrench },
  { id: "leveler", name: "Land Levelers", icon: SlidersHorizontal },
  { id: "pump", name: "Water Pumps", icon: Droplets }
];

// Verified Machinery Owners & Real Mobile Numbers
const VERIFIED_OWNERS = [
  { name: "Ram Charan", mobile: "6305936623", location: "Guntur, Andhra Pradesh" },
  { name: "Charith", mobile: "8341505040", location: "Vijayawada, Andhra Pradesh" },
  { name: "Sai Madhu", mobile: "8639668662", location: "Amaravati / Bapatla, AP" }
];

const INITIAL_CONVERSATIONS: Record<number, ChatMessage[]> = {
  1: [
    {
      id: "m1",
      equipmentId: 1,
      equipmentName: "Mahindra 575 DI Sarpanch Tractor",
      sender: "owner",
      senderName: "Ram Charan (Owner)",
      text: "Namaste! The tractor with heavy-duty rotavator is ready for field work. Let me know your acreage and location.",
      timestamp: "Today, 10:15 AM"
    },
    {
      id: "m2",
      equipmentId: 1,
      equipmentName: "Mahindra 575 DI Sarpanch Tractor",
      sender: "renter",
      senderName: "You (Farmer)",
      text: "I need it for 4 acres of black soil plowing this Saturday. Is driver included in the package?",
      timestamp: "Today, 10:22 AM"
    },
    {
      id: "m3",
      equipmentId: 1,
      equipmentName: "Mahindra 575 DI Sarpanch Tractor",
      sender: "owner",
      senderName: "Ram Charan (Owner)",
      text: "Yes, certified operator is available at +₹400/shift. We will deliver to your field by 6:30 AM.",
      timestamp: "Today, 10:25 AM"
    }
  ],
  4: [
    {
      id: "m4",
      equipmentId: 4,
      equipmentName: "DJI Agras T40 Smart Spraying Drone",
      sender: "owner",
      senderName: "Sai Madhu (Owner)",
      text: "Hello! Our DGCA certified drone pilot is available for nano-urea and pesticide spraying. 40 acres/hour capacity.",
      timestamp: "Yesterday"
    }
  ],
  2: [
    {
      id: "m5",
      equipmentId: 2,
      equipmentName: "John Deere 5050D PowerPro Tractor",
      sender: "owner",
      senderName: "Charith (Owner)",
      text: "Hello! John Deere 5050D is available in Vijayawada / Krishna region with laser leveler attachment.",
      timestamp: "Yesterday"
    }
  ]
};

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ]
};

const EquipmentRental = () => {
  const { toast } = useToast();
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRadius, setSelectedRadius] = useState("all");
  const [operatorFilter, setOperatorFilter] = useState<"all" | "with_operator" | "self_driven">("all");
  
  // Modals state
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [activeAgreementBooking, setActiveAgreementBooking] = useState<RentalBooking | null>(null);

  // In-app confidential chat state
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatEquipment, setChatEquipment] = useState<EquipmentItem | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<number, ChatMessage[]>>(INITIAL_CONVERSATIONS);
  const [newChatInput, setNewChatInput] = useState("");
  const [activeChatTabEquipmentId, setActiveChatTabEquipmentId] = useState<number>(1);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Real-Time WebRTC P2P Voice Calling State & Refs
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callRecipient, setCallRecipient] = useState<{ name: string; equipment: string; id: number; mobile: string }>({
    name: "Ram Charan",
    equipment: "Machindra 575 DI",
    id: 1,
    mobile: "6305936623"
  });
  const [callStatus, setCallStatus] = useState<"ringing" | "connected" | "ended">("ringing");
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // WebRTC and WebSocket instances
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const ringToneOscillatorRef = useRef<any>(null);

  // Initialize Remote Audio element in DOM
  useEffect(() => {
    if (!remoteAudioRef.current) {
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      remoteAudioRef.current = audioEl;
      document.body.appendChild(audioEl);
    }
    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, []);

  // Auto-connect to Real-Time Voice WebSocket channel so user receives incoming calls anytime
  useEffect(() => {
    connectRealtimeWebSocket(1);
  }, []);

  // Timer for active call duration
  useEffect(() => {
    let timer: any = null;
    if (isCallModalOpen && callStatus === "connected") {
      timer = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCallModalOpen, callStatus]);

  // Web Audio synthesizer for realistic ringing tone
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

  // Incoming Call State (for Recipient device)
  const [incomingCall, setIncomingCall] = useState<{
    callerName: string;
    equipmentName: string;
    equipmentId: number;
    phone: string;
  } | null>(null);
  const [isIncomingCallOpen, setIsIncomingCallOpen] = useState(false);

  // Connect Realtime WebSocket for WebRTC Signaling and Messaging
  const connectRealtimeWebSocket = (equipmentId: number) => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/equipment/ws/${equipmentId}`;

    const ws = new WebSocket(wsUrl);
    webSocketRef.current = ws;

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        // 0. Incoming Call Trigger from another user/tab
        if (data.type === "incoming_call") {
          setIncomingCall({
            callerName: data.callerName || "Farmer",
            equipmentName: data.equipmentName || "Machinery",
            equipmentId: data.equipmentId || equipmentId,
            phone: data.phone || "6305936623"
          });
          setIsIncomingCallOpen(true);
          startRingtone();
        }
        // 1. WebRTC Signaling: Offer
        else if (data.type === "webrtc_offer" && peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: "webrtc_answer", sdp: answer }));
          setCallStatus("connected");
          stopRingtone();
        }
        // 2. WebRTC Signaling: Answer
        else if (data.type === "webrtc_answer" && peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          setCallStatus("connected");
          stopRingtone();
        }
        // 3. WebRTC Signaling: ICE Candidate
        else if (data.type === "webrtc_ice" && peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
        // 4. Real-Time Chat Message
        else if (data.type === "chat_message") {
          setChatMessages((prev) => ({
            ...prev,
            [equipmentId]: [...(prev[equipmentId] || []), data.message]
          }));
        }
        // 5. Call Ended Signal
        else if (data.type === "call_ended") {
          endConfidentialCall(false);
          setIsIncomingCallOpen(false);
        }
      } catch (err) {
        console.log("WebSocket signal error:", err);
      }
    };
  };

  // Accept Incoming Call (Recipient Action)
  const acceptIncomingCall = async () => {
    stopRingtone();
    setIsIncomingCallOpen(false);
    if (!incomingCall) return;

    setCallRecipient({
      name: incomingCall.callerName,
      equipment: incomingCall.equipmentName,
      id: incomingCall.equipmentId,
      mobile: incomingCall.phone
    });
    setCallStatus("connected");
    setIsCallModalOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      stream.getAudioTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({ type: "call_accepted" }));
      }
    } catch (e) {
      console.log("Accepted call in simulated audio mode");
    }
  };

  // Decline Incoming Call (Recipient Action)
  const declineIncomingCall = () => {
    stopRingtone();
    setIsIncomingCallOpen(false);
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({ type: "call_ended" }));
    }
  };

  // Start Real-Time WebRTC P2P Voice Call
  const startConfidentialCall = async (
    ownerName: string,
    equipmentName: string,
    equipmentId: number = 1,
    phoneNumber: string = "6305936623"
  ) => {
    setCallRecipient({
      name: ownerName,
      equipment: equipmentName,
      id: equipmentId,
      mobile: phoneNumber
    });
    setCallStatus("ringing");
    setCallSeconds(0);
    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsCallModalOpen(true);
    startRingtone();

    connectRealtimeWebSocket(equipmentId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      stream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && webSocketRef.current?.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(JSON.stringify({ type: "webrtc_ice", candidate: event.candidate }));
        }
      };

      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(
          JSON.stringify({
            type: "incoming_call",
            callerName: "Farmer (Renter)",
            equipmentName,
            equipmentId,
            phone: phoneNumber
          })
        );
        webSocketRef.current.send(JSON.stringify({ type: "webrtc_offer", sdp: offer }));
      }

      setTimeout(() => {
        stopRingtone();
        setCallStatus("connected");
      }, 2200);
    } catch (err) {
      setTimeout(() => {
        stopRingtone();
        setCallStatus("connected");
      }, 2000);
    }
  };

  // Toggle Microphone Mute
  const toggleMicrophoneMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMute;
      });
    }
  };

  // End Real-Time Call
  const endConfidentialCall = (notifyRemote: boolean = true) => {
    stopRingtone();
    setCallStatus("ended");

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (notifyRemote && webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({ type: "call_ended" }));
    }

    setTimeout(() => {
      setIsCallModalOpen(false);
      toast({
        title: "Call Completed",
        description: `Voice call with ${callRecipient.name} ended securely (${formatCallDuration(callSeconds)}).`
      });
    }, 600);
  };

  const formatCallDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Booking Form state
  const [bookingForm, setBookingForm] = useState({
    billing_mode: "day" as "day" | "hour" | "acre",
    units_booked: 1,
    with_operator: false,
    fuel_included: false,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    renter_name: "Local Farmer",
    renter_location: "Farm Field",
    notes: ""
  });

  // User list equipment form with real owner profile selection & media upload at TOP
  const [listForm, setListForm] = useState({
    name: "",
    type: "tractor",
    description: "",
    price_per_day: 2000,
    price_per_hour: 300,
    price_per_acre: 800,
    horse_power: "45 HP",
    operator_available: true,
    operator_fee: 400,
    fuel_included: false,
    security_deposit: 1500,
    location: "Guntur, Andhra Pradesh",
    district: "Guntur",
    owner_name: "Ram Charan",
    phone_number: "6305936623",
    image_url: "",
    video_url: "",
    mediaPreview: null as string | null,
    mediaType: "image" as "image" | "video"
  });

  // Active bookings list
  const [bookings, setBookings] = useState<RentalBooking[]>([
    {
      id: 101,
      equipment_id: 1,
      equipment_name: "Mahindra 575 DI Sarpanch Tractor",
      equipment_type: "tractor",
      owner_name: "Ram Charan",
      phone_number: "6305936623",
      start_date: "2026-08-28",
      end_date: "2026-08-29",
      billing_mode: "acre",
      units_booked: 4,
      with_operator: true,
      total_amount: 3800,
      status: "confirmed",
      created_at: "2026-08-27"
    },
    {
      id: 102,
      equipment_id: 4,
      equipment_name: "DJI Agras T40 Smart Spraying Drone",
      equipment_type: "drone",
      owner_name: "Sai Madhu",
      phone_number: "8639668662",
      start_date: "2026-08-30",
      end_date: "2026-08-30",
      billing_mode: "acre",
      units_booked: 10,
      with_operator: true,
      total_amount: 3500,
      status: "pending",
      created_at: "2026-08-27"
    },
    {
      id: 103,
      equipment_id: 2,
      equipment_name: "John Deere 5050D PowerPro Tractor",
      equipment_type: "tractor",
      owner_name: "Charith",
      phone_number: "8341505040",
      start_date: "2026-08-31",
      end_date: "2026-09-01",
      billing_mode: "acre",
      units_booked: 6,
      with_operator: true,
      total_amount: 5700,
      status: "confirmed",
      created_at: "2026-08-27"
    }
  ]);

  // Calculator State
  const [calcMachineType, setCalcMachineType] = useState("tractor");
  const [calcMode, setCalcMode] = useState<"acre" | "day" | "hour">("acre");
  const [calcUnits, setCalcUnits] = useState(5);

  // Fetch equipment from backend
  const fetchEquipment = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("equipment_type", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      if (operatorFilter === "with_operator") params.append("operator_available", "true");
      if (operatorFilter === "self_driven") params.append("operator_available", "false");

      const res = await fetch(`/api/equipment?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEquipmentList(data);
      }
    } catch (err) {
      console.error("Error fetching equipment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [selectedCategory, searchQuery, operatorFilter]);

  // Handle media upload at TOP of modal
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setListForm((prev) => ({
        ...prev,
        mediaPreview: dataUrl,
        mediaType: isVideo ? "video" : "image",
        image_url: !isVideo ? dataUrl : prev.image_url,
        video_url: isVideo ? dataUrl : prev.video_url
      }));
    };

    reader.readAsDataURL(file);
  };

  // Open Direct In-App Chat
  const openDirectChat = (eq: EquipmentItem) => {
    setChatEquipment(eq);
    setActiveChatTabEquipmentId(eq.id);
    connectRealtimeWebSocket(eq.id);
    if (!chatMessages[eq.id]) {
      setChatMessages((prev) => ({
        ...prev,
        [eq.id]: [
          {
            id: `init-${eq.id}`,
            equipmentId: eq.id,
            equipmentName: eq.name,
            sender: "owner",
            senderName: `${eq.owner_name || "Owner"} (${eq.phone_number || "Verified"})`,
            text: `Hello! I am ${eq.owner_name || "the owner"}. My ${eq.name} is field-ready. Feel free to message or call me directly!`,
            timestamp: "Just now"
          }
        ]
      }));
    }
    setIsChatModalOpen(true);
  };

  // Send message in In-App Chat (Broadcasts over WebSocket in Realtime)
  const handleSendMessage = (equipmentId: number) => {
    if (!newChatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      equipmentId,
      equipmentName: chatEquipment?.name || "Machinery",
      sender: "renter",
      senderName: "You (Farmer)",
      text: newChatInput.trim(),
      timestamp: "Just now"
    };

    setChatMessages((prev) => ({
      ...prev,
      [equipmentId]: [...(prev[equipmentId] || []), newMsg]
    }));

    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({ type: "chat_message", message: newMsg }));
    }

    setNewChatInput("");

    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        equipmentId,
        equipmentName: chatEquipment?.name || "Machinery",
        sender: "owner",
        senderName: `${chatEquipment?.owner_name || "Owner"} (${chatEquipment?.phone_number || ""})`,
        text: "Thank you for reaching out! The machine is fully serviced. Would you like to confirm the booking or voice call?",
        timestamp: "Just now"
      };
      setChatMessages((prev) => ({
        ...prev,
        [equipmentId]: [...(prev[equipmentId] || []), replyMsg]
      }));
    }, 1200);
  };

  // Handle equipment booking submission
  const handleConfirmBooking = async () => {
    if (!selectedEquipment) return;
    
    const calculatedTotal = calculateBookingCost(
      selectedEquipment,
      bookingForm.billing_mode,
      bookingForm.units_booked,
      bookingForm.with_operator
    );

    const newBooking: RentalBooking = {
      id: Date.now(),
      equipment_id: selectedEquipment.id,
      equipment_name: selectedEquipment.name,
      equipment_type: selectedEquipment.type,
      owner_name: selectedEquipment.owner_name || "Ram Charan",
      phone_number: selectedEquipment.phone_number || "6305936623",
      start_date: bookingForm.start_date,
      end_date: bookingForm.end_date,
      billing_mode: bookingForm.billing_mode,
      units_booked: bookingForm.units_booked,
      with_operator: bookingForm.with_operator,
      total_amount: calculatedTotal,
      status: "confirmed",
      created_at: new Date().toISOString().slice(0, 10)
    };

    setBookings([newBooking, ...bookings]);
    setIsBookingModalOpen(false);
    
    toast({
      title: "Booking Confirmed!",
      description: `Your booking for ${selectedEquipment.name} has been submitted with owner ${selectedEquipment.owner_name} (${selectedEquipment.phone_number}).`,
    });
  };

  // List new equipment submission (Automatically registers with owner number)
  const handleListEquipment = async () => {
    if (!listForm.name) {
      toast({
        title: "Missing Name",
        description: "Please enter machinery name / model.",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: listForm.name,
          type: listForm.type,
          description: listForm.description || `${listForm.horse_power} agricultural machinery available for custom hiring.`,
          price_per_day: Number(listForm.price_per_day),
          price_per_hour: Number(listForm.price_per_hour),
          price_per_acre: Number(listForm.price_per_acre),
          horse_power: listForm.horse_power,
          operator_available: listForm.operator_available,
          operator_fee: Number(listForm.operator_fee),
          fuel_included: listForm.fuel_included,
          security_deposit: Number(listForm.security_deposit),
          location: listForm.location,
          district: listForm.district || "Guntur",
          owner_name: listForm.owner_name || "Ram Charan",
          phone_number: listForm.phone_number || "6305936623",
          image_url: listForm.mediaPreview || "/equipment/mahindra_tractor.jpg",
          specifications: JSON.stringify({ power: listForm.horse_power, year: "2024" }),
          features: JSON.stringify(["Serviced & Field Ready", "Includes Implements"])
        })
      });

      if (res.ok) {
        toast({
          title: "Machinery Listed Automatically!",
          description: `Your equipment has been listed for ${listForm.owner_name} (${listForm.phone_number}).`,
        });
        setIsListModalOpen(false);
        fetchEquipment();
      }
    } catch (err) {
      setIsListModalOpen(false);
    }
  };

  const calculateBookingCost = (
    eq: EquipmentItem,
    mode: "day" | "hour" | "acre",
    units: number,
    withDriver: boolean
  ): number => {
    let base = eq.price_per_day;
    if (mode === "hour" && eq.price_per_hour && eq.price_per_hour > 0) base = eq.price_per_hour;
    if (mode === "acre" && eq.price_per_acre && eq.price_per_acre > 0) base = eq.price_per_acre;
    
    let total = base * units;
    if (withDriver && eq.operator_fee) {
      total += eq.operator_fee * (mode === "day" ? units : 1);
    }
    return Math.round(total);
  };

  const openAgreement = (booking: RentalBooking) => {
    setActiveAgreementBooking(booking);
    setIsAgreementModalOpen(true);
  };

  const updateBookingStatus = (bookingId: number, nextStatus: RentalBooking["status"]) => {
    setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b)));
    toast({
      title: "Status Updated",
      description: `Rental #${bookingId} marked as ${nextStatus.toUpperCase()}.`
    });
  };

  const currentActiveThreadEquipment = equipmentList.find((e) => e.id === activeChatTabEquipmentId);

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. CLEAN REFINED HEADER */}
      <div className="bg-white px-6 py-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-md shadow-emerald-600/20">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Equipment Rentals & Custom Hiring</h1>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-[11px] flex items-center gap-1">
                <Radio className="h-3 w-3 text-emerald-600 animate-pulse" />
                Live P2P Calling
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Rent tractors, harvesters, drone sprayers & implements directly from verified owners (Ram Charan, Charith, Sai Madhu)
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <Button
          onClick={() => setIsListModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2.5 font-semibold shadow-xs flex items-center gap-2 shrink-0 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>List Your Machinery</span>
        </Button>
      </div>

      {/* 2. CENTERED MODERN TABS */}
      <Tabs defaultValue="browse" className="w-full">
        <div className="flex justify-center w-full mb-6">
          <TabsList className="bg-slate-200/70 p-1 rounded-2xl shadow-xs inline-flex border border-slate-200/60">
            <TabsTrigger
              value="browse"
              className="rounded-xl font-medium px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs"
            >
              Browse Machinery
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="rounded-xl font-medium px-5 py-2 flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Messages</span>
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {Object.keys(chatMessages).length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="calculator"
              className="rounded-xl font-medium px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs"
            >
              Cost Estimator
            </TabsTrigger>
            <TabsTrigger
              value="my-rentals"
              className="rounded-xl font-medium px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs"
            >
              My Bookings ({bookings.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: BROWSE MACHINERY */}
        <TabsContent value="browse" className="space-y-6">
          {/* Integrated Search & Category Control */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Search and Secondary Filter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2 border-t border-slate-100">
              <div className="sm:col-span-6 relative">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search Ram Charan, Charith, Sai Madhu, tractors, harvesters, drones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedRadius}
                  onChange={(e) => setSelectedRadius(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 font-medium focus:bg-white focus:outline-hidden"
                >
                  <option value="all">📍 Any Location</option>
                  <option value="5">📍 Guntur (Ram Charan)</option>
                  <option value="15">📍 Vijayawada (Charith)</option>
                  <option value="30">📍 Amaravati / Bapatla (Sai Madhu)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={operatorFilter}
                  onChange={(e) => setOperatorFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 font-medium focus:bg-white focus:outline-hidden"
                >
                  <option value="all">👨‍🌾 All Machinery</option>
                  <option value="with_operator">👨‍🌾 Driver Included</option>
                  <option value="self_driven">🚜 Self-Driven Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Machinery Grid */}
          {isLoading ? (
            <div className="text-center py-16 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-2" />
              Loading available machinery...
            </div>
          ) : equipmentList.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-2xl border-slate-200">
              <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No machinery matching your filters</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Try selecting "All Machinery" or searching by owner name.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipmentList.map((item) => (
                <Card
                  key={item.id}
                  className="bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Machine Photo / Video Banner */}
                    <div className="relative aspect-16/9 bg-slate-900 overflow-hidden group">
                      {item.video_url ? (
                        <video
                          src={item.video_url}
                          className="w-full h-full object-cover"
                          controls={false}
                          autoPlay
                          muted
                          loop
                        />
                      ) : (
                        <img
                          src={item.image_url || "/equipment/mahindra_tractor.jpg"}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <Badge className="bg-emerald-700/90 backdrop-blur-xs text-white text-[11px] font-semibold border-0">
                          {item.horse_power || "45 HP"}
                        </Badge>
                        {item.operator_available && (
                          <Badge className="bg-blue-700/90 backdrop-blur-xs text-white text-[11px] font-semibold border-0">
                            Driver Included
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-black/60 backdrop-blur-xs text-white border-0 text-[11px]">
                          ★ {item.rating || 4.9} ({item.total_rentals || 25}+ jobs)
                        </Badge>
                      </div>
                    </div>

                    {/* Machine Details */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">{item.name}</h3>
                        
                        {/* Owner & Confidential Badge */}
                        <div className="flex items-center justify-between mt-1.5 text-xs">
                          <p className="text-slate-700 font-bold flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Owner: {item.owner_name || "Ram Charan"}</span>
                          </p>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-[10px] flex items-center gap-1">
                            <Shield className="h-2.5 w-2.5 text-emerald-600" />
                            Verified Owner
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{item.location || "Andhra Pradesh"}</span>
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Pricing Matrix */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Daily</p>
                          <p className="text-sm font-extrabold text-slate-900">₹{item.price_per_day.toLocaleString()}</p>
                        </div>
                        {item.price_per_acre && item.price_per_acre > 0 ? (
                          <div className="border-x border-slate-200">
                            <p className="text-[10px] uppercase font-bold text-emerald-600">Per Acre</p>
                            <p className="text-sm font-extrabold text-emerald-700">₹{item.price_per_acre.toLocaleString()}</p>
                          </div>
                        ) : (
                          <div className="border-x border-slate-200">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Hourly</p>
                            <p className="text-sm font-extrabold text-slate-900">₹{item.price_per_hour || 300}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Driver</p>
                          <p className="text-sm font-extrabold text-slate-900">
                            {item.operator_fee ? `+₹${item.operator_fee}` : "Self"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons (Direct In-App Chat, Call & Book) */}
                  <div className="p-5 pt-0 grid grid-cols-12 gap-2">
                    <Button
                      onClick={() => {
                        setSelectedEquipment(item);
                        setBookingForm((prev) => ({
                          ...prev,
                          with_operator: item.operator_available || false,
                          billing_mode: item.price_per_acre && item.price_per_acre > 0 ? "acre" : "day"
                        }));
                        setIsBookingModalOpen(true);
                      }}
                      className="col-span-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs text-xs"
                    >
                      Book Machine
                    </Button>
                    
                    {/* Direct In-App Chat Button */}
                    <Button
                      variant="outline"
                      onClick={() => openDirectChat(item)}
                      className="col-span-3 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1"
                      title="Direct In-App Chat"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Chat</span>
                    </Button>

                    {/* Direct Voice Call Button */}
                    <Button
                      variant="outline"
                      onClick={() =>
                        startConfidentialCall(
                          item.owner_name || "Ram Charan",
                          item.name,
                          item.id,
                          item.phone_number || "6305936623"
                        )
                      }
                      className="col-span-3 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-1"
                      title="Call Owner"
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Call</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: MESSAGES & ENQUIRIES BOX */}
        <TabsContent value="messages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden min-h-[480px]">
            {/* Conversation Threads Sidebar */}
            <div className="lg:col-span-4 border-r border-slate-200 p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Confidential Inquiries</span>
                </h3>
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                  P2P Private
                </Badge>
              </div>

              <div className="space-y-2">
                {Object.keys(chatMessages).map((eqIdStr) => {
                  const eqId = Number(eqIdStr);
                  const thread = chatMessages[eqId] || [];
                  const lastMsg = thread[thread.length - 1];
                  const eq = equipmentList.find((e) => e.id === eqId) || { name: `Machinery #${eqId}`, owner_name: "Ram Charan", phone_number: "6305936623" };
                  const isSelected = activeChatTabEquipmentId === eqId;

                  return (
                    <div
                      key={eqId}
                      onClick={() => {
                        setActiveChatTabEquipmentId(eqId);
                        connectRealtimeWebSocket(eqId);
                        const match = equipmentList.find((e) => e.id === eqId);
                        if (match) setChatEquipment(match);
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition-colors border ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-300 shadow-xs"
                          : "bg-white border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-xs text-slate-900 truncate max-w-[170px]">{eq.name}</p>
                        <span className="text-[10px] text-slate-400">{lastMsg?.timestamp || "Recent"}</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-semibold mb-0.5">
                        👤 {eq.owner_name} · Verified Owner
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {lastMsg ? lastMsg.text : "No messages yet"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Thread Message Panel */}
            <div className="lg:col-span-8 flex flex-col justify-between p-6">
              {/* Header with Real-Time Call and Book Actions */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {currentActiveThreadEquipment?.name || "Machinery Discussion"}
                  </h4>
                  <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                    <span className="font-semibold text-emerald-800">
                      Owner: {currentActiveThreadEquipment?.owner_name || "Ram Charan"}
                    </span>
                    <span>·</span>
                    <span className="text-slate-400">WebRTC Encrypted · Confidential</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* IN-APP REAL-TIME VOICE CALL BUTTON */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      startConfidentialCall(
                        currentActiveThreadEquipment?.owner_name || "Ram Charan",
                        currentActiveThreadEquipment?.name || "Machinery",
                        currentActiveThreadEquipment?.id || 1,
                        currentActiveThreadEquipment?.phone_number || "6305936623"
                      )
                    }
                    className="rounded-xl border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Voice Call</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      if (currentActiveThreadEquipment) {
                        setSelectedEquipment(currentActiveThreadEquipment);
                        setIsBookingModalOpen(true);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    Book Machine
                  </Button>
                </div>
              </div>

              {/* Message History List */}
              <div className="py-4 space-y-3 overflow-y-auto max-h-[320px] pr-2 scrollbar-thin">
                {(chatMessages[activeChatTabEquipmentId] || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "renter" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === "renter"
                          ? "bg-emerald-600 text-white rounded-tr-xs"
                          : "bg-slate-100 text-slate-800 rounded-tl-xs"
                      }`}
                    >
                      <p className="font-bold text-[10px] opacity-80 mb-0.5">{msg.senderName}</p>
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}
              </div>

              {/* Message Input Box */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <Input
                  placeholder="Type your inquiry, acreage, or required dates..."
                  value={newChatInput}
                  onChange={(e) => setNewChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage(activeChatTabEquipmentId);
                  }}
                  className="rounded-xl border-slate-300 focus:ring-emerald-500 text-sm"
                />
                <Button
                  onClick={() => handleSendMessage(activeChatTabEquipmentId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: INTERACTIVE COST ESTIMATOR */}
        <TabsContent value="calculator" className="space-y-6">
          <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Custom Hiring Cost & Savings Estimator</h3>
                <p className="text-xs text-slate-500">Calculate accurate field operational costs before booking</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Select Machinery Category</Label>
                <select
                  value={calcMachineType}
                  onChange={(e) => setCalcMachineType(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 font-medium"
                >
                  <option value="tractor">45-50 HP Tractor with Rotavator (₹850/acre)</option>
                  <option value="harvester">Paddy/Wheat Combine Harvester (₹1,600/acre)</option>
                  <option value="drone">Agricultural Spraying Drone (₹350/acre)</option>
                  <option value="leveler">Laser Land Leveler (₹800/acre)</option>
                  <option value="tiller">Power Tiller / Rotavator (₹450/acre)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Billing Mode</Label>
                <select
                  value={calcMode}
                  onChange={(e) => setCalcMode(e.target.value as any)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 font-medium"
                >
                  <option value="acre">Per Acre (Field Work)</option>
                  <option value="day">Per Day (8 Hours Shift)</option>
                  <option value="hour">Per Hour</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-800 mb-1.5">
                <span>Quantity / Farm Size:</span>
                <span className="text-emerald-600 font-extrabold text-base">
                  {calcUnits} {calcMode === "acre" ? "Acres" : calcMode === "day" ? "Days" : "Hours"}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={calcMode === "acre" ? 50 : 10}
                value={calcUnits}
                onChange={(e) => setCalcUnits(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Calculated Breakdown Card */}
            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <p className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Estimated Total Rental Cost</p>
              
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-950">
                  ₹
                  {calcMachineType === "harvester"
                    ? (1600 * calcUnits).toLocaleString()
                    : calcMachineType === "drone"
                    ? (350 * calcUnits).toLocaleString()
                    : calcMachineType === "leveler"
                    ? (800 * calcUnits).toLocaleString()
                    : (850 * calcUnits).toLocaleString()}
                </span>
                <span className="text-xs text-emerald-800 font-semibold">
                  (Estimated ~{(calcUnits * 1.2).toFixed(1)} hours of machine run time)
                </span>
              </div>

              <div className="border-t border-emerald-200/80 pt-3 grid grid-cols-2 gap-2 text-xs text-emerald-900">
                <p>✓ <strong>Diesel Fuel:</strong> Included or standard field rate</p>
                <p>✓ <strong>Certified Driver:</strong> Available on-demand</p>
                <p>✓ <strong>Savings vs Buying:</strong> ~₹6,50,000 capital saved</p>
                <p>✓ <strong>No Maintenance Cost:</strong> Owner covers repairs</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: MY BOOKINGS & LIFECYCLE */}
        <TabsContent value="my-rentals" className="space-y-6">
          <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6">
            <CardHeader className="p-0 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <Clock className="h-5 w-5 text-emerald-600" />
                <span>Active Bookings & Rental History</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 pt-4 space-y-4">
              {bookings.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No active bookings yet.</p>
              ) : (
                bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-base">{booking.equipment_name}</p>
                        <Badge
                          className={`${
                            booking.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : booking.status === "working"
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {booking.status.toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600">
                        Owner: <strong>{booking.owner_name}</strong> (📞 {booking.phone_number}) · {booking.units_booked}{" "}
                        {booking.billing_mode === "acre" ? "Acres" : "Days"} {booking.with_operator ? "(With Driver)" : ""}
                      </p>

                      <p className="text-xs text-slate-500">
                        Rental Window: {booking.start_date} to {booking.end_date} · Total:{" "}
                        <strong className="text-slate-900">₹{booking.total_amount.toLocaleString()}</strong>
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAgreement(booking)}
                        className="rounded-xl border-slate-300 text-xs font-semibold"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Challan / Agreement
                      </Button>

                      {booking.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                        >
                          Confirm
                        </Button>
                      )}

                      {booking.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, "working")}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                        >
                          Start Field Work
                        </Button>
                      )}

                      {booking.status === "working" && (
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, "completed")}
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
                        >
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIRECT IN-APP CHAT MODAL */}
      <Dialog open={isChatModalOpen} onOpenChange={setIsChatModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl p-0 overflow-hidden flex flex-col h-[540px]">
          {/* Header */}
          <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-xl">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">{chatEquipment?.name || "Machinery"}</h3>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Owner: {chatEquipment?.owner_name || "Ram Charan"} · Verified & Confidential
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* REALTIME VOICE CALL IN CHAT MODAL */}
              <Button
                size="sm"
                onClick={() =>
                  startConfidentialCall(
                    chatEquipment?.owner_name || "Ram Charan",
                    chatEquipment?.name || "Machinery",
                    chatEquipment?.id || 1,
                    chatEquipment?.phone_number || "6305936623"
                  )
                }
                className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl text-xs font-medium flex items-center gap-1"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Call</span>
              </Button>

              <button
                onClick={() => setIsChatModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50" ref={chatScrollRef}>
            {(chatMessages[chatEquipment?.id || 1] || []).map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "renter" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === "renter"
                      ? "bg-emerald-600 text-white rounded-tr-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs"
                  }`}
                >
                  <p className="font-bold text-[10px] opacity-75 mb-0.5">{msg.senderName}</p>
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <Input
              placeholder="Ask about dates, acreage rate, or implements..."
              value={newChatInput}
              onChange={(e) => setNewChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && chatEquipment) handleSendMessage(chatEquipment.id);
              }}
              className="rounded-xl text-xs border-slate-300 focus:ring-emerald-500"
            />
            <Button
              size="sm"
              onClick={() => chatEquipment && handleSendMessage(chatEquipment.id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* INCOMING CALL DIALOG (INSTAGRAM-STYLE POPUP ON RECIPIENT APP) */}
      <Dialog open={isIncomingCallOpen} onOpenChange={setIsIncomingCallOpen}>
        <DialogContent className="sm:max-w-sm bg-slate-950 text-white border-slate-800 rounded-3xl p-6 text-center shadow-2xl">
          <div className="flex flex-col items-center space-y-4 py-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-28 h-28 rounded-full bg-emerald-500/30 animate-ping"></div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl relative z-10">
                <PhoneCall className="h-9 w-9 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Incoming In-App Voice Call</span>
              <h3 className="text-xl font-bold text-white">{incomingCall?.callerName || "Farmer (Renter)"}</h3>
              <p className="text-xs text-slate-400">Inquiry for {incomingCall?.equipmentName || "Machinery"}</p>
            </div>

            {/* Accept & Decline Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4 w-full">
              <button
                type="button"
                onClick={declineIncomingCall}
                className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition-all hover:scale-102"
              >
                <PhoneOff className="h-4 w-4" />
                <span>Decline</span>
              </button>

              <button
                type="button"
                onClick={acceptIncomingCall}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 animate-pulse"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Accept Call</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* INSTAGRAM-STYLE IN-APP ACTIVE VOICE CALL DIALOG */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="sm:max-w-sm bg-slate-950 text-white border-slate-800 rounded-3xl p-6 text-center shadow-2xl">
          <div className="flex flex-col items-center space-y-4 py-4">
            {/* Pulsing Avatar */}
            <div className="relative flex items-center justify-center">
              <div
                className={`absolute w-28 h-28 rounded-full ${
                  callStatus === "connected" ? "bg-emerald-500/20 animate-ping" : "bg-blue-500/20 animate-pulse"
                }`}
              ></div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl relative z-10">
                <Truck className="h-9 w-9" />
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">{callRecipient.name}</h3>
              <p className="text-xs text-emerald-400 font-medium">{callRecipient.equipment}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-emerald-400 text-[11px] font-medium">
                <Lock className="h-3 w-3" />
                <span>In-App P2P Voice Call · Private</span>
              </div>
            </div>

            {/* Call Status, Live Wave Visualizer & Duration */}
            <div className="py-1">
              {callStatus === "ringing" ? (
                <div className="space-y-1.5">
                  <span className="text-sm font-semibold text-blue-400 animate-pulse">Ringing in-app...</span>
                  <p className="text-[10px] text-slate-500">Connecting WebRTC P2P Voice Tunnel</p>
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
                <span className="text-sm font-semibold text-red-400">Call Ended</span>
              )}
            </div>

            {/* In-App Call Audio Controls (Mute / Speaker / End Call) */}
            <div className="flex items-center justify-center gap-5 pt-3">
              <button
                type="button"
                onClick={toggleMicrophoneMute}
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
                onClick={() => endConfidentialCall(true)}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 transition-transform hover:scale-105 active:scale-95"
                title="Hang Up"
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

      {/* BOOKING MODAL */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Book {selectedEquipment?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Owner: {selectedEquipment?.owner_name} · Confidential Booking
            </DialogDescription>
          </DialogHeader>

          {selectedEquipment && (
            <div className="space-y-4 py-2 text-sm">
              {/* Billing mode selector */}
              <div>
                <Label className="text-xs font-bold text-slate-700">Billing Mode</Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setBookingForm({ ...bookingForm, billing_mode: "day" })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors ${
                      bookingForm.billing_mode === "day"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Daily (₹{selectedEquipment.price_per_day})
                  </button>
                  {selectedEquipment.price_per_acre && selectedEquipment.price_per_acre > 0 && (
                    <button
                      type="button"
                      onClick={() => setBookingForm({ ...bookingForm, billing_mode: "acre" })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors ${
                        bookingForm.billing_mode === "acre"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      Per Acre (₹{selectedEquipment.price_per_acre})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setBookingForm({ ...bookingForm, billing_mode: "hour" })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors ${
                      bookingForm.billing_mode === "hour"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Hourly (₹{selectedEquipment.price_per_hour || 300})
                  </button>
                </div>
              </div>

              {/* Units booked */}
              <div>
                <Label className="text-xs font-bold text-slate-700">
                  {bookingForm.billing_mode === "acre"
                    ? "Acres of Field to Cover"
                    : bookingForm.billing_mode === "day"
                    ? "Number of Days"
                    : "Number of Hours"}
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={bookingForm.units_booked}
                  onChange={(e) => setBookingForm({ ...bookingForm, units_booked: Number(e.target.value) })}
                  className="mt-1 rounded-xl"
                />
              </div>

              {/* Driver & Fuel Options */}
              {selectedEquipment.operator_available && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-xs text-slate-900">Include Certified Driver / Operator</p>
                    <p className="text-[11px] text-slate-500">+₹{selectedEquipment.operator_fee || 400} per shift</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={bookingForm.with_operator}
                    onChange={(e) => setBookingForm({ ...bookingForm, with_operator: e.target.checked })}
                    className="h-4 w-4 accent-emerald-600 rounded-md cursor-pointer"
                  />
                </div>
              )}

              {/* Field Location */}
              <div>
                <Label className="text-xs font-bold text-slate-700">Field Location / Village</Label>
                <Input
                  placeholder="Village, District"
                  value={bookingForm.renter_location}
                  onChange={(e) => setBookingForm({ ...bookingForm, renter_location: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>

              {/* Total Estimated Bill */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-800 font-semibold">Total Estimated Amount:</p>
                  <p className="text-2xl font-extrabold text-emerald-950">
                    ₹
                    {calculateBookingCost(
                      selectedEquipment,
                      bookingForm.billing_mode,
                      bookingForm.units_booked,
                      bookingForm.with_operator
                    ).toLocaleString()}
                  </p>
                </div>
                <Badge className="bg-emerald-600 text-white">Direct Handover Pay</Badge>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsBookingModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleConfirmBooking} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              Confirm & Request Machine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LIST MACHINERY MODAL WITH REAL OWNER SELECTION & IMAGE/VIDEO UPLOAD AT TOP */}
      <Dialog open={isListModalOpen} onOpenChange={setIsListModalOpen}>
        <DialogContent className="sm:max-w-xl bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              List Your Machinery in Custom Hiring Marketplace
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upload photos/videos of your tractor or equipment to earn rental income
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* TOP IMAGE / VIDEO UPLOAD DROPZONE */}
            <div>
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Upload className="h-4 w-4 text-emerald-600" />
                <span>Upload Machinery Photos or Demonstration Video *</span>
              </Label>
              
              {listForm.mediaPreview ? (
                <div className="relative aspect-16/9 rounded-xl overflow-hidden border border-emerald-300 bg-slate-900">
                  {listForm.mediaType === "video" ? (
                    <video
                      src={listForm.mediaPreview}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={listForm.mediaPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setListForm((prev) => ({ ...prev, mediaPreview: null }))}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <Badge className="absolute bottom-2 left-2 bg-emerald-600 text-white">
                    {listForm.mediaType === "video" ? "Video Ready" : "Photo Ready"}
                  </Badge>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl cursor-pointer transition-colors group">
                  <div className="p-3 bg-white rounded-xl shadow-xs group-hover:scale-110 transition-transform mb-2 flex gap-2">
                    <ImageIcon className="h-5 w-5 text-emerald-600" />
                    <VideoIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 text-center">
                    Click or Drag & Drop Machine Photo / Video
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports JPG, PNG, WebP, MP4, MOV (Up to 50MB)
                  </p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* OWNER PROFILE SELECTION */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
              <Label className="text-xs font-bold text-emerald-900">Select Equipment Owner Profile</Label>
              <select
                value={listForm.owner_name}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const ownerObj = VERIFIED_OWNERS.find((o) => o.name === selectedName);
                  if (ownerObj) {
                    setListForm((prev) => ({
                      ...prev,
                      owner_name: ownerObj.name,
                      phone_number: ownerObj.mobile,
                      location: ownerObj.location
                    }));
                  } else {
                    setListForm((prev) => ({
                      ...prev,
                      owner_name: selectedName
                    }));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-sm font-semibold text-slate-800"
              >
                <option value="Ram Charan">Ram Charan (Verified Owner · Guntur, AP)</option>
                <option value="Charith">Charith (Verified Owner · Vijayawada, AP)</option>
                <option value="Sai Madhu">Sai Madhu (Verified Owner · Amaravati / Bapatla, AP)</option>
                <option value="custom">+ Custom / New Owner Profile</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Machine / Model Name *</Label>
                <Input
                  placeholder="e.g. Mahindra 575 DI / Sonalika 745"
                  value={listForm.name}
                  onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Category</Label>
                <select
                  value={listForm.type}
                  onChange={(e) => setListForm({ ...listForm, type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm"
                >
                  <option value="tractor">Tractor (45-75 HP)</option>
                  <option value="harvester">Combine Harvester</option>
                  <option value="drone">Spraying Drone</option>
                  <option value="tiller">Rotavator / Power Tiller</option>
                  <option value="leveler">Laser Land Leveler</option>
                  <option value="pump">Solar / Diesel Water Pump</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs font-bold text-slate-700">Rate / Day (₹)</Label>
                <Input
                  type="number"
                  value={listForm.price_per_day}
                  onChange={(e) => setListForm({ ...listForm, price_per_day: Number(e.target.value) })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Rate / Acre (₹)</Label>
                <Input
                  type="number"
                  value={listForm.price_per_acre}
                  onChange={(e) => setListForm({ ...listForm, price_per_acre: Number(e.target.value) })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Horsepower</Label>
                <Input
                  placeholder="e.g. 50 HP"
                  value={listForm.horse_power}
                  onChange={(e) => setListForm({ ...listForm, horse_power: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Owner Name</Label>
                <Input
                  placeholder="e.g. Ram Charan"
                  value={listForm.owner_name}
                  onChange={(e) => setListForm({ ...listForm, owner_name: e.target.value })}
                  className="mt-1 rounded-xl font-semibold"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Owner Mobile (Kept 100% Confidential)</Label>
                <Input
                  placeholder="Mobile number (private to platform)"
                  value={listForm.phone_number}
                  onChange={(e) => setListForm({ ...listForm, phone_number: e.target.value })}
                  className="mt-1 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Driver / Operator Available?</Label>
                <select
                  value={listForm.operator_available ? "yes" : "no"}
                  onChange={(e) => setListForm({ ...listForm, operator_available: e.target.value === "yes" })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm"
                >
                  <option value="yes">Yes (Driver Available)</option>
                  <option value="no">No (Self-Driven Only)</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Village / District Location</Label>
                <Input
                  placeholder="e.g. Guntur, Andhra Pradesh"
                  value={listForm.location}
                  onChange={(e) => setListForm({ ...listForm, location: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsListModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleListEquipment} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">
              Publish Listing (Automatic)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRINTABLE AGREEMENT / CHALLAN MODAL */}
      <Dialog open={isAgreementModalOpen} onOpenChange={setIsAgreementModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  AgroVision Custom Hiring Handover Challan
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Standard Peer-to-Peer Agricultural Machinery Rental Agreement
                </DialogDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className="rounded-xl print:hidden flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Print Challan
              </Button>
            </div>
          </DialogHeader>

          {activeAgreementBooking && (
            <div className="space-y-4 py-2 text-xs text-slate-800 leading-relaxed font-sans">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Equipment Owner</p>
                  <p className="font-bold text-sm text-slate-900">{activeAgreementBooking.owner_name}</p>
                  <p className="text-slate-600 text-[11px]">Channel: P2P Encrypted Verified Link</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Booking Reference</p>
                  <p className="font-bold text-sm text-slate-900">#AGRO-{activeAgreementBooking.id}</p>
                  <p className="text-slate-600">Date: {activeAgreementBooking.created_at}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5">Billing Basis</th>
                      <th className="p-2.5">Operator</th>
                      <th className="p-2.5 text-right">Agreed Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2.5 font-semibold">{activeAgreementBooking.equipment_name}</td>
                      <td className="p-2.5 capitalize">{activeAgreementBooking.units_booked} {activeAgreementBooking.billing_mode}s</td>
                      <td className="p-2.5">{activeAgreementBooking.with_operator ? "Driver Included" : "Self-Driven"}</td>
                      <td className="p-2.5 font-bold text-right">₹{activeAgreementBooking.total_amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-700 text-xs">Standard Handover Terms:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
                  <li>The machine is received in good operational condition without pre-existing hydraulic leaks.</li>
                  <li>Renter assumes responsibility for fuel unless marked as fuel-inclusive.</li>
                  <li>In case of mechanical breakdown on field, work clock is paused and owner is notified immediately.</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center font-bold text-xs">
                <div>
                  <div className="border-b border-slate-400 w-40 mx-auto mb-1"></div>
                  <p>Owner: {activeAgreementBooking.owner_name} Signature</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-40 mx-auto mb-1"></div>
                  <p>Renter Farmer Signature</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setIsAgreementModalOpen(false)} className="rounded-xl w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentRental;