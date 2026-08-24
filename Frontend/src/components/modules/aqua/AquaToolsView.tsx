import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Scale, TrendingUp, DollarSign, ArrowRight, RotateCcw } from "lucide-react";

export const AquaToolsView = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Farming Calculators</h2>
                <p className="text-slate-500 mt-2">Essential tools to optimize your farm's efficiency and profitability.</p>
            </div>

            <Tabs defaultValue="feed" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-slate-100/80 backdrop-blur rounded-xl mb-6">
                    <TabsTrigger value="feed" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                        <Scale className="w-4 h-4 mr-2" /> Feed Calculator
                    </TabsTrigger>
                    <TabsTrigger value="stocking" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                        <UsersIcon className="w-4 h-4 mr-2" /> Stocking Density
                    </TabsTrigger>
                    <TabsTrigger value="growth" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                        <TrendingUp className="w-4 h-4 mr-2" /> Growth Rate
                    </TabsTrigger>
                    <TabsTrigger value="profit" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                        <DollarSign className="w-4 h-4 mr-2" /> Cost & Profit
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB: FEED CALCULATOR --- */}
                <TabsContent value="feed">
                    <CalculatorCard
                        title="Daily Feed Calculator"
                        description="Calculate the optimal feed ration based on biomass and ABW."
                        icon={<Scale className="h-6 w-6 text-white" />}
                        color="bg-orange-500"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Total Biomass (Est. kg)</Label>
                                    <Input type="number" placeholder="e.g. 2000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Average Body Weight (g)</Label>
                                    <Input type="number" placeholder="e.g. 15" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Target FCR</Label>
                                    <Input type="number" placeholder="e.g. 1.2" defaultValue="1.2" />
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-6 flex flex-col justify-center items-center text-center border border-slate-100">
                                <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Recommended Ration</span>
                                <div className="text-5xl font-bold text-slate-800 my-4">-- <span className="text-2xl text-slate-400 font-normal">kg</span></div>
                                <Button className="w-full max-w-xs">Calculate</Button>
                            </div>
                        </div>
                    </CalculatorCard>
                </TabsContent>

                {/* --- TAB: STOCKING DENSITY --- */}
                <TabsContent value="stocking">
                    <CalculatorCard
                        title="Stocking Density Calculator"
                        description="Determine the ideal number of fry/PL to stock per unit area."
                        icon={<UsersIcon className="h-6 w-6 text-white" />}
                        color="bg-blue-500"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Pond Area (Sq. Meters)</Label>
                                    <Input type="number" placeholder="e.g. 4000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Harvest Size (g)</Label>
                                    <Input type="number" placeholder="e.g. 30" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Aeration Capacity (HP)</Label>
                                    <Input type="number" placeholder="e.g. 4" />
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-6 flex flex-col justify-center items-center text-center border border-slate-100">
                                <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Optimal Density</span>
                                <div className="text-5xl font-bold text-slate-800 my-4">-- <span className="text-2xl text-slate-400 font-normal">PL/m²</span></div>
                                <Button className="w-full max-w-xs">Calculate</Button>
                            </div>
                        </div>
                    </CalculatorCard>
                </TabsContent>

                {/* --- TAB: GROWTH RATE --- */}
                <TabsContent value="growth">
                    <CalculatorCard
                        title="Growth Rate (ADG) Estimator"
                        description="Track the Average Daily Growth of your crop."
                        icon={<TrendingUp className="h-6 w-6 text-white" />}
                        color="bg-emerald-500"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Previous Weight (g)</Label>
                                        <Input type="number" placeholder="e.g. 5" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Current Weight (g)</Label>
                                        <Input type="number" placeholder="e.g. 12" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Days Interval</Label>
                                    <Input type="number" placeholder="e.g. 7" />
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-6 flex flex-col justify-center items-center text-center border border-slate-100">
                                <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Average Daily Growth</span>
                                <div className="text-5xl font-bold text-slate-800 my-4">-- <span className="text-2xl text-slate-400 font-normal">g/day</span></div>
                                <Button className="w-full max-w-xs">Calculate</Button>
                            </div>
                        </div>
                    </CalculatorCard>
                </TabsContent>

                {/* --- TAB: PROFIT CALCULATOR --- */}
                <TabsContent value="profit">
                    <CalculatorCard
                        title="ROI & Profit Analyzer"
                        description="Forecast your financial returns based on current inputs and market rates."
                        icon={<DollarSign className="h-6 w-6 text-white" />}
                        color="bg-purple-500"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-700 border-b pb-2">Expenses</h4>
                                <div className="space-y-2">
                                    <Label>Seed Cost</Label>
                                    <Input type="number" placeholder="₹" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Feed Cost</Label>
                                    <Input type="number" placeholder="₹" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Operational (Power/Labor)</Label>
                                    <Input type="number" placeholder="₹" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-700 border-b pb-2">Revenue</h4>
                                <div className="space-y-2">
                                    <Label>Est. Biomass (kg)</Label>
                                    <Input type="number" placeholder="kg" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Exp. Market Price (₹/kg)</Label>
                                    <Input type="number" placeholder="₹" />
                                </div>
                                <Button variant="outline" className="w-full mt-8"> <RotateCcw className="w-4 h-4 mr-2" /> Reset Values</Button>
                            </div>
                            <div className="bg-slate-900 rounded-xl p-6 flex flex-col justify-between text-white shadow-xl">
                                <div>
                                    <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Net Profit</span>
                                    <div className="text-4xl font-bold text-emerald-400 my-2">₹ --</div>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">ROI</span>
                                    <div className="text-3xl font-bold text-blue-400 my-2">-- %</div>
                                </div>
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">Calculate Profit</Button>
                            </div>
                        </div>
                    </CalculatorCard>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const CalculatorCard = ({ title, description, icon, color, children }: any) => (
    <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className={`${color} text-white`}>
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    {icon}
                </div>
                <div>
                    <CardTitle className="text-xl">{title}</CardTitle>
                    <CardDescription className="text-blue-50">{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-8">
            {children}
        </CardContent>
    </Card>
);

const UsersIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
)
