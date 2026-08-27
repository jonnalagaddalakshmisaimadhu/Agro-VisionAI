import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { CropPrediction, CropRecommendation, MarketInsight, DiseaseDetectionResult } from '../types/cropPrediction';

// Initialize Gemini AI with API key from environment
const siteApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const siteModelName = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash-latest';
const genAI = new GoogleGenerativeAI(siteApiKey);
const model: GenerativeModel = genAI.getGenerativeModel({ model: siteModelName as any });

export const getCropRecommendations = async (details: {
    location: string;
    farmSize: string;
    soilType: string;
    season: string;
    budget: string;
    previousCrop?: string;
    category?: string;
    desiredCrops?: string[];
}): Promise<CropRecommendation[]> => {
    try {
        const response = await fetch('/api/crops/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({
                location: details.location,
                farm_size: parseFloat(details.farmSize) || 5.0,
                soil_type: details.soilType,
                season: details.season,
                budget: parseFloat(details.budget) || 100000,
                previous_crop: details.previousCrop || 'None',
                category: details.category || 'All',
                desired_crops: details.desiredCrops && details.desiredCrops.length > 0 ? details.desiredCrops : undefined
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.recommended_crops && Array.isArray(data.recommended_crops) && data.recommended_crops.length > 0) {
                return data.recommended_crops;
            }
        }

        // Secondary fallback to recommendations engine endpoint
        const recResponse = await fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                district: details.location.split(',')[0].trim(),
                area_ha: (parseFloat(details.farmSize) || 5.0) * 0.404686, // convert acres to ha
                season: details.season,
                budget: parseFloat(details.budget) || 100000,
                desired_crops: details.desiredCrops && details.desiredCrops.length > 0 ? details.desiredCrops : undefined
            })
        });

        if (recResponse.ok) {
            const recData = await recResponse.json();
            if (recData.recommendations && Array.isArray(recData.recommendations) && recData.recommendations.length > 0) {
                return recData.recommendations.map((r: any) => ({
                    cropName: r.crop,
                    category: r.category || 'General',
                    profitability: r.profitability,
                    expectedYield: `${r.yield_t_per_ha} tonnes/ha (~${Math.round(r.yield_t_per_ha * 10)} Q/acre)`,
                    investment: `₹${Math.round(r.investment).toLocaleString()}`,
                    duration: `${r.duration_days[0]}-${r.duration_days[1]} days`,
                    marketPrice: `₹${r.price_per_kg}/kg (₹${r.price_per_quintal}/Q)`,
                    estimatedProfit: `₹${Math.round(r.profit).toLocaleString()}`,
                    potentialRevenue: `₹${Math.round(r.revenue).toLocaleString()}`,
                    breakEvenPrice: `₹${r.break_even_price_per_kg}/kg`,
                    roiPercent: r.roi_percent,
                    costBreakdown: r.cost_breakdown,
                    scenarios: r.scenarios,
                    reasons: r.explanation || [`High return on ${details.location} farm`, `Suited for ${details.season} season`]
                }));
            }
        }

        return getFallbackRecommendations(details);

    } catch (error) {
        console.error("Error getting crop recommendations from backend:", error);
        return getFallbackRecommendations(details);
    }
};

// Enhanced crop predictions with detailed financial analysis
export const getCropPredictions = async (details: {
    location: string;
    soilType: string;
    farmSize: string;
    season: string;
    budget: string;
    category?: string;
}): Promise<CropPrediction[]> => {
    const { location, soilType, farmSize, season, budget } = details;

    const prompt = `
        You are a senior agricultural economist and agronomist for India.
        Provide detailed crop predictions covering all categories (Vegetables, Fruits, Grains, Pulses, Spices, Cash Crops).

        Farm Details:
        - Location: ${location}, India
        - Soil Type: ${soilType}
        - Farm Size: ${farmSize} acres
        - Season: ${season}
        - Budget: ₹${budget}

        Recommend 6 diverse, high-profit crops (including fruits and vegetables) suitable for this farm.
        Return raw JSON array of 6 items with keys:
        cropName, category, reason, duration (in days as number), estimatedInvestment ("₹X,XXX"), expectedYield, potentialRevenue ("₹X,XXX"), estimatedProfit ("₹X,XXX").
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanText = text.replace(/```json|```/g, '').trim();
        const predictions = JSON.parse(cleanText) as CropPrediction[];
        return predictions.slice(0, 6);

    } catch (error) {
        console.error("Error getting crop predictions:", error);
        return getFallbackPredictions(details);
    }
};

export const getMarketInsights = async (cropName: string, location: string): Promise<MarketInsight> => {
    const prompt = `
        Provide market insights for ${cropName} in ${location}, India.
        Return raw JSON with keys: stability ("Stable" | "Volatile" | "Growing"), trends (array of 3 strings), demandForecast (string), risks (array of 2 strings).
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText) as MarketInsight;
    } catch (error) {
        return getFallbackMarketInsights(cropName);
    }
};

export const detectPlantDisease = async (imageDataBase64: string, mimeType: string): Promise<DiseaseDetectionResult> => {
    try {
        const response = await fetch('/api/disease/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({
                image_base64: imageDataBase64
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to connect to backend ML service (Status ${response.status}).`);
        }

        const data = await response.json();
        const confidenceScore = data.confidence_score || 0.85;
        const confidencePercentage = Math.min(Math.round(confidenceScore * 100), 100);

        return {
            diseaseName: data.disease_name || 'Healthy Crop',
            description: data.description || 'No severe pathology detected.',
            confidence: confidencePercentage,
            severityLevel: data.severity || 'low',
            actionRequired: data.severity === 'high' ? 'Immediate treatment required' : 'Standard preventative care',
            symptoms: data.symptoms || ['Normal leaf foliage and stem integrity'],
            treatment: data.treatment || ['Maintain balanced organic nutrients and pest monitoring'],
            prevention: data.prevention || ['Crop rotation and clean irrigation practices']
        };

    } catch (error) {
        console.error("Error detecting plant disease:", error);
        throw error;
    }
};

// Universal Fallback Generator across Vegetables, Fruits, Grains, Pulses, Spices, Cash Crops
const getFallbackRecommendations = (details: any): CropRecommendation[] => {
    const budget = parseFloat(details.budget) || 100000;
    const farmSize = parseFloat(details.farmSize) || 5;
    const location = details.location || "Regional";
    const requestedCat = (details.category || "All").toLowerCase();

    const pool = [
        {
            cropName: "Tomato (Hybrid Arka Rakshak)",
            category: "Vegetables",
            profitability: "High Profit" as const,
            expectedYield: `${Math.round(28 * farmSize)} Quintals`,
            investment: `₹${Math.round(budget * 0.4).toLocaleString()}`,
            duration: "90-115 days",
            marketPrice: "₹2,500/quintal",
            estimatedProfit: `₹${Math.round((28 * farmSize * 2500) - (budget * 0.4)).toLocaleString()}`,
            breakEvenPrice: "₹10.5/kg",
            roiPercent: 180,
            reasons: [
                `High market demand in ${location} wholesale markets`,
                "Multiple staggered picking cycles for continuous cashflow",
                "Excellent response to drip irrigation and mulching"
            ]
        },
        {
            cropName: "Banana (Grand Naine)",
            category: "Fruits",
            profitability: "High Profit" as const,
            expectedYield: `${Math.round(55 * farmSize)} Quintals`,
            investment: `₹${Math.round(budget * 0.55).toLocaleString()}`,
            duration: "330-360 days",
            marketPrice: "₹1,800/quintal",
            estimatedProfit: `₹${Math.round((55 * farmSize * 1800) - (budget * 0.55)).toLocaleString()}`,
            breakEvenPrice: "₹7.2/kg",
            roiPercent: 210,
            reasons: [
                "Massive yield output per acre with high commercial value",
                "High table fruit and export market demand",
                "Assured purchase contracts from regional distributors"
            ]
        },
        {
            cropName: "Papaya (Red Lady 786)",
            category: "Fruits",
            profitability: "High Profit" as const,
            expectedYield: `${Math.round(50 * farmSize)} Quintals`,
            investment: `₹${Math.round(budget * 0.45).toLocaleString()}`,
            duration: "270-300 days",
            marketPrice: "₹2,000/quintal",
            estimatedProfit: `₹${Math.round((50 * farmSize * 2000) - (budget * 0.45)).toLocaleString()}`,
            breakEvenPrice: "₹6.8/kg",
            roiPercent: 240,
            reasons: [
                "Rapid early fruit set within 8-9 months",
                "Consistently high prices in fruit markets",
                "Low establishment cost with prolonged harvest window"
            ]
        },
        {
            cropName: "Onion (Bhima Red)",
            category: "Vegetables",
            profitability: "High Profit" as const,
            expectedYield: `${Math.round(25 * farmSize)} Quintals`,
            investment: `₹${Math.round(budget * 0.35).toLocaleString()}`,
            duration: "100-125 days",
            marketPrice: "₹2,400/quintal",
            estimatedProfit: `₹${Math.round((25 * farmSize * 2400) - (budget * 0.35)).toLocaleString()}`,
            breakEvenPrice: "₹9.2/kg",
            roiPercent: 160,
            reasons: [
                "Good post-harvest storage stability",
                "High liquidity across all APMC mandis",
                "Perfect crop rotation for soil aeration"
            ]
        },
        {
            cropName: "Wheat (HD-2967 / Sharbati)",
            category: "Grains & Millets",
            profitability: "High Profit" as const,
            expectedYield: `${Math.round(22 * farmSize)} Quintals`,
            investment: `₹${Math.round(budget * 0.28).toLocaleString()}`,
            duration: "120-135 days",
            marketPrice: "₹2,450/quintal",
            estimatedProfit: `₹${Math.round((22 * farm_size_calc(farmSize, 22, 2450, budget * 0.28))).toLocaleString()}`,
            breakEvenPrice: "₹12.0/kg",
            roiPercent: 95,
            reasons: [
                "Guaranteed government Minimum Support Price (MSP)",
                "Low input risk and low pest vulnerability",
                "Stable procurement channels"
            ]
        },
        {
            cropName: "Chickpea / Gram (JG-11)",
            category: "Pulses & Legumes",
            profitability: "High Profit" as const,
            expectedYield: `${Math.round(12 * farmSize)} Quintals`,
            investment: `₹${Math.round(budget * 0.22).toLocaleString()}`,
            duration: "95-105 days",
            marketPrice: "₹6,000/quintal",
            estimatedProfit: `₹${Math.round((12 * farmSize * 6000) - (budget * 0.22)).toLocaleString()}`,
            breakEvenPrice: "₹22.0/kg",
            roiPercent: 220,
            reasons: [
                "Naturally fixes nitrogen in soil, lowering fertilizer cost",
                "Minimal water and irrigation requirement",
                "Strong protein demand maintaining high market prices"
            ]
        }
    ];

    function farm_size_calc(fs: number, y: number, p: number, inv: number) {
        return (y * fs * p) - inv;
    }

    if (requestedCat && requestedCat !== "all") {
        const filtered = pool.filter(p => p.category.toLowerCase().includes(requestedCat));
        if (filtered.length > 0) return filtered;
    }

    return pool;
};

const getFallbackPredictions = (details: any): CropPrediction[] => {
    const budget = parseInt(details.budget) || 100000;
    return [
        {
            cropName: "Tomato",
            category: "Vegetables",
            reason: `High yield potential in ${details.location} with strong urban demand.`,
            estimatedInvestment: `₹${Math.round(budget * 0.4).toLocaleString()}`,
            expectedYield: "25-30 tons/ha",
            potentialRevenue: `₹${Math.round(budget * 2.2).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 1.8).toLocaleString()}`,
            duration: 110,
            breakEvenPrice: "₹9.5/kg",
            roiPercent: 190
        },
        {
            cropName: "Papaya",
            category: "Fruits",
            reason: `Quick-fruiting fruit crop with continuous harvest over 18 months.`,
            estimatedInvestment: `₹${Math.round(budget * 0.5).toLocaleString()}`,
            expectedYield: "50-60 tons/ha",
            potentialRevenue: `₹${Math.round(budget * 2.6).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 2.1).toLocaleString()}`,
            duration: 270,
            breakEvenPrice: "₹6.5/kg",
            roiPercent: 230
        },
        {
            cropName: "Chickpea",
            category: "Pulses & Legumes",
            reason: `Low water requirement, natural soil fertilization, and high MSP support.`,
            estimatedInvestment: `₹${Math.round(budget * 0.25).toLocaleString()}`,
            expectedYield: "2.0-2.5 tons/ha",
            potentialRevenue: `₹${Math.round(budget * 1.6).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 1.35).toLocaleString()}`,
            duration: 100,
            breakEvenPrice: "₹21.0/kg",
            roiPercent: 215
        },
        {
            cropName: "Cotton",
            category: "Cash & Plantation",
            reason: `Strong fiber export demand and mill purchase contracts.`,
            estimatedInvestment: `₹${Math.round(budget * 0.55).toLocaleString()}`,
            expectedYield: "2.5-3.2 tons/ha",
            potentialRevenue: `₹${Math.round(budget * 2.0).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 1.45).toLocaleString()}`,
            duration: 170,
            breakEvenPrice: "₹38.0/kg",
            roiPercent: 140
        },
        {
            cropName: "Watermelon",
            category: "Fruits",
            reason: `Fast 85-day cash crop turnaround with peak seasonal demand.`,
            estimatedInvestment: `₹${Math.round(budget * 0.35).toLocaleString()}`,
            expectedYield: "35-45 tons/ha",
            potentialRevenue: `₹${Math.round(budget * 1.9).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 1.55).toLocaleString()}`,
            duration: 85,
            breakEvenPrice: "₹5.0/kg",
            roiPercent: 205
        },
        {
            cropName: "Wheat",
            category: "Grains & Millets",
            reason: `Safe, staple grain cultivation with reliable MSP procurement.`,
            estimatedInvestment: `₹${Math.round(budget * 0.3).toLocaleString()}`,
            expectedYield: "4.5-5.5 tons/ha",
            potentialRevenue: `₹${Math.round(budget * 1.5).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 1.2).toLocaleString()}`,
            duration: 130,
            breakEvenPrice: "₹12.5/kg",
            roiPercent: 110
        }
    ];
};

const getFallbackMarketInsights = (cropName: string): MarketInsight => ({
    stability: "Growing",
    trends: [
        `Rising consumption and urban market off-take for ${cropName}`,
        "Government logistics support under PM-Kisan Sampada scheme",
        "Stable price realization at major district APMC yards"
    ],
    demandForecast: `Strong steady demand projected across the upcoming harvest quarter for ${cropName}.`,
    risks: [
        "Unseasonal rainfall during flowering or pod maturity",
        "Short-term harvest glut at regional wholesale mandis"
    ]
});
