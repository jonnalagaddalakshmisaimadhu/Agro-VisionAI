// Types for AI-powered crop prediction and profit analytics
export interface CropPrediction {
    cropName: string;
    category?: string;
    reason: string;
    estimatedInvestment: string; // e.g., "₹50,000"
    expectedYield: string; // e.g., "25-30 tons/hectare"
    potentialRevenue: string; // e.g., "₹4,50,000"
    estimatedProfit: string; // e.g., "₹4,00,000"
    duration: number; // in days
    breakEvenPrice?: string;
    roiPercent?: number;
}

export interface CropRecommendation {
    cropName: string;
    category?: string;
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
    breakEvenPrice?: string;
    roiPercent?: number;
    costBreakdown?: {
        seeds?: number;
        fertilizer?: number;
        irrigation?: number;
        labor?: number;
        machinery?: number;
        total?: number;
    };
    scenarios?: {
        best_case?: {
            revenue: number;
            profit: number;
            roi_percent: number;
            yield_t_per_ha?: number;
        };
        realistic?: {
            revenue: number;
            profit: number;
            roi_percent: number;
            yield_t_per_ha?: number;
        };
        worst_case?: {
            revenue: number;
            profit: number;
            roi_percent: number;
            yield_t_per_ha?: number;
        };
    };
}

export interface MarketInsight {
    stability: 'Stable' | 'Volatile' | 'Growing';
    trends: string[];
    demandForecast: string;
    risks: string[];
}

export interface DiseaseDetectionResult {
    cropType?: string;
    diseaseName: string;
    description: string;
    confidence: number;
    severityLevel: string;
    severityPercentage?: number;
    actionRequired: string;
    symptoms: string[];
    treatment: string[];
    organicTreatment?: string[];
    chemicalTreatment?: string[];
    prevention: string[];
    supplementName?: string;
    supplementImage?: string;
    buyLink?: string;
    heatmapImage?: string;
    isPlantDetected?: boolean;
    aiSource?: string;
}
