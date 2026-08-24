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
    previousCrop: string;
}): Promise<CropRecommendation[]> => {
    try {
        const response = await fetch('/api/crops/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                location: details.location,
                farm_size: parseFloat(details.farmSize) || 5.0,
                soil_type: details.soilType,
                season: details.season,
                budget: parseFloat(details.budget) || 100000,
                previous_crop: details.previousCrop
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch recommendations (Status ${response.status})`);
        }

        const data = await response.json();
        console.log('🤖 Backend Recommendations Response:', data);
        
        // The backend returns a CropRecommendationResponse object which has recommended_crops
        if (data.recommended_crops && Array.isArray(data.recommended_crops)) {
            return data.recommended_crops;
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
}): Promise<CropPrediction[]> => {
    const { location, soilType, farmSize, season, budget } = details;

    const prompt = `
        You are a world-class agronomist and agricultural financial analyst specializing in Indian agriculture. 
        Provide detailed crop predictions with comprehensive financial analysis.

        User's Farm Data:
        - Location: ${location}, India
        - Soil Type: ${soilType}
        - Farm Size: ${farmSize} hectares
        - Season: ${season}
        - Maximum Investment Budget: ₹${budget}

        Based on this data, recommend the top 6 most profitable and suitable crops with detailed financial projections.
        The investment for each crop should not exceed the user's budget.

        For each crop, provide:
        - cropName: Common name of the crop
        - reason: Detailed reason for recommendation based on user's specific conditions
        - duration: Cultivation duration in days
        - estimatedInvestment: Total investment cost in ₹ (formatted as "₹X,XXX")
        - expectedYield: Expected yield per hectare
        - potentialRevenue: Total potential revenue in ₹ (formatted as "₹X,XXX")
        - estimatedProfit: Net profit in ₹ (formatted as "₹X,XXX")

        Ensure all financial figures are realistic for the specified location and farm size.
        Your output must be a valid JSON array with exactly 6 crop predictions.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean and parse JSON response
        const cleanText = text.replace(/```json|```/g, '').trim();
        const predictions = JSON.parse(cleanText) as CropPrediction[];

        // Ensure we have exactly 6 predictions
        return predictions.slice(0, 6);

    } catch (error) {
        console.error("Error getting crop predictions:", error);
        // Return fallback predictions if API fails
        return getFallbackPredictions(details);
    }
};

// Market insights for specific crops
export const getMarketInsights = async (cropName: string, location: string): Promise<MarketInsight> => {
    const prompt = `
        As a senior agricultural market analyst for India, provide comprehensive market insights for ${cropName} in the ${location} region.
        
        Analyze:
        - Current market price trends
        - Demand forecast for the next 6 months
        - Market stability assessment
        - Key risks and opportunities
        - Regional market conditions
        
        Your output must be a valid JSON object with:
        - stability: 'Stable', 'Volatile', or 'Growing'
        - trends: Array of 3-4 key market trends
        - demandForecast: One-sentence demand forecast
        - risks: Array of 2-3 potential market risks
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText) as MarketInsight;

    } catch (error) {
        console.error(`Error getting market insights for ${cropName}:`, error);
        return getFallbackMarketInsights(cropName);
    }
};

// Disease detection using backend ML model
export const detectPlantDisease = async (imageDataBase64: string, mimeType: string): Promise<DiseaseDetectionResult> => {
    try {
        // Call the backend API for disease detection
        const response = await fetch('/api/disease/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Add authentication if needed
            },
            body: JSON.stringify({
                image_base64: imageDataBase64
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to connect to backend ML service (Status ${response.status}). Please ensure the Python FastAPI server is running in the 'server' folder.`);
        }

        const data = await response.json();

        // Transform backend response to frontend format
        const confidenceScore = data.confidence_score || 0.5;
        const confidencePercentage = Math.min(Math.round(confidenceScore * 100), 100);

        return {
            diseaseName: data.disease_name || 'Unknown Disease',
            description: data.description || 'No description available',
            confidence: confidencePercentage,
            severityLevel: data.severity || 'medium',
            actionRequired: data.severity === 'high' ? 'Immediate action required' :
                data.severity === 'medium' ? 'Monitor closely' : 'Continue monitoring',
            symptoms: data.symptoms || ['No symptoms identified'],
            treatment: data.treatment || ['Consult with agricultural expert'],
            prevention: data.prevention || ['Maintain good plant hygiene']
        };

    } catch (error) {
        console.error("Error detecting plant disease:", error);

        // Notify user to start backend server rather than showing static fake results
        if (error instanceof Error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error("Unable to connect to the Machine Learning Server. Please start the backend FastAPI server in the `server` folder.");
            }
            throw error;
        }
        
        throw new Error("Unable to connect to disease detection service. Please ensure your Python backend server is running.");
    }
};

// Dynamic fallback functions based on user inputs
const getFallbackRecommendations = (details: any): CropRecommendation[] => {
    const budget = parseInt(details.budget) || 100000;
    const farmSize = parseInt(details.farmSize) || 5;
    const location = details.location || "Delhi";
    const soilType = details.soilType || "Loamy";
    const season = details.season || "rabi";

    // Generate location-specific crops with some randomness
    const getLocationBasedCrops = (location: string) => {
        const locationLower = location.toLowerCase();
        let baseCrops = [];

        if (locationLower.includes('punjab') || locationLower.includes('haryana')) {
            baseCrops = ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Potato', 'Mustard', 'Maize', 'Sunflower'];
        } else if (locationLower.includes('maharastra') || locationLower.includes('maharashtra')) {
            baseCrops = ['Cotton', 'Sugarcane', 'Wheat', 'Tomato', 'Onion', 'Turmeric', 'Groundnut', 'Chickpea'];
        } else if (locationLower.includes('karnataka') || locationLower.includes('tamil')) {
            baseCrops = ['Rice', 'Sugarcane', 'Cotton', 'Tomato', 'Coconut', 'Spices', 'Ragi', 'Jowar'];
        } else if (locationLower.includes('west bengal') || locationLower.includes('bengal')) {
            baseCrops = ['Rice', 'Jute', 'Wheat', 'Tomato', 'Potato', 'Mustard', 'Tea', 'Sugarcane'];
        } else if (locationLower.includes('gujarat')) {
            baseCrops = ['Cotton', 'Groundnut', 'Wheat', 'Sugarcane', 'Cumin', 'Tomato', 'Rice', 'Maize'];
        } else if (locationLower.includes('rajasthan')) {
            baseCrops = ['Wheat', 'Mustard', 'Cotton', 'Groundnut', 'Barley', 'Bajra', 'Chickpea', 'Cumin'];
        } else if (locationLower.includes('uttar pradesh') || locationLower.includes('up')) {
            baseCrops = ['Rice', 'Wheat', 'Sugarcane', 'Potato', 'Tomato', 'Mustard', 'Maize', 'Barley'];
        } else {
            baseCrops = ['Rice', 'Wheat', 'Cotton', 'Tomato', 'Sugarcane', 'Maize', 'Potato', 'Onion'];
        }

        // Add some randomness - shuffle and pick 6-8 crops
        const shuffled = [...baseCrops].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 6 + Math.floor(Math.random() * 2));
    };

    // Generate season-specific crops with variations
    const getSeasonBasedCrops = (season: string) => {
        const seasonLower = season.toLowerCase();
        let baseCrops = [];

        if (seasonLower.includes('kharif')) {
            baseCrops = ['Rice', 'Cotton', 'Sugarcane', 'Maize', 'Groundnut', 'Soybean', 'Jowar', 'Bajra', 'Turmeric'];
        } else if (seasonLower.includes('rabi')) {
            baseCrops = ['Wheat', 'Barley', 'Mustard', 'Tomato', 'Potato', 'Onion', 'Chickpea', 'Lentil', 'Cumin'];
        } else if (seasonLower.includes('zaid')) {
            baseCrops = ['Tomato', 'Cucumber', 'Watermelon', 'Rice', 'Maize', 'Vegetables', 'Onion', 'Chili', 'Brinjal'];
        } else {
            baseCrops = ['Rice', 'Wheat', 'Cotton', 'Tomato', 'Sugarcane', 'Maize', 'Potato', 'Onion'];
        }

        // Add randomness to season crops too
        const shuffled = [...baseCrops].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 6 + Math.floor(Math.random() * 2));
    };

    // Get crops suitable for soil type with variations
    const getSoilCompatibleCrops = (soilType: string) => {
        const soilLower = soilType.toLowerCase();
        let baseCrops = [];

        if (soilLower.includes('clay') || soilLower.includes('loamy')) {
            baseCrops = ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Potato', 'Tomato', 'Onion', 'Cabbage'];
        } else if (soilLower.includes('sandy')) {
            baseCrops = ['Groundnut', 'Cotton', 'Tomato', 'Millet', 'Watermelon', 'Cucumber', 'Bajra', 'Sunflower'];
        } else if (soilLower.includes('black')) {
            baseCrops = ['Cotton', 'Sugarcane', 'Wheat', 'Rice', 'Soybean', 'Turmeric', 'Jowar', 'Bajra'];
        } else if (soilLower.includes('red')) {
            baseCrops = ['Rice', 'Wheat', 'Groundnut', 'Sugarcane', 'Tomato', 'Chili', 'Turmeric', 'Coconut'];
        } else {
            baseCrops = ['Rice', 'Wheat', 'Cotton', 'Tomato', 'Sugarcane', 'Maize', 'Potato', 'Onion'];
        }

        // Add randomness to soil crops
        const shuffled = [...baseCrops].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 6 + Math.floor(Math.random() * 2));
    };

    // Combine all factors to get best crops
    const locationCrops = getLocationBasedCrops(location);
    const seasonCrops = getSeasonBasedCrops(season);
    const soilCrops = getSoilCompatibleCrops(soilType);

    // Score crops based on compatibility
    const cropScores: { [key: string]: number } = {};
    [...locationCrops, ...seasonCrops, ...soilCrops].forEach(crop => {
        cropScores[crop] = (cropScores[crop] || 0) + 1;
    });

    // Get top 6 crops
    const topCrops = Object.entries(cropScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([crop]) => crop);

    // Create a realistic mix of crop types for diversity
    const createRealisticMix = (crops: string[]) => {
        const cropTypes = {
            'staple': ['Rice', 'Wheat', 'Maize', 'Barley'],
            'cash': ['Cotton', 'Sugarcane', 'Tobacco', 'Jute'],
            'vegetable': ['Tomato', 'Onion', 'Potato', 'Cabbage'],
            'pulse': ['Chickpea', 'Lentil', 'Black gram', 'Green gram'],
            'oilseed': ['Mustard', 'Groundnut', 'Soybean', 'Sunflower'],
            'spice': ['Turmeric', 'Chili', 'Coriander', 'Cumin']
        };

        const selectedCrops = [];
        const usedTypes = new Set();

        // Ensure we get a good mix of different crop types
        for (const crop of crops) {
            const cropType = Object.entries(cropTypes).find(([type, typeCrops]) =>
                typeCrops.some(tc => tc.toLowerCase().includes(crop.toLowerCase()) || crop.toLowerCase().includes(tc.toLowerCase()))
            )?.[0] || 'staple';

            if (!usedTypes.has(cropType) || Math.random() > 0.6) {
                selectedCrops.push(crop);
                usedTypes.add(cropType);
            }
        }

        return selectedCrops.slice(0, 6);
    };

    const mixedCrops = createRealisticMix(topCrops);

    // Generate dynamic recommendations with realistic variations
    return mixedCrops.map((crop, index) => {
        // Create realistic investment variations based on crop type
        const cropCategory = crop.toLowerCase();
        let investmentRatio, baseYield, basePrice, baseDuration;

        if (cropCategory.includes('rice') || cropCategory.includes('wheat')) {
            investmentRatio = 0.4; // Staple crops - moderate investment
            baseYield = 4; basePrice = 25; baseDuration = 120;
        } else if (cropCategory.includes('cotton') || cropCategory.includes('sugarcane')) {
            investmentRatio = 0.8; // Cash crops - high investment
            baseYield = 3; basePrice = 65; baseDuration = 180;
        } else if (cropCategory.includes('tomato') || cropCategory.includes('onion')) {
            investmentRatio = 0.6; // Vegetables - medium-high investment
            baseYield = 25; basePrice = 45; baseDuration = 100;
        } else if (cropCategory.includes('chickpea') || cropCategory.includes('lentil')) {
            investmentRatio = 0.3; // Pulses - low investment
            baseYield = 1.5; basePrice = 80; baseDuration = 90;
        } else if (cropCategory.includes('mustard') || cropCategory.includes('groundnut')) {
            investmentRatio = 0.5; // Oilseeds - medium investment
            baseYield = 2; basePrice = 55; baseDuration = 110;
        } else {
            investmentRatio = 0.5; // Default
            baseYield = 3; basePrice = 35; baseDuration = 120;
        }

        const investment = Math.round(budget * investmentRatio);
        const yieldVariation = 0.8 + (Math.random() * 0.4); // ±20% variation
        const priceVariation = 0.9 + (Math.random() * 0.2); // ±10% variation
        const durationVariation = 0.9 + (Math.random() * 0.2); // ±10% variation

        // Convert acres to hectares for yield calculation (1 acre ≈ 0.4 hectares)
        const farmSizeInHectares = farmSize * 0.4;
        const actualYield = Math.round(farmSizeInHectares * baseYield * yieldVariation);
        const actualPrice = Math.round(basePrice * priceVariation);
        const actualDuration = Math.round(baseDuration * durationVariation);

        const revenue = Math.round(actualYield * actualPrice * 10); // 10x multiplier for realistic revenue
        const profit = revenue - investment;

        // Create realistic reasons based on crop and conditions
        const getReasons = (cropName: string) => {
            const reasons = [];

            if (cropName.toLowerCase().includes('rice')) {
                reasons.push(`High water availability in ${location} region`);
                reasons.push(`Government MSP support for rice`);
                reasons.push(`Stable market demand throughout year`);
            } else if (cropName.toLowerCase().includes('wheat')) {
                reasons.push(`Perfect for ${season} season cultivation`);
                reasons.push(`Low maintenance and pest resistance`);
                reasons.push(`Good procurement price from government`);
            } else if (cropName.toLowerCase().includes('cotton')) {
                reasons.push(`Export demand driving high prices`);
                reasons.push(`Suitable for ${soilType} soil conditions`);
                reasons.push(`Long-term investment with good returns`);
            } else if (cropName.toLowerCase().includes('tomato')) {
                reasons.push(`High market demand in ${location}`);
                reasons.push(`Quick harvest cycle for cash flow`);
                reasons.push(`Multiple harvests possible`);
            } else if (cropName.toLowerCase().includes('sugarcane')) {
                reasons.push(`Sugar mill contracts available`);
                reasons.push(`High yield potential in ${location}`);
                reasons.push(`Long-term stable income source`);
            } else {
                reasons.push(`Growing market demand in region`);
                reasons.push(`Suitable for current soil conditions`);
                reasons.push(`Good profit margin potential`);
            }

            return reasons;
        };

        // Create a good mix of profitability levels
        const profitabilityLevels = ["High Profit", "Medium Profit", "Low Profit"];
        const profitabilityDistribution = [2, 3, 1]; // 2 High, 3 Medium, 1 Low profit crops

        let assignedProfitability = "Medium Profit"; // Default
        let levelIndex = 0;
        let currentCount = 0;

        for (let i = 0; i < profitabilityDistribution.length; i++) {
            currentCount += profitabilityDistribution[i];
            if (index < currentCount) {
                levelIndex = i;
                break;
            }
        }

        assignedProfitability = profitabilityLevels[levelIndex];

        // Adjust profit calculations based on assigned level
        let adjustedProfit = profit;
        if (assignedProfitability === "High Profit") {
            adjustedProfit = Math.round(investment * (1.8 + Math.random() * 0.4)); // 180-220% return
        } else if (assignedProfitability === "Medium Profit") {
            adjustedProfit = Math.round(investment * (1.3 + Math.random() * 0.3)); // 130-160% return
        } else {
            adjustedProfit = Math.round(investment * (1.1 + Math.random() * 0.2)); // 110-130% return
        }

        return {
            cropName: crop,
            profitability: assignedProfitability as "High Profit" | "Medium Profit" | "Low Profit",
            expectedYield: `${Math.round(actualYield * 0.8)}-${Math.round(actualYield * 1.2)} tons/acre`,
            investment: `₹${investment.toLocaleString()}`,
            duration: `${Math.round(actualDuration * 0.9)}-${Math.round(actualDuration * 1.1)} days`,
            marketPrice: `₹${Math.round(actualPrice * 0.9)}-₹${Math.round(actualPrice * 1.1)}/kg`,
            estimatedProfit: `₹${adjustedProfit.toLocaleString()}`,
            reasons: getReasons(crop),
            priceTrend: "Stable" // Default fallback trend
        };
    });
};

const getFallbackPredictions = (details: any): CropPrediction[] => {
    const budget = parseInt(details.budget) || 100000;

    return [
        {
            cropName: "Tomato",
            reason: `Tomato is highly suitable for ${details.soilType} soil during ${details.season} season in ${details.location} region.`,
            estimatedInvestment: `₹${Math.round(budget * 0.5).toLocaleString()}`,
            expectedYield: "25-30 tons/hectare",
            potentialRevenue: `₹${Math.round(budget * 2.5).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 2.0).toLocaleString()}`,
            duration: 120
        },
        {
            cropName: "Wheat",
            reason: `Wheat grows well in ${details.soilType} soil during ${details.season} season with stable market demand.`,
            estimatedInvestment: `₹${Math.round(budget * 0.4).toLocaleString()}`,
            expectedYield: "4-5 tons/hectare",
            potentialRevenue: `₹${Math.round(budget * 1.8).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 1.4).toLocaleString()}`,
            duration: 150
        },
        {
            cropName: "Cotton",
            reason: `Cotton is profitable in ${details.location} region with excellent export potential and premium pricing.`,
            estimatedInvestment: `₹${Math.round(budget * 0.7).toLocaleString()}`,
            expectedYield: "2-3 tons/hectare",
            potentialRevenue: `₹${Math.round(budget * 2.2).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 1.5).toLocaleString()}`,
            duration: 180
        },
        {
            cropName: "Rice",
            reason: `Rice is ideal for ${details.soilType} soil in ${details.season} season with government support.`,
            estimatedInvestment: `₹${Math.round(budget * 0.6).toLocaleString()}`,
            expectedYield: "4-6 tons/hectare",
            potentialRevenue: `₹${Math.round(budget * 2.0).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 1.4).toLocaleString()}`,
            duration: 130
        },
        {
            cropName: "Sugarcane",
            reason: `Sugarcane offers excellent long-term returns in ${details.location} region with sugar mill demand.`,
            estimatedInvestment: `₹${Math.round(budget * 0.8).toLocaleString()}`,
            expectedYield: "70-100 tons/hectare",
            potentialRevenue: `₹${Math.round(budget * 2.8).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 2.0).toLocaleString()}`,
            duration: 365
        },
        {
            cropName: "Maize",
            reason: `Maize provides quick returns with growing demand in ${details.location} region.`,
            estimatedInvestment: `₹${Math.round(budget * 0.5).toLocaleString()}`,
            expectedYield: "3-5 tons/hectare",
            potentialRevenue: `₹${Math.round(budget * 1.9).toLocaleString()}`,
            estimatedProfit: `₹${Math.round(budget * 1.4).toLocaleString()}`,
            duration: 110
        }
    ];
};

const getFallbackMarketInsights = (cropName: string): MarketInsight => {
    return {
        stability: "Stable",
        trends: ["Steady demand growth", "Government support programs", "Export opportunities"],
        demandForecast: "Moderate to high demand expected in the coming months.",
        risks: ["Weather variability", "Market price fluctuations"]
    };
};
