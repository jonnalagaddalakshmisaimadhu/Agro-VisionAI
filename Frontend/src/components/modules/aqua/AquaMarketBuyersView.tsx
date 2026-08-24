import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Users, DollarSign, FileText, Search, Briefcase, Truck } from "lucide-react";

// Mock Data
const MARKET_PRICES = [
    { species: "Vannamei Shrimp (40 Count)", price: "₹380/kg", trend: "up", change: "+12%" },
    { species: "Vannamei Shrimp (60 Count)", price: "₹290/kg", trend: "up", change: "+5%" },
    { species: "Tilapia (Live)", price: "₹140/kg", trend: "stable", change: "0%" },
    { species: "Rohu (1kg+)", price: "₹160/kg", trend: "down", change: "-2%" },
    { species: "Catfish", price: "₹110/kg", trend: "up", change: "+4%" },
];

const BUYER_REQUESTS = [
    { id: "BR-101", buyer: "Global Seafoods Ltd", region: "Mumbai, MH", requirement: "5 Tons Vannamei", type: "Urgent", price: "₹390/kg" },
    { id: "BR-102", buyer: "FreshCatch Exports", region: "Kochi, KL", requirement: "2 Tons Tilapia", type: "Regular", price: "₹135/kg" },
    { id: "BR-103", buyer: "Local Market Union", region: "Nellore, AP", requirement: "500kg Rohu", type: "Immediate", price: "Best Quote" },
];

const CONTRACTS = [
    { id: "CN-2025-001", party: "Global Seafoods Ltd", type: "Supply Agreement", status: "Active", date: "Jan 15, 2025" },
    { id: "CN-2024-089", party: "AquaFeeds Corp", type: "Feed Supply", status: "Active", date: "Dec 10, 2024" },
    { id: "CN-2024-055", party: "FreshCatch Export", type: "Harvest Sale", status: "Completed", date: "Nov 01, 2024" },
];

export const AquaMarketBuyersView = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Market & Buyers</h2>
                <p className="text-slate-500 mt-2">Connect with buyers, track prices, and manage sales contracts.</p>
            </div>

            <Tabs defaultValue="prices" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-slate-100/80 backdrop-blur rounded-xl mb-6">
                    <TabsTrigger value="prices" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                        Live Prices
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                        Buyer Requests
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                        Sell Harvest
                    </TabsTrigger>
                    <TabsTrigger value="bulk" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                        Bulk Orders
                    </TabsTrigger>
                    <TabsTrigger value="contracts" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                        Contracts
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB: LIVE PRICES --- */}
                <TabsContent value="prices" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Market Overview Cards */}
                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium opacity-90">Shrimp Index</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">₹340.50</div>
                                <div className="flex items-center mt-1 text-blue-100">
                                    <ArrowUpRight className="h-4 w-4 mr-1" /> +2.4% this week
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-none shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium text-slate-500">Fish Index</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-slate-900">₹145.00</div>
                                <div className="flex items-center mt-1 text-emerald-600">
                                    <ArrowUpRight className="h-4 w-4 mr-1" /> +0.8% this week
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-none shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium text-slate-500">Export Vol</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-slate-900">12.5 T</div>
                                <div className="flex items-center mt-1 text-slate-400">
                                    <span className="text-sm">Daily Average</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Regional Market Prices</CardTitle>
                            <CardDescription>Live updates from major aquaculture hubs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Species</TableHead>
                                        <TableHead>Current Price</TableHead>
                                        <TableHead>Trend</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {MARKET_PRICES.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.species}</TableCell>
                                            <TableCell>{item.price}</TableCell>
                                            <TableCell>
                                                <div className={`flex items-center ${item.trend === 'up' ? 'text-emerald-600' :
                                                        item.trend === 'down' ? 'text-rose-600' : 'text-slate-500'
                                                    }`}>
                                                    {item.trend === 'up' ? <ArrowUpRight className="h-4 w-4 mr-1" /> :
                                                        item.trend === 'down' ? <ArrowDownRight className="h-4 w-4 mr-1" /> :
                                                            <TrendingUp className="h-4 w-4 mr-1" />}
                                                    {item.change}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">Details</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB: BUYER REQUESTS --- */}
                <TabsContent value="requests" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {BUYER_REQUESTS.map((request) => (
                            <Card key={request.id} className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <Badge variant={request.type === 'Urgent' ? 'destructive' : 'secondary'}>
                                            {request.type}
                                        </Badge>
                                        <span className="text-xs text-slate-400 font-mono">{request.id}</span>
                                    </div>
                                    <CardTitle className="mt-2 text-lg">{request.buyer}</CardTitle>
                                    <CardDescription>{request.region}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Requirement</span>
                                        <span className="font-medium">{request.requirement}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-1">
                                        <span className="text-slate-500">Offer Price</span>
                                        <span className="font-bold text-emerald-600">{request.price}</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Send Offer</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* --- TAB: SELL HARVEST --- */}
                <TabsContent value="sell" className="space-y-6">
                    <div className="max-w-2xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle>Post Harvest for Sale</CardTitle>
                                <CardDescription>Create a listing to reach verified buyers instantly.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-sm font-medium">Species</span>
                                        <Input placeholder="e.g. Vannamei" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-sm font-medium">Quantity (Tons)</span>
                                        <Input placeholder="e.g. 5" type="number" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-sm font-medium">Harvest Date</span>
                                        <Input type="date" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-sm font-medium">Expected Price (₹/kg)</span>
                                        <Input placeholder="e.g. 350" type="number" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-sm font-medium">Count / Size</span>
                                    <Input placeholder="e.g. 40 Count" />
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700 border border-blue-100">
                                    <Briefcase className="h-4 w-4 inline mr-2" />
                                    Your listing will be visible to 500+ verified exporters and local buyers.
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">Publish Listing</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- TAB: BULK ORDERS --- */}
                <TabsContent value="bulk">
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                        <Truck className="h-16 w-16 text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700">Large Scale Logistics</h3>
                        <p className="text-slate-500 max-w-md text-center mt-2">
                            For orders exceeding 10 Tons, use our bulk logistics service for guaranteed transport and insurance.
                        </p>
                        <Button className="mt-6" variant="outline">Contact Sales Team</Button>
                    </div>
                </TabsContent>

                {/* --- TAB: CONTRACTS --- */}
                <TabsContent value="contracts">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Digital Contracts</CardTitle>
                            <CardDescription>Manage your legal agreements and payment milestones.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {CONTRACTS.map((contract) => (
                                    <div key={contract.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{contract.party}</p>
                                                <p className="text-sm text-slate-500">{contract.type} • {contract.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant="outline" className={cn(
                                                "border-0",
                                                contract.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                                            )}>{contract.status}</Badge>
                                            <Button variant="ghost" size="sm">View</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Utility for Badge classNames
import { cn } from "@/lib/utils";
