import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, LineChart as LineChartIcon, Sprout, ShieldCheck, Activity, Pill, AlertTriangle, CheckCircle2 } from "lucide-react";

export const AquaFarmersView = () => {
    // State for Harvest Analysis
    const [harvestAnalyzed, setHarvestAnalyzed] = useState(false);
    const [analyzingHarvest, setAnalyzingHarvest] = useState(false);

    // State for Disease Analysis
    const [diseaseImage, setDiseaseImage] = useState<File | null>(null);
    const [analyzingDisease, setAnalyzingDisease] = useState(false);
    const [diseaseResult, setDiseaseResult] = useState<{
        name: string;
        causes: string[];
        precautions: string[];
        medicine: string;
    } | null>(null);

    const handleHarvestAnalyze = () => {
        setAnalyzingHarvest(true);
        // Simulate AI delay
        setTimeout(() => {
            setHarvestAnalyzed(true);
            setAnalyzingHarvest(false);
        }, 2000);
    };

    const handleDiseaseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDiseaseImage(e.target.files[0]);
            // Reset previous result when new image is uploaded
            setDiseaseResult(null);
        }
    };

    const handleDiseaseAnalyze = () => {
        if (!diseaseImage) return;
        setAnalyzingDisease(true);
        // Simulate AI delay
        setTimeout(() => {
            setDiseaseResult({
                name: "White Spot Syndrome",
                causes: [
                    "High stocking density stress",
                    "Rapid changes in water temperature",
                    "Poor water quality (low pH, high ammonia)"
                ],
                precautions: [
                    "Improve water quality management",
                    "Reduce biomass density",
                    "Implement strict biosecurity measures"
                ],
                medicine: "Immunostimulants & Probiotics"
            });
            setAnalyzingDisease(false);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Farm Management Suite</h2>
                <p className="text-slate-500 mt-2">AI-powered tools to optimize your harvest and protect your yield.</p>
            </div>

            <Tabs defaultValue="harvest" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-8">
                    <TabsTrigger value="harvest">Harvest Planner</TabsTrigger>
                    <TabsTrigger value="disease">Disease Management</TabsTrigger>
                </TabsList>

                {/* --- TAB 1: HARVEST PLANNER --- */}
                <TabsContent value="harvest" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Input Form */}
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-blue-600 mb-2">
                                    <Sprout className="h-5 w-5" />
                                    <span className="font-semibold uppercase tracking-wider text-xs">Planning AI</span>
                                </div>
                                <CardTitle>Harvest Strategy</CardTitle>
                                <CardDescription>Enter your farm details to get AI-driven species and profit recommendations.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Pond Size (Acres)</Label>
                                    <Input type="number" placeholder="e.g. 2.5" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Water Salinity (ppt)</Label>
                                    <Input type="number" placeholder="e.g. 15" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Investment Budget (₹)</Label>
                                    <Input type="number" placeholder="e.g. 500000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Harvest Duration</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3">3 Months (Short)</SelectItem>
                                            <SelectItem value="6">6 Months (Medium)</SelectItem>
                                            <SelectItem value="9">9+ Months (Long)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    size="lg"
                                    onClick={handleHarvestAnalyze}
                                    disabled={analyzingHarvest}
                                >
                                    {analyzingHarvest ? (
                                        <>
                                            <Activity className="mr-2 h-4 w-4 animate-spin" />
                                            Analyzing Market Trends...
                                        </>
                                    ) : (
                                        <>
                                            <LineChartIcon className="mr-2 h-4 w-4" />
                                            Analyze Profitability
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Analysis Result */}
                        {harvestAnalyzed && (
                            <Card className="border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white animate-in slide-in-from-right-10 duration-500">
                                <CardHeader>
                                    <CardTitle className="text-emerald-400 flex items-center gap-2">
                                        <CheckCircle2 className="h-6 w-6" />
                                        Recommended Strategy
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">Based on current market rates & your parameters</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div>
                                            <p className="text-sm text-slate-400">Best Species</p>
                                            <h3 className="text-2xl font-bold">L. Vannamei (Shrimp)</h3>
                                        </div>
                                        <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center text-2xl">
                                            🦐
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Param</span>
                                            <span className="text-slate-400">Projection</span>
                                        </div>
                                        <div className="flex justify-between font-mono text-lg">
                                            <span>Est. Yield</span>
                                            <span className="text-emerald-400">4.2 Tons</span>
                                        </div>
                                        <div className="flex justify-between font-mono text-lg">
                                            <span>Survival Rate</span>
                                            <span className="text-blue-400">85%</span>
                                        </div>
                                        <div className="flex justify-between font-mono text-lg border-t border-white/10 pt-2 mt-2">
                                            <span>Net Profit</span>
                                            <span className="text-yellow-400 font-bold">₹ 8.5 Lakhs</span>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 p-4 rounded-lg text-sm text-slate-300">
                                        <p className="font-semibold mb-1 text-emerald-300">AI Insight:</p>
                                        Current market demand for Vannamei is peaking. Your salinity level (15ppt) is optimal for high growth rates.
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="secondary" className="w-full">Download Detailed Report</Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* --- TAB 2: DISEASE MANAGEMENT --- */}
                <TabsContent value="disease" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Upload & Diagnose Section */}
                        <div className="space-y-6">
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-rose-500 mb-2">
                                        <ShieldCheck className="h-5 w-5" />
                                        <span className="font-semibold uppercase tracking-wider text-xs">Diagnostic AI</span>
                                    </div>
                                    <CardTitle>Symptom Checker</CardTitle>
                                    <CardDescription>Upload a clear photo of the affected catch. We combine visual data with your sensor readings.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Label htmlFor="picture">Evidence Photo</Label>
                                        <div className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${diseaseImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                                            <Input id="picture" type="file" className="hidden" onChange={handleDiseaseImageChange} accept="image/*" />
                                            <Label htmlFor="picture" className="cursor-pointer flex flex-col items-center">
                                                {diseaseImage ? (
                                                    <>
                                                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                                                        <span className="text-sm font-medium text-emerald-700">{diseaseImage.name}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                                        <span className="text-sm font-medium text-slate-600">Click to upload image</span>
                                                        <span className="text-xs text-slate-400 mt-1">JPG, PNG supported</span>
                                                    </>
                                                )}
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Live Sensor Context</h4>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-white p-2 rounded shadow-sm">
                                                <div className="text-xs text-slate-500">pH</div>
                                                <div className="font-bold text-slate-800">7.8</div>
                                            </div>
                                            <div className="bg-white p-2 rounded shadow-sm">
                                                <div className="text-xs text-slate-500">Temp</div>
                                                <div className="font-bold text-slate-800">28°C</div>
                                            </div>
                                            <div className="bg-white p-2 rounded shadow-sm">
                                                <div className="text-xs text-slate-500">Ammonia</div>
                                                <div className="font-bold text-rose-500">High</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full bg-rose-600 hover:bg-rose-700"
                                        size="lg"
                                        onClick={handleDiseaseAnalyze}
                                        disabled={!diseaseImage || analyzingDisease}
                                    >
                                        {analyzingDisease ? (
                                            <>
                                                <Activity className="mr-2 h-4 w-4 animate-spin" />
                                                Scanning Pathogens...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                Diagnose Issue
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* Diagnosis Result */}
                        {diseaseResult && (
                            <Card className="border-none shadow-lg animate-in fade-in duration-500 h-fit">
                                <CardHeader className="bg-rose-50 rounded-t-lg border-b border-rose-100">
                                    <CardTitle className="text-rose-700 flex items-center gap-2">
                                        <AlertTriangle className="h-6 w-6" />
                                        Diagnosis: {diseaseResult.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">

                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">1</span>
                                            Root Causes
                                        </h3>
                                        <ul className="list-disc list-inside text-slate-600 text-sm pl-2 space-y-1">
                                            {diseaseResult.causes.map((cause, i) => (
                                                <li key={i}>{cause}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">2</span>
                                            Precautions & Remedy
                                        </h3>
                                        <ul className="list-disc list-inside text-slate-600 text-sm pl-2 space-y-1">
                                            {diseaseResult.precautions.map((p, i) => (
                                                <li key={i}>{p}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <div className="flex items-start gap-3">
                                            <Pill className="h-6 w-6 text-blue-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-blue-800">Recommended Treatment</h4>
                                                <p className="text-blue-600 text-sm mt-1">{diseaseResult.medicine}</p>
                                            </div>
                                        </div>
                                    </div>

                                </CardContent>
                                <CardFooter className="flex gap-4">
                                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                                        Order from FarmIQ
                                    </Button>
                                    <Button variant="outline" className="flex-1">
                                        Consult Expert
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
