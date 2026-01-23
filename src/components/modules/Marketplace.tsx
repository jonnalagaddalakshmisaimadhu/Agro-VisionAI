import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Search,
  Filter,
  TrendingUp,
  MapPin,
  Phone,
  Star,
  Package,
  DollarSign,
  Calendar,
  Users,
  Trash2,
  Edit,
  Save,
  X,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  TrendingUp as TrendingUpIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { marketPricesService, MarketPrice, PriceTrend, MarketStats } from "@/services/marketPricesService";
import EnhancedMarketPrices from "./EnhancedMarketPrices";

interface ListedProduct {
  id: number;
  name: string;
  category: string;
  price: string;
  seller: string;
  location: string;
  rating: number;
  stock: string;
  image: string;
  verified: boolean;
  organic: boolean;
  harvestDate: string;
  description: string;
  listedAt: string;
  imageFile?: string; // URL for the uploaded image
  videoFile?: string; // URL for the uploaded video
  phoneNumber?: string;
}

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("buy");
  const { toast } = useToast();

  // Market prices state
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [priceTrends, setPriceTrends] = useState<PriceTrend[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("all");

  // Form state for listing products
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    harvestDate: "",
    description: "",
    image: null as File | null,
    video: null as File | null,
    phoneNumber: ""
  });

  // State for user's listed products
  const [userListedProducts, setUserListedProducts] = useState<ListedProduct[]>([]);

  // State for editing
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    harvestDate: "",
    description: "",
    image: null as File | null,
    video: null as File | null
  });

  // Fetch market prices data
  const fetchMarketPrices = async () => {
    setIsLoadingPrices(true);
    try {
      const [prices, trends, stats] = await Promise.all([
        marketPricesService.getVegetablePrices({ limit: 20 }),
        marketPricesService.getPriceTrends({ days: 7 }),
        marketPricesService.getMarketStats()
      ]);

      setMarketPrices(prices);
      setPriceTrends(trends);
      setMarketStats(stats);
      setLastUpdated(new Date());

      // Check if we got fallback data (no verified prices)
      const hasVerifiedPrices = prices.some(price => price.is_verified);
      if (hasVerifiedPrices) {
        toast({
          title: "Market Prices Updated",
          description: "Latest vegetable prices have been loaded",
        });
      }
    } catch (error) {
      console.error("Error fetching market prices:", error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to backend. Please ensure the server is running.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // Refresh market prices
  const refreshMarketPrices = async () => {
    setIsLoadingPrices(true);
    try {
      await marketPricesService.refreshMarketPrices();
      await fetchMarketPrices();

      toast({
        title: "Refreshing Prices",
        description: "Market prices are being updated from live sources",
      });
    } catch (error) {
      console.error("Error refreshing market prices:", error);
      toast({
        title: "Error",
        description: "Failed to refresh market prices",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // Load market prices on component mount
  useEffect(() => {
    fetchMarketPrices();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketPrices();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Initial products (these will be combined with user listed products)
  const initialProducts: ListedProduct[] = [
    {
      id: 1,
      name: "Fresh Tomatoes",
      category: "vegetables",
      price: "₹45/kg",
      seller: "Rajesh Kumar",
      location: "Pune, Maharashtra",
      rating: 4.8,
      stock: "500 kg available",
      image: "🍅",
      verified: true,
      organic: true,
      harvestDate: "2024-01-15",
      description: "Fresh, organic tomatoes grown with natural fertilizers",
      listedAt: "2024-01-10"
    },
    {
      id: 2,
      name: "Basmati Rice",
      category: "grains",
      price: "₹85/kg",
      seller: "Farmers Collective",
      location: "Haryana",
      rating: 4.9,
      stock: "10 tons available",
      image: "🌾",
      verified: true,
      organic: false,
      harvestDate: "2024-01-20",
      description: "Premium quality basmati rice, aged for 6 months",
      listedAt: "2024-01-12"
    },
    {
      id: 3,
      name: "Fresh Onions",
      category: "vegetables",
      price: "₹25/kg",
      seller: "Sunita Devi",
      location: "Nashik, Maharashtra",
      rating: 4.6,
      stock: "2 tons available",
      image: "🧅",
      verified: true,
      organic: false,
      harvestDate: "2024-01-18",
      description: "Fresh onions, good for storage",
      listedAt: "2024-01-14"
    },
    {
      id: 4,
      name: "Organic Wheat",
      category: "grains",
      price: "₹32/kg",
      seller: "Green Valley Farm",
      location: "Punjab",
      rating: 4.7,
      stock: "5 tons available",
      image: "🌾",
      verified: true,
      organic: true,
      harvestDate: "2024-01-25",
      description: "100% organic wheat, chemical-free farming",
      listedAt: "2024-01-16"
    }
  ];

  // Combine initial products with user listed products
  const products = [...initialProducts, ...userListedProducts];

  // Filter market prices based on selected location
  const filteredMarketPrices = marketPrices.filter(price =>
    selectedLocation === "all" ||
    price.market_location.toLowerCase().includes(selectedLocation.toLowerCase())
  );

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get product emoji based on category
  const getProductEmoji = (category: string) => {
    switch (category) {
      case 'vegetables': return '🥬';
      case 'grains': return '🌾';
      case 'fruits': return '🍎';
      case 'dairy': return '🥛';
      default: return '📦';
    }
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: string) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    if (e.target.files && e.target.files[0]) {
      setProductForm(prev => ({
        ...prev,
        [type]: e.target.files ? e.target.files[0] : null
      }));
    }
  };


  // Handle product listing
  const handleListProduct = () => {
    if (!productForm.name || !productForm.category || !productForm.price || !productForm.quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newProduct: ListedProduct = {
      id: Date.now(), // Simple ID generation
      name: productForm.name,
      category: productForm.category,
      price: `₹${productForm.price}/kg`,
      seller: "You", // Current user
      location: "Your Location",
      rating: 5.0, // New product gets 5 stars
      stock: `${productForm.quantity} kg available`,
      image: getProductEmoji(productForm.category),
      verified: false, // User products start as unverified
      organic: productForm.description.toLowerCase().includes('organic'),
      harvestDate: productForm.harvestDate,
      description: productForm.description,
      listedAt: new Date().toISOString().split('T')[0],
      imageFile: productForm.image ? URL.createObjectURL(productForm.image) : undefined,
      videoFile: productForm.video ? URL.createObjectURL(productForm.video) : undefined,
      phoneNumber: productForm.phoneNumber
    };

    setUserListedProducts(prev => [...prev, newProduct]);

    // Reset form
    setProductForm({
      name: "",
      category: "",
      price: "",
      quantity: "",
      harvestDate: "",
      description: "",
      image: null,
      video: null,
      phoneNumber: ""
    });

    toast({
      title: "Product Listed Successfully!",
      description: `${newProduct.name} has been added to the marketplace`,
    });

    // Switch to buy tab to show the listed product
    setActiveTab("buy");
  };

  // Handle deleting user listed product
  const handleDeleteProduct = (productId: number) => {
    setUserListedProducts(prev => prev.filter(product => product.id !== productId));
    toast({
      title: "Product Deleted",
      description: "Your product listing has been removed",
    });
  };

  // Handle edit form input changes
  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle starting edit mode
  const handleStartEdit = (product: ListedProduct) => {
    setEditingProductId(product.id);
    setEditForm({
      name: product.name,
      category: product.category,
      price: product.price.replace('₹', '').replace('/kg', ''),
      quantity: product.stock.replace(' kg available', ''),
      harvestDate: product.harvestDate,
      description: product.description,
      image: null,
      video: null
    });
  };

  // Handle saving edit
  const handleSaveEdit = () => {
    if (!editingProductId || !editForm.name || !editForm.category || !editForm.price || !editForm.quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setUserListedProducts(prev => prev.map(product =>
      product.id === editingProductId
        ? {
          ...product,
          name: editForm.name,
          category: editForm.category,
          price: `₹${editForm.price}/kg`,
          stock: `${editForm.quantity} kg available`,
          harvestDate: editForm.harvestDate,
          description: editForm.description,
          image: getProductEmoji(editForm.category),
          organic: editForm.description.toLowerCase().includes('organic')
        }
        : product
    ));

    setEditingProductId(null);
    setEditForm({
      name: "",
      category: "",
      price: "",
      quantity: "",
      harvestDate: "",
      description: ""
    });

    toast({
      title: "Product Updated!",
      description: "Your product has been successfully updated",
    });
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditForm({
      name: "",
      category: "",
      price: "",
      quantity: "",
      harvestDate: "",
      description: ""
    });
  };

  return (
    <div className="space-y-6 lg:pl-4 pt-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-r from-primary to-primary-glow rounded-lg">
          <ShoppingCart className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Smart Marketplace</h1>
          <p className="text-muted-foreground">Buy and sell agricultural products directly with farmers</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-2">
          <TabsTrigger value="buy">Buy Products</TabsTrigger>
          <TabsTrigger value="sell">Sell Products</TabsTrigger>
          <TabsTrigger value="prices">Market Prices</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products or sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="vegetables">Vegetables</SelectItem>
                <SelectItem value="grains">Grains</SelectItem>
                <SelectItem value="fruits">Fruits</SelectItem>
                <SelectItem value="dairy">Dairy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="border-0 shadow-card-shadow hover:shadow-hover-lift transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">
                        {product.imageFile ? (
                          <img src={product.imageFile} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          product.image
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {product.verified && (
                            <Badge variant="secondary" className="text-xs">
                              ✓ Verified
                            </Badge>
                          )}
                          {product.organic && (
                            <Badge className="bg-success/10 text-success border-success/20 text-xs">
                              🌿 Organic
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{product.price}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Seller:</span>
                      <span className="font-medium">{product.seller}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-warning fill-current" />
                      <span className="text-sm font-medium">{product.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{product.location}</span>
                  </div>

                  <div className="flex items-center space-x-1 text-sm text-success">
                    <Package className="h-3 w-3" />
                    <span>{product.stock}</span>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <ShoppingCart className="mr-1 h-3 w-3" />
                      Buy Now
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => product.phoneNumber && (window.location.href = `tel:${product.phoneNumber}`)}>
                      <Phone className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sell" className="space-y-6">
          <>
            <Card className="border-0 shadow-card-shadow">
              <CardHeader>
                <CardTitle>List Your Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Product Name *</label>
                    <Input
                      placeholder="e.g., Fresh Tomatoes"
                      value={productForm.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category *</label>
                    <Select value={productForm.category} onValueChange={(value) => handleFormChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegetables">Vegetables</SelectItem>
                        <SelectItem value="grains">Grains</SelectItem>
                        <SelectItem value="fruits">Fruits</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    placeholder="e.g., 9876543210"
                    value={productForm.phoneNumber}
                    onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Upload Image</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'image')}
                        className="cursor-pointer"
                      />
                    </div>
                    {productForm.image && <p className="text-xs text-green-600 mt-1">Image selected: {productForm.image.name}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Upload Video</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileChange(e, 'video')}
                        className="cursor-pointer"
                      />
                    </div>
                    {productForm.video && <p className="text-xs text-green-600 mt-1">Video selected: {productForm.video.name}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Price per kg (₹) *</label>
                    <Input
                      type="number"
                      placeholder="45"
                      value={productForm.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quantity Available *</label>
                    <Input
                      placeholder="500 kg"
                      value={productForm.quantity}
                      onChange={(e) => handleFormChange('quantity', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Harvest Date</label>
                    <Input
                      type="date"
                      value={productForm.harvestDate}
                      onChange={(e) => handleFormChange('harvestDate', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Describe your product quality, farming methods, etc."
                    value={productForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </div>

                <Button className="w-full" onClick={handleListProduct}>
                  <Package className="mr-2 h-4 w-4" />
                  List Product
                </Button>
              </CardContent>
            </Card>

            {/* User's Listed Products */}
            {userListedProducts.length > 0 && (
              <Card className="border-0 shadow-card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Your Listed Products ({userListedProducts.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userListedProducts.map((product) => (
                      <div key={product.id} className="border rounded-lg">
                        {editingProductId === product.id ? (
                          // Edit Mode
                          <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium">Edit Product</h4>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  className="bg-success hover:bg-success/90"
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Product Name *</label>
                                <Input
                                  placeholder="e.g., Fresh Tomatoes"
                                  value={editForm.name}
                                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Category *</label>
                                <Select value={editForm.category} onValueChange={(value) => handleEditFormChange('category', value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="vegetables">Vegetables</SelectItem>
                                    <SelectItem value="grains">Grains</SelectItem>
                                    <SelectItem value="fruits">Fruits</SelectItem>
                                    <SelectItem value="dairy">Dairy</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium">Price per kg (₹) *</label>
                                <Input
                                  type="number"
                                  placeholder="45"
                                  value={editForm.price}
                                  onChange={(e) => handleEditFormChange('price', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Quantity Available *</label>
                                <Input
                                  placeholder="500 kg"
                                  value={editForm.quantity}
                                  onChange={(e) => handleEditFormChange('quantity', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Harvest Date</label>
                                <Input
                                  type="date"
                                  value={editForm.harvestDate}
                                  onChange={(e) => handleEditFormChange('harvestDate', e.target.value)}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Description</label>
                              <Input
                                placeholder="Describe your product quality, farming methods, etc."
                                value={editForm.description}
                                onChange={(e) => handleEditFormChange('description', e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-4">
                              <div className="text-2xl">{product.image}</div>
                              <div>
                                <h4 className="font-medium">{product.name}</h4>
                                <p className="text-sm text-muted-foreground">{product.price} • {product.stock}</p>
                                <p className="text-xs text-muted-foreground">Listed on: {product.listedAt}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartEdit(product)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        </TabsContent>

        <TabsContent value="prices" className="space-y-6">
          <EnhancedMarketPrices />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Marketplace;