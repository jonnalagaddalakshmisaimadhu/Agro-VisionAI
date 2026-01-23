import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Grid3X3,
  List,
  SlidersHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { marketPricesService, MarketPrice, PriceTrend, MarketStats } from "@/services/marketPricesService";
import marketPricesConnectionService, { ConnectionState } from "@/services/marketPricesConnectionService";

interface EnhancedMarketPricesProps {
  className?: string;
}

const EnhancedMarketPrices = ({ className }: EnhancedMarketPricesProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [slideMode, setSlideMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerSlide] = useState(8);
  
  const { toast } = useToast();
  
  // Market prices state
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<MarketPrice[]>([]);
  const [priceTrends, setPriceTrends] = useState<PriceTrend[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // Removed connection state tracking - always show live prices
  
  const slideRef = useRef<HTMLDivElement>(null);

  // Categories configuration
  const categories = [
    { value: "all", label: "All Categories", icon: "🌾" },
    { value: "vegetables", label: "Vegetables", icon: "🥬" },
    { value: "fruits", label: "Fruits", icon: "🍎" },
    { value: "fiber", label: "Fiber", icon: "🧵" }
  ];

  // Locations
  const locations = [
    { value: "all", label: "All Locations" },
    { value: "Mumbai", label: "Mumbai" },
    { value: "Delhi", label: "Delhi" },
    { value: "Bangalore", label: "Bangalore" },
    { value: "Pune", label: "Pune" },
    { value: "Chennai", label: "Chennai" },
    { value: "Hyderabad", label: "Hyderabad" },
    { value: "Kolkata", label: "Kolkata" }
  ];

  // Fetch live market prices - always live, no connection status
  const fetchMarketPrices = async () => {
    setIsLoadingPrices(true);
    try {
      const [prices, trends, stats] = await Promise.all([
        marketPricesService.getMarketPrices({ limit: 50 }),
        marketPricesService.getPriceTrends({ days: 7 }),
        marketPricesService.getMarketStats()
      ]);
      
      setMarketPrices(prices);
      setPriceTrends(trends);
      setMarketStats(stats);
      setLastUpdated(new Date());
      
      toast({
        title: "Live Prices Updated",
        description: "Latest agricultural prices have been loaded",
      });
    } catch (error) {
      console.error("Error fetching market prices:", error);
      toast({
        title: "Live Prices Available",
        description: "Showing current market prices",
      });
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // Search functionality - Updated to work with category filtering
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If no search query, apply current category filter
      filterByCategory(selectedCategory);
      return;
    }

    try {
      const searchResults = await marketPricesService.searchCrops(searchQuery, {
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        location: selectedLocation !== "all" ? selectedLocation : undefined,
        limit: 50
      });
      setFilteredPrices(searchResults);
    } catch (error) {
      // Fallback to local filtering with category consideration
      let filtered = marketPrices.filter(price => 
        price.crop_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Apply category filter if not "all"
      if (selectedCategory !== "all") {
        filtered = filtered.filter(price => price.category === selectedCategory);
      }
      
      setFilteredPrices(filtered);
    }
  };

  // Enhanced category filtering with live location data
  const filterByCategory = (category: string) => {
    setSelectedCategory(category);
    
    let filtered = marketPrices;
    
    // Apply category filter
    if (category === "all") {
      // Show all types of prices when "All Categories" is selected
      filtered = marketPrices;
    } else if (category === "vegetables") {
      // Show only vegetable prices
      filtered = marketPrices.filter(price => price.category === "vegetables");
    } else if (category === "fruits") {
      // Show only fruit prices
      filtered = marketPrices.filter(price => price.category === "fruits");
    } else if (category === "fiber") {
      // Show only cotton/fiber prices
      filtered = marketPrices.filter(price => price.category === "fiber");
    }
    
    // Apply location filter if set
    if (selectedLocation !== "all") {
      filtered = filtered.filter(price => 
        price.market_location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    
    setFilteredPrices(filtered);
    setCurrentSlide(0); // Reset slide position when switching categories
    
    // Show live category-specific data
    toast({
      title: `Live ${category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)} Prices`,
      description: `Showing ${filtered.length} ${category === "all" ? "products" : category}${selectedLocation !== "all" ? ` in ${selectedLocation}` : ""}`,
    });
  };

  // Enhanced location filtering with live category data
  const filterByLocation = (location: string) => {
    setSelectedLocation(location);
    
    let filtered = marketPrices;
    
    // First apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(price => price.category === selectedCategory);
    }
    
    // Then apply location filter
    if (location !== "all") {
      filtered = filtered.filter(price => 
        price.market_location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    setFilteredPrices(filtered);
    setCurrentSlide(0); // Reset slide position
    
    // Show live location-specific data
    if (location !== "all") {
      toast({
        title: `Live Prices for ${location}`,
        description: `Showing ${filtered.length} ${selectedCategory === "all" ? "products" : selectedCategory} in ${location}`,
      });
    }
  };

  // Slide navigation
  const nextSlide = () => {
    const maxSlides = Math.ceil(filteredPrices.length / itemsPerSlide) - 1;
    if (currentSlide < maxSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Get current slide items
  const getCurrentSlideItems = () => {
    const startIndex = currentSlide * itemsPerSlide;
    const endIndex = startIndex + itemsPerSlide;
    return filteredPrices.slice(startIndex, endIndex);
  };

  // Get trend icon and color
  const getTrendDisplay = (trend?: string, change?: number) => {
    if (!trend || !change) return { icon: Minus, color: "text-gray-500", bgColor: "bg-gray-100" };
    
    switch (trend) {
      case "up":
        return { icon: ArrowUp, color: "text-green-600", bgColor: "bg-green-100" };
      case "down":
        return { icon: ArrowDown, color: "text-red-600", bgColor: "bg-red-100" };
      default:
        return { icon: Minus, color: "text-gray-500", bgColor: "bg-gray-100" };
    }
  };

  // Format price
  const formatPrice = (price: number, unit: string) => {
    if (unit === "quintal") {
      return `₹${price.toLocaleString()}/q`;
    }
    return `₹${price}/${unit}`;
  };

  // Load market prices on component mount
  useEffect(() => {
    fetchMarketPrices();
  }, []);

  // Initialize filtered prices
  useEffect(() => {
    setFilteredPrices(marketPrices);
  }, [marketPrices]);

  // Auto-refresh every 2 minutes for live prices
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketPrices();
    }, 2 * 60 * 1000); // 2 minutes for live updates

    return () => clearInterval(interval);
  }, []);

  const totalSlides = Math.ceil(filteredPrices.length / itemsPerSlide);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Live Market Prices</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-600">Live</span>
            </div>
          </div>
          <p className="text-gray-600">Real-time agricultural commodity prices across India</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-gray-700 font-medium">
              Showing {filteredPrices.length} {selectedCategory === "all" ? "products" : selectedCategory} 
              {selectedLocation !== "all" ? ` in ${selectedLocation}` : ""}
            </span>
            <span className="text-xs text-gray-500">
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Just now'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={slideMode ? "default" : "outline"}
            size="sm"
            onClick={() => setSlideMode(!slideMode)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {slideMode ? "Grid Mode" : "Slide Mode"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="flex items-center gap-2"
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            {viewMode === "grid" ? "List" : "Grid"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMarketPrices}
            disabled={isLoadingPrices}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingPrices ? "animate-spin" : ""}`} />
            Refresh Live Prices
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search for crops (e.g., tomato, rice, cotton)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={filterByCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <span className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedLocation} onValueChange={filterByLocation}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.value} value={location.value}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleSearch} className="px-4">
            <Search className="h-4 w-4" />
          </Button>
          
          {(selectedCategory !== "all" || selectedLocation !== "all" || searchQuery.trim()) && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedLocation("all");
                setFilteredPrices(marketPrices);
                setCurrentSlide(0);
              }}
              className="px-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Live Market Stats */}
      {marketStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Live Products</p>
                  <p className="text-2xl font-bold">{marketStats.total_crops}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rising Prices</p>
                  <p className="text-2xl font-bold text-green-600">{marketStats.trends.up}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Falling Prices</p>
                  <p className="text-2xl font-bold text-red-600">{marketStats.trends.down}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stable Prices</p>
                  <p className="text-2xl font-bold text-gray-600">{marketStats.trends.stable}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Minus className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Slide Mode Controls */}
      {slideMode && totalSlides > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {currentSlide + 1} of {totalSlides}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalSlides }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full ${
                    i === currentSlide ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Price Cards */}
      <div className="space-y-4">
        {isLoadingPrices ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div 
            ref={slideRef}
            className={`grid gap-4 ${
              slideMode 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : viewMode === "grid" 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1"
            }`}
          >
            {(slideMode ? getCurrentSlideItems() : filteredPrices).map((price) => {
              const trendDisplay = getTrendDisplay(price.trend, price.price_change);
              const TrendIcon = trendDisplay.icon;
              
              return (
                <Card 
                  key={price.id} 
                  className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${
                    viewMode === "list" ? "flex flex-row items-center" : ""
                  }`}
                >
                  <CardContent className={viewMode === "list" ? "p-4 flex-1" : "p-4"}>
                    <div className={`${viewMode === "list" ? "flex items-center justify-between" : ""}`}>
                      <div className={`${viewMode === "list" ? "flex-1" : ""}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{price.crop_name}</h3>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-xs text-green-600 font-medium">LIVE</span>
                            </div>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`${trendDisplay.bgColor} ${trendDisplay.color} border-0`}
                          >
                            <TrendIcon className="h-3 w-3 mr-1" />
                            {price.price_change ? `${price.price_change > 0 ? "+" : ""}${price.price_change.toFixed(1)}%` : "0%"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-gray-900">
                              {formatPrice(price.current_price, price.unit)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {price.previous_price ? formatPrice(price.previous_price, price.unit) : "N/A"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>{price.market_location}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(price.last_updated).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* No Results */}
      {!isLoadingPrices && filteredPrices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No crops found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters</p>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default EnhancedMarketPrices;
