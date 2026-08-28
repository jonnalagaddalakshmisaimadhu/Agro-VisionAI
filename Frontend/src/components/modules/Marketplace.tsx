import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Search,
  Filter,
  TrendingUp,
  MapPin,
  Phone,
  Package,
  Calendar,
  Users,
  Trash2,
  RefreshCw,
  MessageCircle,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  PlusCircle,
  Upload,
  Image as ImageIcon,
  Video,
  Eye,
  Layers,
  X,
  Handshake,
  Clock,
  Inbox,
  CheckCircle2,
  Store,
  Tag,
  Leaf
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnhancedMarketPrices from "./EnhancedMarketPrices";
import { MarketplaceChatModal } from "./MarketplaceChatModal";

interface ProductItem {
  id: number;
  name: string;
  category: string;
  price_per_unit: number;
  unit: string;
  stock_quantity: number;
  seller_name: string;
  phone_number: string;
  location: string;
  is_organic: boolean;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  harvest_date: string;
  image_url?: string;
  video_url?: string;
  description: string;
}

interface InboxItem {
  product_id: number;
  product_name: string;
  category: string;
  price_per_unit: number;
  unit: string;
  stock_quantity: number;
  seller_name: string;
  location: string;
  image_url?: string;
  phone_number: string;
  last_message: string;
  last_sender: string;
  is_offer: boolean;
  offered_price?: number;
  offered_quantity?: number;
  offer_status: string;
  last_activity?: string;
  total_messages: number;
}

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("buy");
  const { toast } = useToast();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Seller Inbox State
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  // Modal State for Inspecting Crop Photos / Card Proof
  const [inspectProduct, setInspectProduct] = useState<ProductItem | null>(null);

  // Real-time Chat & WebRTC Calling Modal State
  const [chatProduct, setChatProduct] = useState<ProductItem | null>(null);

  // Form state for listing products
  const [productForm, setProductForm] = useState({
    name: "",
    category: "vegetables",
    price: "",
    unit: "kg",
    quantity: "500",
    seller_name: "",
    phoneNumber: "9848012345",
    location: "Guntur, Andhra Pradesh",
    harvestDate: new Date().toISOString().split("T")[0],
    description: "",
    is_organic: false,
    image_url: "",
    video_url: ""
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedPriceData, setSuggestedPriceData] = useState<any>(null);

  // Fetch products from backend database
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      let url = "/api/marketplace/products?";
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedLocation !== "all") params.append("location", selectedLocation);
      if (organicOnly) params.append("organic_only", "true");
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(url + params.toString());
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch seller inbox messages
  const fetchInbox = async () => {
    setIsLoadingInbox(true);
    try {
      const res = await fetch("/api/marketplace/inbox");
      if (res.ok) {
        const data = await res.json();
        setInboxItems(data);
      }
    } catch (e) {
      console.error("Error loading inbox:", e);
    } finally {
      setIsLoadingInbox(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchInbox();
  }, [selectedCategory, selectedLocation, organicOnly]);

  // Query suggested Mandi benchmark price when product name changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (productForm.name.trim().length >= 3) {
        try {
          const res = await fetch(`/api/marketplace/suggested-price/${encodeURIComponent(productForm.name.trim())}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestedPriceData(data);
          }
        } catch (e) {
          console.error("Price suggestion error:", e);
        }
      } else {
        setSuggestedPriceData(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [productForm.name]);

  // Handle Image Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setProductForm(prev => ({ ...prev, image_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Video Upload
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setVideoPreview(result);
        setProductForm(prev => ({ ...prev, video_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle product listing submit
  const handleListProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.quantity) {
      toast({
        title: "Missing Information",
        description: "Please enter product name, price, and available stock.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const emojiMap: Record<string, string> = {
        vegetables: "🍅",
        grains: "🌾",
        fruits: "🍊",
        spices: "🌶️",
        dairy: "🥛"
      };

      const payload = {
        name: productForm.name,
        category: productForm.category,
        price_per_unit: parseFloat(productForm.price),
        unit: productForm.unit,
        stock_quantity: parseFloat(productForm.quantity),
        seller_name: productForm.seller_name || "Verified Farmer",
        phone_number: productForm.phoneNumber || "9876543210",
        location: productForm.location || "India",
        is_organic: productForm.is_organic,
        harvest_date: productForm.harvestDate,
        description: productForm.description || "Farm-fresh produce harvested with sustainable agricultural practices.",
        image_url: productForm.image_url || emojiMap[productForm.category] || "📦",
        video_url: productForm.video_url || null
      };

      const res = await fetch("/api/marketplace/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        toast({
          title: "🌾 Produce Listed Successfully!",
          description: `${created.name} is now live with photo/video proof.`
        });

        setProductForm({
          name: "",
          category: "vegetables",
          price: "",
          unit: "kg",
          quantity: "500",
          seller_name: "",
          phoneNumber: "9848012345",
          location: "Guntur, Andhra Pradesh",
          harvestDate: new Date().toISOString().split("T")[0],
          description: "",
          is_organic: false,
          image_url: "",
          video_url: ""
        });
        setImagePreview(null);
        setVideoPreview(null);
        setSuggestedPriceData(null);
        setActiveTab("buy");
        fetchProducts();
        fetchInbox();
      } else {
        toast({
          title: "Listing Failed",
          description: "Could not save product. Please try again.",
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error("Listing error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`/api/marketplace/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Listing Removed", description: "Product removed from marketplace." });
        fetchProducts();
        fetchInbox();
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const isImageSrc = (url?: string) => {
    if (!url) return false;
    return url.startsWith("data:image") || url.startsWith("http") || url.startsWith("/uploads");
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 🌾 Clean & Pleasant Hero Banner Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/15 border border-emerald-500/20 p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 border-0 text-[10px] sm:text-xs px-2 py-0.5 font-semibold shadow-xs">
                <Store className="h-3 w-3 mr-1" />
                Direct Farm Trade
              </Badge>
              <Badge variant="outline" className="text-[10px] sm:text-xs text-muted-foreground border-emerald-500/30 bg-background/50">
                0% Fee • Verified
              </Badge>
            </div>
            <h1 className="text-base sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
              Agricultural Marketplace
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground max-w-2xl leading-normal line-clamp-1 sm:line-clamp-none">
              Connect directly with farmers, negotiate wholesale crop rates via in-app chat, and inspect live field media proof.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchProducts(); fetchInbox(); }}
              disabled={isLoadingProducts}
              className="h-8 sm:h-9 px-3 gap-1.5 text-xs font-medium bg-background hover:bg-muted/80 shadow-xs border-border/80"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingProducts ? "animate-spin text-emerald-600" : ""}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => setActiveTab("sell")}
              className="h-8 sm:h-9 px-3.5 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Sell Crop
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="p-1 bg-muted/40 border rounded-xl shadow-xs">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-transparent gap-1 p-0 h-auto">
            <TabsTrigger
              value="buy"
              className="h-10 gap-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-xl transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              Buy Produce
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              className="h-10 gap-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-xl transition-all"
            >
              <Package className="h-4 w-4" />
              Sell Produce
            </TabsTrigger>
            <TabsTrigger
              value="inbox"
              className="h-10 gap-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-xl transition-all relative"
            >
              <Inbox className="h-4 w-4" />
              Messages
              {inboxItems.length > 0 && (
                <span className="ml-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                  {inboxItems.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="prices"
              className="h-10 gap-2 font-semibold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-xl transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              Mandi Prices
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 🛒 BUY PRODUCE TAB */}
        <TabsContent value="buy" className="space-y-6">
          {/* Neat & Balanced Filter Toolbar */}
          <Card className="border border-border/80 shadow-xs bg-card/70 backdrop-blur rounded-2xl overflow-hidden">
            <CardContent className="p-3.5 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search crop, seller, or town..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
                    className="pl-10 h-11 bg-background border-border/80 rounded-xl text-sm"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 bg-background border-border/80 rounded-xl text-sm font-medium">
                    <Filter className="h-4 w-4 mr-2 text-emerald-600" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="grains">Grains & Cereals</SelectItem>
                    <SelectItem value="fruits">Fresh Fruits</SelectItem>
                    <SelectItem value="spices">Spices & Condiments</SelectItem>
                    <SelectItem value="dairy">Dairy & Ghee</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="h-11 bg-background border-border/80 rounded-xl text-sm font-medium">
                    <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="Karnataka">Karnataka</SelectItem>
                    <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                    <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                    <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setOrganicOnly(!organicOnly)}
                  className={`h-11 font-semibold text-xs sm:text-sm rounded-xl gap-2 transition-all ${
                    organicOnly
                      ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:text-white"
                      : "bg-background hover:bg-emerald-50 text-foreground border-border/80"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {organicOnly ? "🌱 Organic Only (Active)" : "🌱 Filter Organic"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {isLoadingProducts ? (
            <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed">
              <RefreshCw className="h-10 w-10 text-emerald-600 mx-auto mb-3 animate-spin" />
              <p className="text-muted-foreground font-medium text-sm">Loading verified farm produce...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-1">
              {products.map((product) => {
                return (
                  <div key={product.id} className="relative group">
                    {/* 3D Stack Layer Background */}
                    <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl transform translate-x-1.5 translate-y-1.5 border border-emerald-500/20 transition-transform duration-300 group-hover:translate-x-2 group-hover:translate-y-2 pointer-events-none -z-10 shadow-xs" />

                    <Card className="border border-border/80 bg-card rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                      <div>
                        {/* Top Media Header */}
                        {isImageSrc(product.image_url) ? (
                          <div
                            className="relative h-44 w-full bg-muted cursor-pointer overflow-hidden group/img"
                            onClick={() => setInspectProduct(product)}
                          >
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[2px]">
                              <Eye className="h-4 w-4" /> View Full Field Photo
                            </div>
                            <Badge className="absolute top-3 left-3 bg-black/70 text-white backdrop-blur-md border-0 text-[10px] font-semibold flex items-center gap-1">
                              <Layers className="h-3 w-3 text-emerald-400" /> Proof Attached
                            </Badge>
                            {product.is_organic && (
                              <Badge className="absolute top-3 right-3 bg-emerald-600 text-white border-0 text-[10px] font-semibold">
                                🌱 100% Organic
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div
                            className="p-4 bg-muted/30 border-b flex items-start justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setInspectProduct(product)}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-3xl">{product.image_url || "📦"}</span>
                              <div>
                                <h3 className="font-bold text-base leading-tight text-foreground">{product.name}</h3>
                                <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
                              </div>
                            </div>
                            {product.is_organic && (
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                🌱 Organic
                              </Badge>
                            )}
                          </div>
                        )}

                        <CardContent className="p-4 space-y-3">
                          {isImageSrc(product.image_url) && (
                            <div>
                              <h3 className="font-bold text-base leading-tight text-foreground">{product.name}</h3>
                              <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
                            </div>
                          )}

                          <div className="flex items-baseline justify-between pt-0.5">
                            <div>
                              <span className="text-2xl font-black text-emerald-700">₹{product.price_per_unit}</span>
                              <span className="text-xs text-muted-foreground font-medium"> / {product.unit}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                              {product.stock_quantity} {product.unit} left
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>

                          <div className="space-y-1 text-xs pt-2 border-t">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-emerald-600" /> Seller:
                              </span>
                              <span className="font-semibold text-foreground">{product.seller_name}</span>
                            </div>

                            <div className="flex items-center justify-between text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Location:
                              </span>
                              <span className="font-medium text-foreground">{product.location}</span>
                            </div>

                            {product.harvest_date && (
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Harvested:
                                </span>
                                <span className="font-medium text-foreground">{product.harvest_date}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </div>

                      {/* Actions Bar */}
                      <div className="p-4 pt-0 space-y-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs font-semibold flex items-center justify-center gap-1.5 bg-muted/60 hover:bg-emerald-50 hover:text-emerald-700 h-8 rounded-xl transition-colors"
                          onClick={() => setInspectProduct(product)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Inspect Crop Photos & Details
                        </Button>

                        <div className="flex items-center gap-2">
                          {/* Expanded In-App Chat Rectangle Button */}
                          <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-xs text-xs h-10 rounded-xl transition-all"
                            size="sm"
                            onClick={() => setChatProduct(product)}
                          >
                            <MessageCircle className="h-4 w-4" />
                            In-App Chat & Deal
                          </Button>

                          {/* Green Button with White Phone Logo on the Right */}
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-10 p-0 rounded-xl shadow-xs flex items-center justify-center shrink-0 transition-transform active:scale-95"
                            size="sm"
                            title="Start Free Web Voice Call"
                            onClick={() => setChatProduct(product)}
                          >
                            <Phone className="h-4 w-4 fill-white text-white" />
                          </Button>

                          {/* Delete Listing Action */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-8 p-0 rounded-xl"
                            title="Remove Listing"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}

          {products.length === 0 && !isLoadingProducts && (
            <div className="text-center py-16 bg-muted/10 rounded-2xl border border-dashed">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold">No crop listings found</h3>
              <p className="text-muted-foreground text-sm mt-1">Try changing your filters or be the first to sell your harvest!</p>
              <Button onClick={() => setActiveTab("sell")} className="mt-4 gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700">
                <PlusCircle className="h-4 w-4" /> List Produce Now
              </Button>
            </div>
          )}
        </TabsContent>

        {/* 📨 SELLER INBOX & INCOMING BUYER MESSAGES TAB */}
        <TabsContent value="inbox" className="space-y-6">
          <Card className="border border-border/80 shadow-xs bg-card rounded-2xl overflow-hidden">
            <CardHeader className="p-5 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Inbox className="h-5 w-5 text-emerald-600" />
                  Seller Inquiries & Deal Inbox
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  View and reply to incoming wholesale trade inquiries and price offers from buyers
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={fetchInbox} className="gap-1.5 text-xs font-semibold h-9 rounded-xl">
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingInbox ? "animate-spin text-emerald-600" : ""}`} /> Refresh Inbox
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {isLoadingInbox ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 text-emerald-600 mx-auto mb-2 animate-spin" />
                  <p className="text-muted-foreground text-xs font-medium">Loading incoming buyer inquiries...</p>
                </div>
              ) : inboxItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inboxItems.map((item) => (
                    <Card
                      key={item.product_id}
                      className="border border-emerald-500/30 bg-card rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-emerald-500/60 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b pb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.image_url && !item.image_url.startsWith("data:") ? item.image_url : "🌾"}</span>
                            <div>
                              <h4 className="font-bold text-sm leading-tight text-foreground">{item.product_name}</h4>
                              <span className="text-xs font-semibold text-emerald-700">
                                Listed at ₹{item.price_per_unit}/{item.unit} • {item.seller_name}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-muted-foreground flex items-center gap-1 rounded-lg">
                            <Clock className="h-3 w-3" />
                            {item.last_activity ? new Date(item.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent"}
                          </Badge>
                        </div>

                        {item.is_offer ? (
                          <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                            <span className="font-bold flex items-center gap-1.5">
                              <Handshake className="h-4 w-4 text-emerald-600" /> Price Offer Received:
                            </span>
                            <Badge className="bg-emerald-600 text-white font-extrabold text-xs">
                              ₹{item.offered_price}/{item.unit}
                            </Badge>
                          </div>
                        ) : null}

                        <div className="bg-muted/30 p-3 rounded-xl text-xs space-y-1">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> {item.last_sender}:
                          </span>
                          <p className="text-muted-foreground line-clamp-2 leading-relaxed">{item.last_message}</p>
                        </div>
                      </div>

                      {/* Reply & Call Actions */}
                      <div className="pt-3 flex items-center gap-2 border-t mt-3">
                        <Button
                          size="sm"
                          className="flex-1 font-bold text-xs gap-1.5 shadow-xs h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                            setChatProduct({
                              id: item.product_id,
                              name: item.product_name,
                              category: item.category,
                              price_per_unit: item.price_per_unit,
                              unit: item.unit,
                              stock_quantity: item.stock_quantity,
                              seller_name: item.seller_name,
                              phone_number: item.phone_number,
                              location: item.location,
                              is_organic: false,
                              is_verified: true,
                              rating: 5.0,
                              total_reviews: 12,
                              harvest_date: "",
                              image_url: item.image_url,
                              description: ""
                            });
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Open Live Chat & Reply
                        </Button>

                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-10 p-0 rounded-xl shadow-xs flex items-center justify-center shrink-0"
                          title="Start Free Web Voice Call"
                          onClick={() => {
                            setChatProduct({
                              id: item.product_id,
                              name: item.product_name,
                              category: item.category,
                              price_per_unit: item.price_per_unit,
                              unit: item.unit,
                              stock_quantity: item.stock_quantity,
                              seller_name: item.seller_name,
                              phone_number: item.phone_number,
                              location: item.location,
                              is_organic: false,
                              is_verified: true,
                              rating: 5.0,
                              total_reviews: 12,
                              harvest_date: "",
                              image_url: item.image_url,
                              description: ""
                            });
                          }}
                        >
                          <Phone className="h-4 w-4 fill-white text-white" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/10 rounded-2xl border border-dashed">
                  <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h4 className="font-semibold text-base">No incoming buyer inquiries yet</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    When buyers chat with you about your listed crops or send price offers, they will appear here in real-time!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📦 SELL PRODUCE TAB */}
        <TabsContent value="sell" className="space-y-6">
          <Card className="max-w-2xl mx-auto border border-border/80 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b p-5">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <PlusCircle className="h-5 w-5 text-emerald-600" />
                List Your Harvest with Field Photos & Video Proof
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Buyers buy faster when they see real crop photos and field videos from your farm
              </p>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleListProduct} className="space-y-5">
                {/* 📸 Top Upload Media Section */}
                <div className="p-4 rounded-xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-emerald-600" />
                      Upload Farm Crop Photo & Video Proof *
                    </label>
                    <span className="text-[11px] text-muted-foreground">JPG, PNG, WebP or MP4</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative border border-border/80 rounded-xl p-3 bg-background flex flex-col items-center justify-center text-center hover:border-emerald-500 transition-colors">
                      {imagePreview ? (
                        <div className="relative w-full h-28 rounded-lg overflow-hidden">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setImagePreview(null); setProductForm(p => ({ ...p, image_url: "" })); }}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center w-full py-3">
                          <ImageIcon className="h-7 w-7 text-emerald-600 mb-1" />
                          <span className="text-xs font-semibold text-foreground">Upload Crop Photo</span>
                          <span className="text-[10px] text-muted-foreground">Click to select photo</span>
                          <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                        </label>
                      )}
                    </div>

                    <div className="relative border border-border/80 rounded-xl p-3 bg-background flex flex-col items-center justify-center text-center hover:border-emerald-500 transition-colors">
                      {videoPreview ? (
                        <div className="relative w-full h-28 rounded-lg overflow-hidden">
                          <video src={videoPreview} className="w-full h-full object-cover" controls />
                          <button
                            type="button"
                            onClick={() => { setVideoPreview(null); setProductForm(p => ({ ...p, video_url: "" })); }}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center w-full py-3">
                          <Video className="h-7 w-7 text-emerald-600 mb-1" />
                          <span className="text-xs font-semibold text-foreground">Upload Field Video</span>
                          <span className="text-[10px] text-muted-foreground">Short harvest/field video</span>
                          <input type="file" accept="video/*" onChange={handleVideoFileChange} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Crop Name & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Crop / Product Name *</label>
                    <Input
                      placeholder="e.g. Fresh Red Tomatoes, Basmati Rice"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      required
                      className="mt-1 h-11 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Category *</label>
                    <Select
                      value={productForm.category}
                      onValueChange={(val) => setProductForm({ ...productForm, category: val })}
                    >
                      <SelectTrigger className="mt-1 h-11 rounded-xl font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegetables">Vegetables</SelectItem>
                        <SelectItem value="grains">Grains & Cereals</SelectItem>
                        <SelectItem value="fruits">Fresh Fruits</SelectItem>
                        <SelectItem value="spices">Spices & Condiments</SelectItem>
                        <SelectItem value="dairy">Dairy & Ghee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Mandi Price Alert */}
                {suggestedPriceData && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-emerald-800">
                        💡 Mandi Benchmark: Average price is ₹{suggestedPriceData.suggested_price}/{suggestedPriceData.unit}
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        {suggestedPriceData.recommendation} (Ref: {suggestedPriceData.reference_mandi})
                      </p>
                    </div>
                  </div>
                )}

                {/* Price & Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Your Price (₹) *</label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 35"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required
                      className="mt-1 h-11 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Unit</label>
                    <Select
                      value={productForm.unit}
                      onValueChange={(val) => setProductForm({ ...productForm, unit: val })}
                    >
                      <SelectTrigger className="mt-1 h-11 rounded-xl font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Per Kilogram (kg)</SelectItem>
                        <SelectItem value="quintal">Per Quintal (100 kg)</SelectItem>
                        <SelectItem value="ton">Per Metric Ton</SelectItem>
                        <SelectItem value="dozen">Per Dozen</SelectItem>
                        <SelectItem value="liter">Per Liter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Available Stock *</label>
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      value={productForm.quantity}
                      onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                      required
                      className="mt-1 h-11 rounded-xl"
                    />
                  </div>
                </div>

                {/* Seller & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Farmer / Seller Name</label>
                    <Input
                      placeholder="e.g. Ramesh Kumar"
                      value={productForm.seller_name}
                      onChange={(e) => setProductForm({ ...productForm, seller_name: e.target.value })}
                      className="mt-1 h-11 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Farmer Contact (100% Confidential)</label>
                    <Input
                      type="tel"
                      placeholder="Phone (kept private to platform)"
                      value={productForm.phoneNumber}
                      onChange={(e) => setProductForm({ ...productForm, phoneNumber: e.target.value })}
                      required
                      className="mt-1 h-11 rounded-xl"
                    />
                  </div>
                </div>

                {/* Location & Harvest Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Village / Mandi Location</label>
                    <Input
                      placeholder="e.g. Guntur, Andhra Pradesh"
                      value={productForm.location}
                      onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                      className="mt-1 h-11 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Harvest Date</label>
                    <Input
                      type="date"
                      value={productForm.harvestDate}
                      onChange={(e) => setProductForm({ ...productForm, harvestDate: e.target.value })}
                      className="mt-1 h-11 rounded-xl"
                    />
                  </div>
                </div>

                {/* Organic Checkbox */}
                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="organicCheck"
                    checked={productForm.is_organic}
                    onChange={(e) => setProductForm({ ...productForm, is_organic: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="organicCheck" className="text-sm font-medium cursor-pointer text-foreground">
                    🌱 Certified Organic / Chemical-Free Harvest
                  </label>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Quality Details / Storage Info</label>
                  <Textarea
                    placeholder="Describe variety, moisture level, grade (e.g. Grade A, freshly harvested, clean grain)..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                    className="mt-1 rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold shadow-md gap-2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-4 w-4" />
                  {isSubmitting ? "Publishing Listing..." : "Publish Crop Listing with Photo/Video"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📈 MANDI PRICES TAB */}
        <TabsContent value="prices">
          <EnhancedMarketPrices />
        </TabsContent>
      </Tabs>

      {/* 🔍 Interactive Crop Inspection & Proof Modal */}
      <Dialog open={!!inspectProduct} onOpenChange={(open) => !open && setInspectProduct(null)}>
        {inspectProduct && (
          <DialogContent className="max-w-xl bg-card border border-emerald-500/30 p-6 rounded-2xl shadow-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-600" />
                  {inspectProduct.name} — Farm & Quality Proof
                </DialogTitle>
              </div>
              <DialogDescription>
                Verified listing from {inspectProduct.location} • Listed by {inspectProduct.seller_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Media Display: Photo or Video */}
              {isImageSrc(inspectProduct.image_url) ? (
                <div className="h-64 w-full rounded-2xl overflow-hidden border shadow-sm bg-black/5">
                  <img
                    src={inspectProduct.image_url}
                    alt={inspectProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : inspectProduct.video_url ? (
                <div className="h-64 w-full rounded-2xl overflow-hidden border shadow-sm bg-black">
                  <video src={inspectProduct.video_url} className="w-full h-full object-cover" controls autoPlay />
                </div>
              ) : (
                <div className="h-44 w-full rounded-2xl bg-muted/40 flex flex-col items-center justify-center text-center p-4 border border-dashed">
                  <span className="text-5xl mb-2">{inspectProduct.image_url || "📦"}</span>
                  <p className="text-xs text-muted-foreground">Standard Produce Listing without High-Res Field Upload</p>
                </div>
              )}

              {/* Quality & Lot Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/80">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Price</span>
                  <p className="font-extrabold text-emerald-700 text-base">₹{inspectProduct.price_per_unit}/{inspectProduct.unit}</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/80">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Stock</span>
                  <p className="font-bold text-foreground text-sm">{inspectProduct.stock_quantity} {inspectProduct.unit}</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/80">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Organic</span>
                  <p className={`font-bold text-sm ${inspectProduct.is_organic ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {inspectProduct.is_organic ? "🌱 Certified" : "Conventional"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/80">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Harvested</span>
                  <p className="font-semibold text-foreground text-xs mt-0.5">{inspectProduct.harvest_date || "Fresh"}</p>
                </div>
              </div>

              {/* Description & Storage advice */}
              <div className="p-3.5 bg-muted/20 rounded-xl text-xs space-y-1 border border-border/60">
                <span className="font-bold text-foreground">Farmer Note & Quality Details:</span>
                <p className="text-muted-foreground leading-relaxed">{inspectProduct.description}</p>
              </div>

              {/* Action: Expanded In-App Chat Rectangle Button & Green Web Call Button */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 py-5 text-base shadow-sm rounded-xl"
                  onClick={() => {
                    const prod = inspectProduct;
                    setInspectProduct(null);
                    setChatProduct(prod);
                  }}
                >
                  <MessageCircle className="h-5 w-5" />
                  In-App Chat & Deal Negotiation
                </Button>

                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-[52px] w-[52px] p-0 rounded-xl shadow-sm flex items-center justify-center shrink-0"
                  title="Start Free Web Voice Call"
                  onClick={() => {
                    const prod = inspectProduct;
                    setInspectProduct(null);
                    setChatProduct(prod);
                  }}
                >
                  <Phone className="h-6 w-6 fill-white text-white" />
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* 💬 Real-Time In-App Chat & Free WebRTC Audio Calling Drawer */}
      <MarketplaceChatModal
        product={chatProduct}
        isOpen={!!chatProduct}
        onClose={() => {
          setChatProduct(null);
          fetchInbox();
        }}
      />
    </div>
  );
};

export default Marketplace;