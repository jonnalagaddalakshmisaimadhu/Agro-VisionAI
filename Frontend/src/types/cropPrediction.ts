// Types for AI-powered crop prediction functionality
export interface CropPrediction {
    cropName: string;
    reason: string;
    estimatedInvestment: string; // e.g., "₹50,000"
    expectedYield: string; // e.g., "25-30 tons/hectare"
    potentialRevenue: string; // e.g., "₹4,50,000"
    estimatedProfit: string; // e.g., "₹4,00,000"
    duration: number; // in days
}

export interface CropRecommendation {
    cropName: string;
    profitability: 'High Profit' | 'Medium Profit' | 'Low Profit';
    expectedYield: string;
    investment: string;
    duration: string;
    marketPrice: string;
    reasons: string[];
    // Enhanced fields for profit prediction
    crop?: string;
    reason?: string;
    estimatedInvestment?: string;
    potentialRevenue?: string;
    estimatedProfit?: string;
    priceTrend?: string;
}

export interface MarketInsight {
    stability: 'Stable' | 'Volatile' | 'Growing';
    trends: string[];
    demandForecast: string;
    risks: string[];
}

export interface DiseaseDetectionResult {
    diseaseName: string;
    description: string;
    confidence: number;
    severityLevel: string;
    actionRequired: string;
    symptoms: string[];
    treatment: string[];
    prevention: string[];
}
