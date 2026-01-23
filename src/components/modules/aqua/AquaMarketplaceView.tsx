import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Search, Filter, Star, Truck, ShieldCheck, FileText, ShoppingCart, Package } from "lucide-react";

// Mock Data for Marketplace
const SEED_PRODUCTS = [
    { id: 1, name: "Vannamei Shrimp PL 10", supplier: "Coastal Hatcheries", price: "₹0.45 / pc", rating: 4.8, image: "shrimp-seed" },
    { id: 2, name: "Monodon (Tiger) Seed", supplier: "Royal Marine", price: "₹0.60 / pc", rating: 4.6, image: "tiger-seed" },
    { id: 3, name: "GIFT Tilapia Fry", supplier: "Freshwater Farms", price: "₹4.00 / pc", rating: 4.5, image: "tilapia-seed" },
    { id: 4, name: "Rohu Jayanti Strain", supplier: "State Hatchery", price: "₹2.50 / pc", rating: 4.7, image: "rohu-seed" },
];

const FEED_PRODUCTS = [
    { id: 1, name: "Grower Pellets (35% Protein)", supplier: "Aquamas Feeds", price: "₹85 / kg", type: "Shrimp", rating: 4.9 },
    { id: 2, name: "Starter Crumble", supplier: "NutriSea", price: "₹110 / kg", type: "Shrimp", rating: 4.8 },
    { id: 3, name: "Floating Fish Feed (4mm)", supplier: "EcoFeeds", price: "₹45 / kg", type: "Fish", rating: 4.3 },
    { id: 4, name: "Probiotic Enriched Feed", supplier: "BioTech Aqua", price: "₹150 / kg", type: "Specialty", rating: 5.0 },
];

const EQUIPMENT_PRODUCTS = [
    { id: 1, name: "Paddle Wheel Aerator (2HP)", supplier: "AeroTech", price: "₹22,000", rating: 4.7, stock: "In Stock" },
    { id: 2, name: "DO Meter (Digital)", supplier: "LabEquip", price: "₹8,500", rating: 4.5, stock: "Low Stock" },
    { id: 3, name: "pH Testing Kit", supplier: "ChemTest", price: "₹450", rating: 4.2, stock: "In Stock" },
    { id: 4, name: "Auto-Feeder Solar", supplier: "SmartFarm", price: "₹15,000", rating: 4.9, stock: "Pre-order" },
];

export const AquaMarketplaceView = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Aqua Marketplace</h2>
                    <p className="text-slate-500 mt-2">Sourcing quality inputs & equipment for your farm.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input type="search" placeholder="Search products..." className="pl-9 bg-white" />
                    </div>
                    <Button variant="outline" size="icon">
                        <ShoppingCart className="h-5 w-5 text-slate-700" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="seed" className="w-full">
                <div className="overflow-x-auto pb-2">
                    <TabsList className="inline-flex w-full md:w-auto h-auto p-1 bg-slate-100/80 backdrop-blur rounded-xl">
                        <TabsTrigger value="seed" className="py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                            Fish & Shrimp Seed
                        </TabsTrigger>
                        <TabsTrigger value="feed" className="py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                            Feed & Nutrition
                        </TabsTrigger>
                        <TabsTrigger value="equipment" className="py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                            Equipment & Tools
                        </TabsTrigger>
                        <TabsTrigger value="medicine" className="py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                            Medicines
                        </TabsTrigger>
                        <TabsTrigger value="suppliers" className="py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                            Verified Suppliers
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="py-2.5 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                            My Orders
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- TAB: SEED --- */}
                <TabsContent value="seed" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {SEED_PRODUCTS.map((product) => (
                            <ProductCard key={product.id} product={product} category="Seed" />
                        ))}
                    </div>
                    <PromoBanner
                        title="Bulk Order Discount"
                        text="Get 5% off on orders above 1 Lakh PL"
                        color="bg-blue-600"
                    />
                </TabsContent>

                {/* --- TAB: FEED --- */}
                <TabsContent value="feed" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {FEED_PRODUCTS.map((product) => (
                            <ProductCard key={product.id} product={product} category="Feed" />
                        ))}
                    </div>
                </TabsContent>

                {/* --- TAB: EQUIPMENT --- */}
                <TabsContent value="equipment" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {EQUIPMENT_PRODUCTS.map((product) => (
                            <ProductCard key={product.id} product={product} category="Equipment" />
                        ))}
                    </div>
                </TabsContent>

                {/* --- TAB: MEDICINE --- */}
                <TabsContent value="medicine" className="mt-6">
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                        <ShieldCheck className="h-16 w-16 text-emerald-200 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900">Health & Medicines</h3>
                        <p className="text-slate-500 max-w-md text-center mt-2">
                            Browse our curated list of antibiotics, probiotics, and minerals approved for aquaculture use.
                        </p>
                        <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700">Browse Catalog</Button>
                    </div>
                </TabsContent>

                {/* --- TAB: SUPPLIERS --- */}
                <TabsContent value="suppliers" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SupplierCard name="Coastal Hatcheries" location="Nellore, AP" rating="4.8" verified={true} />
                        <SupplierCard name="Aquamas Feeds" location="Bhimavaram, AP" rating="4.9" verified={true} />
                        <SupplierCard name="AeroTech Industries" location="Chennai, TN" rating="4.7" verified={true} />
                    </div>
                </TabsContent>

                {/* --- TAB: ORDERS --- */}
                <TabsContent value="orders" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>Track your seed and feed shipments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">Order #AQ-2024-001</p>
                                            <p className="text-sm text-slate-500">100kg Grower Pellets • ₹8,500</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Delivered</Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">Order #AQ-2024-002</p>
                                            <p className="text-sm text-slate-500">2HP Aerator • ₹22,000</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">In Transit</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const ProductCard = ({ product, category }: { product: any, category: string }) => (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-lg transition-all group">
        <div className="aspect-square bg-slate-100 relative items-center justify-center flex">
            {/* Placeholder Image */}
            <ShoppingBag className="h-12 w-12 text-slate-300" />
            <Badge className="absolute top-3 right-3 bg-white/90 text-slate-800 hover:bg-white shadow-sm backdrop-blur">
                <Star className="h-3 w-3 text-yellow-500 mr-1 fill-yellow-500" /> {product.rating}
            </Badge>
        </div>
        <CardContent className="p-4">
            <div className="text-xs text-slate-500 mb-1">{product.supplier}</div>
            <h3 className="font-bold text-slate-900 mb-1 truncate">{product.name}</h3>
            <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-blue-700">{product.price}</span>
                <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">{category}</span>
            </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <Button className="w-full bg-slate-900 hover:bg-slate-800">Add to Cart</Button>
        </CardFooter>
    </Card>
);

const PromoBanner = ({ title, text, color }: { title: string, text: string, color: string }) => (
    <div className={`rounded-xl p-6 ${color} text-white relative overflow-hidden shadow-lg`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h3 className="text-2xl font-bold">{title}</h3>
                <p className="text-blue-100">{text}</p>
            </div>
            <Button variant="secondary" className="bg-white text-blue-900 font-bold hover:bg-blue-50">Shop Now</Button>
        </div>
        {/* Decor */}
        <div className="absolute right-0 top-0 h-full w-48 bg-white/10 skew-x-12 transform translate-x-12"></div>
    </div>
);

const SupplierCard = ({ name, location, rating, verified }: any) => (
    <Card className="hover:shadow-md transition-all">
        <CardContent className="p-6">
            <div className="flex items-start justify-between">
                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {name.charAt(0)}
                </div>
                {verified && <ShieldCheck className="h-5 w-5 text-emerald-500" />}
            </div>
            <h3 className="font-bold text-lg mt-4">{name}</h3>
            <div className="flex items-center text-sm text-slate-500 mt-1">
                <Truck className="h-4 w-4 mr-1" /> {location}
            </div>
            <div className="flex items-center text-sm font-medium text-slate-700 mt-4">
                <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" /> {rating} Rating
            </div>
        </CardContent>
        <CardFooter>
            <Button variant="outline" className="w-full">View Catalog</Button>
        </CardFooter>
    </Card>
)
