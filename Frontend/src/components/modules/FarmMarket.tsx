import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Search, 
  Filter,
  Star,
  Package,
  Leaf,
  Bug,
  Plus,
  Minus,
  Trash2,
  PlusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FarmMarket = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const { toast } = useToast();

  const products = [
    // Fertilizers
    {
      id: "1",
      name: "NPK Organic Fertilizer",
      category: "fertilizer",
      price: 850,
      unit: "25kg bag",
      rating: 4.5,
      image: "🌱",
      description: "Complete nutrition for all crops",
      stock: 50,
      seller: "AgriSupply Co."
    },
    {
      id: "2",
      name: "Urea Fertilizer",
      category: "fertilizer",
      price: 650,
      unit: "50kg bag",
      rating: 4.2,
      image: "💎",
      description: "High nitrogen content for leafy growth",
      stock: 25,
      seller: "FarmTech Ltd."
    },
    {
      id: "3",
      name: "Phosphate Fertilizer",
      category: "fertilizer",
      price: 720,
      unit: "25kg bag",
      rating: 4.3,
      image: "⚪",
      description: "Essential for root development",
      stock: 35,
      seller: "GrowMax"
    },
    // Seeds
    {
      id: "4",
      name: "Hybrid Tomato Seeds",
      category: "seeds",
      price: 450,
      unit: "100g pack",
      rating: 4.7,
      image: "🍅",
      description: "High yield, disease resistant variety",
      stock: 100,
      seller: "SeedMaster"
    },
    {
      id: "5",
      name: "Basmati Rice Seeds",
      category: "seeds",
      price: 320,
      unit: "1kg pack",
      rating: 4.6,
      image: "🌾",
      description: "Premium quality aromatic rice",
      stock: 75,
      seller: "Heritage Seeds"
    },
    {
      id: "6",
      name: "Wheat Seeds (HD-2967)",
      category: "seeds",
      price: 280,
      unit: "1kg pack",
      rating: 4.4,
      image: "🌾",
      description: "High protein wheat variety",
      stock: 60,
      seller: "AgriSeeds Pro"
    },
    {
      id: "7",
      name: "Onion Seeds",
      category: "seeds",
      price: 380,
      unit: "250g pack",
      rating: 4.5,
      image: "🧅",
      description: "Long storage variety",
      stock: 80,
      seller: "VegSeeds Inc."
    },
    // Pest Control
    {
      id: "8",
      name: "Neem Oil Pesticide",
      category: "pest-control",
      price: 250,
      unit: "500ml bottle",
      rating: 4.8,
      image: "🌿",
      description: "Organic pest control solution",
      stock: 45,
      seller: "BioProtect"
    },
    {
      id: "9",
      name: "Fungicide Spray",
      category: "pest-control",
      price: 420,
      unit: "1L bottle",
      rating: 4.3,
      image: "🧪",
      description: "Protects against fungal diseases",
      stock: 30,
      seller: "CropGuard"
    },
    {
      id: "10",
      name: "Insecticide Powder",
      category: "pest-control",
      price: 340,
      unit: "500g pack",
      rating: 4.1,
      image: "⚗️",
      description: "Controls aphids and caterpillars",
      stock: 40,
      seller: "PestAway"
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === "all" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
    toast({
      title: "Added to Cart",
      description: "Item has been added to your cart",
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart",
    });
  };

  const removeAllFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
    toast({
      title: "Removed from Cart",
      description: "All items removed from your cart",
    });
  };

  const addAllToCart = () => {
    const newCart = { ...cart };
    filteredProducts.forEach(product => {
      if (product.stock > 0) {
        newCart[product.id] = (newCart[product.id] || 0) + 1;
      }
    });
    setCart(newCart);
    toast({
      title: "Added All to Cart",
      description: `${filteredProducts.length} items added to your cart`,
    });
  };

  const clearCart = () => {
    setCart({});
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart",
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "fertilizer": return <Leaf className="h-4 w-4" />;
      case "seeds": return <Package className="h-4 w-4" />;
      case "pest-control": return <Bug className="h-4 w-4" />;
      default: return <ShoppingCart className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 lg:pl-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market Place</h1>
          <p className="text-muted-foreground mt-2">
            Everything you need for successful farming
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={addAllToCart}
            disabled={filteredProducts.length === 0}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add All to Cart
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({getCartItemCount()})
                {getCartItemCount() > 0 && (
                  <Badge className="ml-2">₹{getCartTotal().toLocaleString()}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-96">
              <SheetHeader>
                <SheetTitle>Shopping Cart ({getCartItemCount()} items)</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {Object.keys(cart).length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {Object.entries(cart).map(([productId, quantity]) => {
                        const product = products.find(p => p.id === productId);
                        if (!product) return null;
                        
                        return (
                          <div key={productId} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className="text-2xl">{product.image}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{product.name}</h4>
                              <p className="text-sm text-muted-foreground">₹{product.price} per {product.unit}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCart(productId)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addToCart(productId)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeAllFromCart(productId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total:</span>
                        <span className="text-xl font-bold">₹{getCartTotal().toLocaleString()}</span>
                      </div>
                      <div className="space-y-2">
                        <Button className="w-full" size="lg">
                          Proceed to Checkout
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={clearCart}
                        >
                          Clear Cart
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="fertilizer">Fertilizers</SelectItem>
            <SelectItem value="seeds">Seeds</SelectItem>
            <SelectItem value="pest-control">Pest Control</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-card-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-success to-primary">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-sm text-muted-foreground">Total Products</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-primary-glow">
                <Leaf className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{products.filter(p => p.category === 'fertilizer').length}</p>
            <p className="text-sm text-muted-foreground">Fertilizers</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-accent to-warning">
                <Package className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{products.filter(p => p.category === 'seeds').length}</p>
            <p className="text-sm text-muted-foreground">Seeds</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card-shadow">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-warning to-accent">
                <Bug className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{products.filter(p => p.category === 'pest-control').length}</p>
            <p className="text-sm text-muted-foreground">Pest Control</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border-0 shadow-card-shadow hover:shadow-hover-lift transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{product.image}</div>
                <div className="flex items-center space-x-1">
                  {getCategoryIcon(product.category)}
                  <Badge variant="secondary" className="text-xs">
                    {product.category.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">({Math.floor(Math.random() * 100) + 50} reviews)</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary">₹{product.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">per {product.unit}</p>
                  </div>
                  <Badge variant={product.stock > 20 ? "secondary" : "destructive"}>
                    {product.stock} in stock
                  </Badge>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Sold by: {product.seller}</p>
                  <Button 
                    className="w-full" 
                    onClick={() => addToCart(product.id)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                    {cart[product.id] && (
                      <Badge className="ml-2">{cart[product.id]}</Badge>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default FarmMarket;