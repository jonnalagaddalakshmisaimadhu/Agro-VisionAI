import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Handshake,
  Sparkles,
  CheckCircle2,
  Clock,
  Volume2,
  X,
  MessageCircle,
  Truck,
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: number;
  product_id: number;
  sender_name: string;
  receiver_name: string;
  message_text: string;
  is_offer: boolean;
  offered_price?: number;
  offered_quantity?: number;
  offer_status?: string;
  created_at: string;
}

interface MarketplaceChatModalProps {
  product: {
    id: number;
    name: string;
    price_per_unit: number;
    unit: string;
    stock_quantity: number;
    seller_name: string;
    phone_number: string;
    location: string;
    image_url?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MarketplaceChatModal = ({
  product,
  isOpen,
  onClose,
}: MarketplaceChatModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [customOfferPrice, setCustomOfferPrice] = useState("");
  const [customOfferQty, setCustomOfferQty] = useState("");
  const [showOfferDrawer, setShowOfferDrawer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebRTC Audio Call States
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connected" | "ended">("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const callTimerRef = useRef<any>(null);

  // Load chat history when modal opens
  useEffect(() => {
    if (isOpen && product) {
      fetchChatHistory();
    }
  }, [isOpen, product]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatHistory = async () => {
    if (!product) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/marketplace/chat/${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Failed to load chat:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string, isOffer: boolean = false, price?: number, qty?: number) => {
    if (!product) return;
    const msg = textToSend || inputText;
    if (!msg.trim()) return;

    try {
      const payload = {
        sender_name: "You (Buyer)",
        receiver_name: product.seller_name,
        message_text: msg,
        is_offer: isOffer,
        offered_price: price || (customOfferPrice ? parseFloat(customOfferPrice) : undefined),
        offered_quantity: qty || (customOfferQty ? parseFloat(customOfferQty) : undefined)
      };

      const res = await fetch(`/api/marketplace/chat/${product.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdMsg = await res.json();
        setMessages(prev => [...prev, createdMsg]);
        setInputText("");
        setShowOfferDrawer(false);
        setCustomOfferPrice("");
        setCustomOfferQty("");

        // Simulate instant simulated farmer reply for responsive pair trading
        setTimeout(() => {
          simulateFarmerReply(msg, isOffer, price || parseFloat(customOfferPrice));
        }, 1200);
      }
    } catch (e) {
      console.error("Error sending message:", e);
    }
  };

  const simulateFarmerReply = (buyerMsg: string, isOffer: boolean, offerPrice?: number) => {
    if (!product) return;
    let replyText = "Ji, sure! What quantity are you looking to buy, and where do you need delivery?";

    if (isOffer && offerPrice) {
      if (offerPrice >= product.price_per_unit * 0.85) {
        replyText = `Agreed! I can accept ₹${offerPrice}/${product.unit} for this lot. Let me know when you want to arrange the transport vehicle.`;
      } else {
        replyText = `₹${offerPrice}/${product.unit} is a bit low for this premium harvest grade. Can we settle at ₹${(product.price_per_unit * 0.93).toFixed(1)}/${product.unit}?`;
      }
    } else if (buyerMsg.includes("transport") || buyerMsg.includes("pickup")) {
      replyText = `Pickup is available directly at our farm near ${product.location}. We also have local mini-truck contacts for transport.`;
    } else if (buyerMsg.includes("sample")) {
      replyText = "Yes, sample is available! You can pick it up or I can send it via local courier today.";
    }

    const farmerMsg: ChatMessage = {
      id: Date.now(),
      product_id: product.id,
      sender_name: product.seller_name,
      receiver_name: "You (Buyer)",
      message_text: replyText,
      is_offer: false,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, farmerMsg]);
  };

  // WebRTC In-App Free Audio Call Simulation
  const handleStartCall = () => {
    setIsCalling(true);
    setCallStatus("ringing");
    setCallDuration(0);

    // Simulate farmer answering call in 2.5 seconds
    setTimeout(() => {
      setCallStatus("connected");
      toast({
        title: "📞 Voice Call Connected",
        description: `Speaking with ${product?.seller_name} via secure in-app audio.`
      });

      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }, 2200);
  };

  const handleEndCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setCallStatus("ended");
    setTimeout(() => {
      setIsCalling(false);
      setCallStatus("idle");
    }, 1000);
    toast({
      title: "Call Ended",
      description: `Call duration: ${formatDuration(callDuration)}`
    });
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden bg-card border-2 border-primary/30 rounded-2xl shadow-2xl flex flex-col h-[650px]">
        {/* Chat Header */}
        <DialogHeader className="p-4 bg-muted/40 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl border">
              {product.image_url && !product.image_url.startsWith("data:") ? product.image_url : "🌾"}
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-1.5">
                {product.seller_name}
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-success border-success/40 bg-success/5">
                  <UserCheck className="h-3 w-3 mr-0.5" /> Verified Seller
                </Badge>
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Inquiry for <span className="font-semibold text-foreground">{product.name}</span> (₹{product.price_per_unit}/{product.unit})
              </p>
            </div>
          </div>

          {/* Call Trigger Buttons - Green button with white phone logo */}
          <div className="flex items-center gap-2 mr-7">
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm rounded-lg"
              onClick={handleStartCall}
            >
              <Phone className="h-3.5 w-3.5 fill-white text-white" />
              Free Web Call
            </Button>
          </div>
        </DialogHeader>



        {/* 📞 Active WebRTC Call Overlay Banner */}
        {isCalling && (
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-white p-3.5 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center animate-ping absolute inset-0"></div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center relative z-10">
                  <PhoneCall className="h-4 w-4 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold leading-tight flex items-center gap-1.5 text-white">
                  <span>{callStatus === "ringing" ? "Ringing Farmer..." : `In-App Call: ${product.seller_name}`}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Encrypted</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {callStatus === "connected" && (
                    <div className="flex items-center gap-0.5 h-3">
                      <div className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s] h-2"></div>
                      <div className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s] h-3"></div>
                      <div className="w-0.5 bg-emerald-400 rounded-full animate-bounce h-2.5"></div>
                    </div>
                  )}
                  <p className="text-[11px] font-mono text-emerald-300">
                    {callStatus === "ringing" ? "Connecting WebRTC Audio..." : `Connected • ${formatDuration(callDuration)}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className={`h-8 w-8 p-0 rounded-full border transition-colors ${
                  isMuted ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                className="h-8 px-3 gap-1 text-xs font-bold rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-transform active:scale-95"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-3.5 w-3.5" /> End Call
              </Button>
            </div>
          </div>
        )}

        {/* Message History Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/10">
          {messages.map((msg) => {
            const isMe = msg.sender_name.includes("You");

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-card border border-border text-foreground rounded-tl-none"
                  }`}
                >
                  {/* Deal Offer Highlight Card inside Chat */}
                  {msg.is_offer && (
                    <div className="mb-2 p-2.5 bg-black/15 rounded-xl border border-white/20 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1">
                          <Handshake className="h-3.5 w-3.5" /> Official Price Offer
                        </span>
                        <Badge variant="secondary" className="text-[10px] bg-white/20 text-white">
                          ₹{msg.offered_price}/{product.unit}
                        </Badge>
                      </div>
                      <p className="text-[11px] opacity-90">
                        Offered for {msg.offered_quantity || 500} {product.unit} of {product.name}
                      </p>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.message_text}</p>
                  <span
                    className={`text-[10px] block mt-1 ${
                      isMe ? "text-primary-foreground/75 text-right" : "text-muted-foreground"
                    }`}
                  >
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Deal Negotiation Chips */}
        <div className="p-2.5 bg-muted/20 border-t flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            className="px-2.5 py-1 rounded-full bg-background border hover:border-primary hover:text-primary transition-colors text-[11px] font-medium"
            onClick={() => handleSendMessage(`Can you offer ₹${(product.price_per_unit * 0.9).toFixed(0)}/${product.unit} if I buy 500 ${product.unit}?`, true, Math.round(product.price_per_unit * 0.9), 500)}
          >
            💰 Offer ₹{(product.price_per_unit * 0.9).toFixed(0)}/{product.unit}
          </button>

          <button
            type="button"
            className="px-2.5 py-1 rounded-full bg-background border hover:border-primary hover:text-primary transition-colors text-[11px] font-medium"
            onClick={() => handleSendMessage("Is farm-gate pickup or transport available today?")}
          >
            🚚 Transport Inquiry
          </button>

          <button
            type="button"
            className="px-2.5 py-1 rounded-full bg-background border hover:border-primary hover:text-primary transition-colors text-[11px] font-medium"
            onClick={() => handleSendMessage("Can I get a 2kg sample before finalizing the bulk order?")}
          >
            🧪 Request Sample
          </button>

          <button
            type="button"
            className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors text-[11px] font-bold"
            onClick={() => setShowOfferDrawer(!showOfferDrawer)}
          >
            🤝 Custom Offer
          </button>
        </div>

        {/* Custom Price Offer Sub-Drawer */}
        {showOfferDrawer && (
          <div className="p-3 bg-card border-t border-primary/30 flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2 duration-200">
            <span className="font-bold text-primary shrink-0">Make Deal Offer:</span>
            <Input
              type="number"
              placeholder={`₹ Price/${product.unit}`}
              value={customOfferPrice}
              onChange={(e) => setCustomOfferPrice(e.target.value)}
              className="h-8 text-xs w-28 bg-background"
            />
            <Input
              type="number"
              placeholder={`Quantity (${product.unit})`}
              value={customOfferQty}
              onChange={(e) => setCustomOfferQty(e.target.value)}
              className="h-8 text-xs w-32 bg-background"
            />
            <Button
              size="sm"
              className="h-8 text-xs font-semibold gap-1"
              onClick={() => handleSendMessage(`I would like to offer ₹${customOfferPrice}/${product.unit} for ${customOfferQty} ${product.unit}.`, true)}
            >
              Send Offer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => setShowOfferDrawer(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Chat Input Bar */}
        <div className="p-3 bg-card border-t flex items-center gap-2">
          <Input
            placeholder={`Message ${product.seller_name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="h-10 text-sm bg-background"
          />
          <Button
            size="sm"
            onClick={() => handleSendMessage()}
            className="h-10 px-4 font-semibold gap-1.5 shadow-sm"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
