import re
import json
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

class IntentType(Enum):
    CROP_RECOMMENDATION = "crop_recommendation"
    DISEASE_DIAGNOSIS = "disease_diagnosis"
    PEST_MANAGEMENT = "pest_management"
    SOIL_MANAGEMENT = "soil_management"
    WEATHER_ADVICE = "weather_advice"
    MARKET_INQUIRY = "market_inquiry"
    IRRIGATION_ADVICE = "irrigation_advice"
    EQUIPMENT_HELP = "equipment_help"
    GOVERNMENT_SCHEMES = "government_schemes"
    GENERAL_QUESTION = "general_question"
    EMERGENCY_HELP = "emergency_help"
    FOLLOW_UP = "follow_up"

class EntityType(Enum):
    CROP = "crop"
    DISEASE = "disease"
    PEST = "pest"
    LOCATION = "location"
    SEASON = "season"
    SOIL_TYPE = "soil_type"
    EQUIPMENT = "equipment"
    QUANTITY = "quantity"
    TIME_PERIOD = "time_period"

class SentimentType(Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    URGENT = "urgent"

@dataclass
class Entity:
    type: EntityType
    value: str
    confidence: float
    start_pos: int
    end_pos: int

@dataclass
class IntentClassification:
    primary_intent: IntentType
    secondary_intents: List[IntentType]
    confidence: float
    entities: List[Entity]
    sentiment: SentimentType
    urgency: str
    context_clues: List[str]

class AdvancedNLPService:
    def __init__(self):
        self.agricultural_keywords = self._load_agricultural_keywords()
        self.intent_patterns = self._load_intent_patterns()
        self.entity_patterns = self._load_entity_patterns()
        self.sentiment_indicators = self._load_sentiment_indicators()
        
    def _load_agricultural_keywords(self) -> Dict[str, List[str]]:
        """Load comprehensive agricultural vocabulary"""
        return {
            "crops": [
                "rice", "wheat", "maize", "cotton", "sugarcane", "tomato", "potato", "onion",
                "chili", "brinjal", "okra", "cabbage", "cauliflower", "carrot", "radish",
                "cucumber", "watermelon", "muskmelon", "pumpkin", "bitter gourd", "ridge gourd",
                "chickpea", "lentil", "black gram", "green gram", "pigeon pea", "cowpea",
                "mustard", "groundnut", "sunflower", "soybean", "sesame", "castor",
                "turmeric", "ginger", "garlic", "coriander", "cumin", "fenugreek",
                "mango", "banana", "papaya", "guava", "pomegranate", "grapes", "citrus"
            ],
            "diseases": [
                "blight", "rust", "smut", "mildew", "wilt", "rot", "spot", "scab",
                "anthracnose", "bacterial wilt", "powdery mildew", "downy mildew",
                "leaf spot", "root rot", "stem rot", "fruit rot", "seed rot",
                "yellow mosaic", "mosaic virus", "leaf curl", "leaf roll"
            ],
            "pests": [
                "aphid", "whitefly", "thrips", "mite", "caterpillar", "borer", "beetle",
                "weevil", "bug", "hopper", "moth", "butterfly", "fly", "mosquito",
                "termite", "ant", "spider", "nematode", "slug", "snail"
            ],
            "soil_types": [
                "clay", "sandy", "loamy", "silt", "black", "red", "alluvial", "laterite",
                "mountain", "desert", "coastal", "alkaline", "acidic", "neutral"
            ],
            "seasons": [
                "kharif", "rabi", "zaid", "monsoon", "winter", "summer", "spring", "autumn"
            ],
            "equipment": [
                "tractor", "plow", "harrow", "cultivator", "seeder", "planter", "sprayer",
                "harvester", "thresher", "winnower", "irrigation", "drip", "sprinkler",
                "pump", "motor", "generator", "tiller", "mower", "baler"
            ],
            "locations": [
                "punjab", "haryana", "uttar pradesh", "maharashtra", "karnataka", "tamil nadu",
                "west bengal", "gujarat", "rajasthan", "madhya pradesh", "bihar", "odisha",
                "andhra pradesh", "telangana", "kerala", "assam", "jharkhand", "chhattisgarh"
            ]
        }
    
    def _load_intent_patterns(self) -> Dict[IntentType, List[str]]:
        """Load intent classification patterns"""
        return {
            IntentType.CROP_RECOMMENDATION: [
                r"what.*crop.*plant", r"which.*crop.*grow", r"best.*crop.*season",
                r"recommend.*crop", r"suitable.*crop", r"crop.*selection",
                r"what.*plant.*season", r"which.*variety.*best"
            ],
            IntentType.DISEASE_DIAGNOSIS: [
                r"disease.*plant", r"plant.*sick", r"leaf.*yellow", r"leaf.*brown",
                r"spots.*leaf", r"plant.*dying", r"fungus.*plant", r"bacterial.*infection",
                r"plant.*problem", r"crop.*disease", r"diagnose.*disease"
            ],
            IntentType.PEST_MANAGEMENT: [
                r"pest.*control", r"insect.*damage", r"bug.*plant", r"aphid.*attack",
                r"whitefly.*problem", r"caterpillar.*eating", r"pest.*management",
                r"insecticide.*use", r"organic.*pest", r"biological.*control"
            ],
            IntentType.SOIL_MANAGEMENT: [
                r"soil.*test", r"fertilizer.*use", r"soil.*fertility", r"compost.*make",
                r"soil.*ph", r"nutrient.*deficiency", r"soil.*improvement", r"manure.*apply",
                r"soil.*health", r"organic.*matter"
            ],
            IntentType.WEATHER_ADVICE: [
                r"weather.*farming", r"rain.*crop", r"drought.*management", r"flood.*damage",
                r"temperature.*plant", r"climate.*change", r"monsoon.*farming", r"seasonal.*advice"
            ],
            IntentType.MARKET_INQUIRY: [
                r"price.*crop", r"market.*rate", r"profit.*crop", r"cost.*cultivation",
                r"mandi.*price", r"export.*opportunity", r"market.*demand", r"selling.*crop"
            ],
            IntentType.IRRIGATION_ADVICE: [
                r"water.*management", r"irrigation.*system", r"drip.*irrigation", r"water.*saving",
                r"drought.*resistant", r"water.*conservation", r"sprinkler.*system"
            ],
            IntentType.EQUIPMENT_HELP: [
                r"tractor.*problem", r"equipment.*maintenance", r"machine.*repair",
                r"farming.*tool", r"harvester.*use", r"irrigation.*equipment"
            ],
            IntentType.GOVERNMENT_SCHEMES: [
                r"government.*scheme", r"subsidy.*available", r"loan.*agriculture",
                r"pm.*kisan", r"insurance.*crop", r"msp.*price", r"scheme.*benefit"
            ],
            IntentType.EMERGENCY_HELP: [
                r"urgent.*help", r"emergency.*crop", r"immediate.*action", r"crop.*dying",
                r"quick.*solution", r"asap.*help", r"critical.*situation"
            ]
        }
    
    def _load_entity_patterns(self) -> Dict[EntityType, List[str]]:
        """Load entity extraction patterns"""
        return {
            EntityType.CROP: [
                r"\b(rice|wheat|maize|cotton|sugarcane|tomato|potato|onion|chili|brinjal|okra|cabbage|cauliflower|carrot|radish|cucumber|watermelon|muskmelon|pumpkin|bitter gourd|ridge gourd|chickpea|lentil|black gram|green gram|pigeon pea|cowpea|mustard|groundnut|sunflower|soybean|sesame|castor|turmeric|ginger|garlic|coriander|cumin|fenugreek|mango|banana|papaya|guava|pomegranate|grapes|citrus)\b",
                r"\b(basmati|sona masuri|hd-2967|pbw-343|pusa|hybrid|variety)\b"
            ],
            EntityType.DISEASE: [
                r"\b(blight|rust|smut|mildew|wilt|rot|spot|scab|anthracnose|bacterial wilt|powdery mildew|downy mildew|leaf spot|root rot|stem rot|fruit rot|seed rot|yellow mosaic|mosaic virus|leaf curl|leaf roll)\b"
            ],
            EntityType.PEST: [
                r"\b(aphid|whitefly|thrips|mite|caterpillar|borer|beetle|weevil|bug|hopper|moth|butterfly|fly|mosquito|termite|ant|spider|nematode|slug|snail)\b"
            ],
            EntityType.LOCATION: [
                r"\b(punjab|haryana|uttar pradesh|maharashtra|karnataka|tamil nadu|west bengal|gujarat|rajasthan|madhya pradesh|bihar|odisha|andhra pradesh|telangana|kerala|assam|jharkhand|chhattisgarh|delhi|mumbai|bangalore|chennai|kolkata|hyderabad|ahmedabad|pune|surat|jaipur|lucknow|kanpur|nagpur|indore|thane|bhopal|visakhapatnam|pimpri|patna|vadodara|ghaziabad|ludhiana|agra|nashik|faridabad|meerut|rajkot|kalyan|vasai|varanasi|srinagar|aurangabad|noida|solapur|ranchi|coimbatore|raipur|kota|chandigarh|mysore|aligarh|gwalior|jalandhar|bhubaneswar|amritsar|nashik|jabalpur|jamshedpur|asansol|dhanbad|faridabad|allahabad|amroha|anantapur|bijapur|gulbarga|hubli|mangalore|mysore|tumkur|udupi|belgaum|bellary|bidar|chikmagalur|chitradurga|davangere|hassan|haveri|kodagu|kolar|mandya|raichur|shimoga|tumakuru|uttara kannada|vijayapura|yadgir)\b"
            ],
            EntityType.SEASON: [
                r"\b(kharif|rabi|zaid|monsoon|winter|summer|spring|autumn|june|july|august|september|october|november|december|january|february|march|april|may)\b"
            ],
            EntityType.SOIL_TYPE: [
                r"\b(clay|sandy|loamy|silt|black|red|alluvial|laterite|mountain|desert|coastal|alkaline|acidic|neutral)\b"
            ],
            EntityType.QUANTITY: [
                r"\b(\d+(?:\.\d+)?)\s*(?:acre|hectare|acres|hectares|kg|kilogram|quintal|ton|tons|litre|liter|liters|litres)\b"
            ],
            EntityType.TIME_PERIOD: [
                r"\b(\d+)\s*(?:day|days|week|weeks|month|months|year|years)\b",
                r"\b(today|tomorrow|yesterday|this week|next week|last week|this month|next month|last month)\b"
            ]
        }
    
    def _load_sentiment_indicators(self) -> Dict[SentimentType, List[str]]:
        """Load sentiment analysis indicators"""
        return {
            SentimentType.POSITIVE: [
                "good", "great", "excellent", "wonderful", "amazing", "fantastic", "perfect",
                "successful", "profitable", "healthy", "thriving", "growing well", "good yield"
            ],
            SentimentType.NEGATIVE: [
                "bad", "terrible", "awful", "horrible", "dying", "sick", "diseased", "damaged",
                "failed", "loss", "problem", "issue", "trouble", "worry", "concern", "struggling"
            ],
            SentimentType.URGENT: [
                "urgent", "emergency", "immediate", "asap", "critical", "serious", "dying",
                "quickly", "fast", "now", "today", "help", "save", "rescue"
            ]
        }
    
    async def classify_intent(self, user_input: str) -> IntentClassification:
        """Advanced intent classification with confidence scoring"""
        user_input_lower = user_input.lower()
        
        # Calculate confidence scores for each intent
        intent_scores = {}
        for intent_type, patterns in self.intent_patterns.items():
            score = 0
            matched_patterns = []
            
            for pattern in patterns:
                if re.search(pattern, user_input_lower, re.IGNORECASE):
                    score += 1
                    matched_patterns.append(pattern)
            
            if score > 0:
                intent_scores[intent_type] = {
                    'score': score,
                    'patterns': matched_patterns
                }
        
        # Determine primary intent
        if intent_scores:
            primary_intent = max(intent_scores.keys(), key=lambda x: intent_scores[x]['score'])
            primary_score = intent_scores[primary_intent]['score']
            max_possible_score = len(self.intent_patterns[primary_intent])
            confidence = min(primary_score / max_possible_score, 1.0)
        else:
            primary_intent = IntentType.GENERAL_QUESTION
            confidence = 0.1
        
        # Determine secondary intents
        secondary_intents = []
        for intent_type, data in intent_scores.items():
            if intent_type != primary_intent and data['score'] > 0:
                secondary_intents.append(intent_type)
        
        # Extract entities
        entities = await self.extract_entities(user_input)
        
        # Determine sentiment
        sentiment = self._analyze_sentiment(user_input_lower)
        
        # Determine urgency
        urgency = self._determine_urgency(user_input_lower)
        
        # Extract context clues
        context_clues = self._extract_context_clues(user_input_lower)
        
        return IntentClassification(
            primary_intent=primary_intent,
            secondary_intents=secondary_intents,
            confidence=confidence,
            entities=entities,
            sentiment=sentiment,
            urgency=urgency,
            context_clues=context_clues
        )
    
    async def extract_entities(self, user_input: str) -> List[Entity]:
        """Extract agricultural entities from user input"""
        entities = []
        user_input_lower = user_input.lower()
        
        for entity_type, patterns in self.entity_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, user_input_lower, re.IGNORECASE)
                for match in matches:
                    entity = Entity(
                        type=entity_type,
                        value=match.group().strip(),
                        confidence=0.8,  # Base confidence
                        start_pos=match.start(),
                        end_pos=match.end()
                    )
                    entities.append(entity)
        
        # Remove duplicates and sort by position
        unique_entities = []
        seen_values = set()
        for entity in sorted(entities, key=lambda x: x.start_pos):
            if entity.value not in seen_values:
                unique_entities.append(entity)
                seen_values.add(entity.value)
        
        return unique_entities
    
    def _analyze_sentiment(self, user_input: str) -> SentimentType:
        """Analyze sentiment of user input"""
        positive_count = sum(1 for word in self.sentiment_indicators[SentimentType.POSITIVE] 
                            if word in user_input)
        negative_count = sum(1 for word in self.sentiment_indicators[SentimentType.NEGATIVE] 
                            if word in user_input)
        urgent_count = sum(1 for word in self.sentiment_indicators[SentimentType.URGENT] 
                          if word in user_input)
        
        if urgent_count > 0:
            return SentimentType.URGENT
        elif positive_count > negative_count:
            return SentimentType.POSITIVE
        elif negative_count > positive_count:
            return SentimentType.NEGATIVE
        else:
            return SentimentType.NEUTRAL
    
    def _determine_urgency(self, user_input: str) -> str:
        """Determine urgency level of the query"""
        urgent_keywords = [
            "urgent", "emergency", "immediate", "asap", "critical", "serious",
            "dying", "quickly", "fast", "now", "today", "help", "save", "rescue"
        ]
        
        urgent_count = sum(1 for keyword in urgent_keywords if keyword in user_input)
        
        if urgent_count >= 2:
            return "high"
        elif urgent_count == 1:
            return "medium"
        else:
            return "low"
    
    def _extract_context_clues(self, user_input: str) -> List[str]:
        """Extract contextual clues from user input"""
        clues = []
        
        # Extract time references
        time_patterns = [
            r"this\s+(?:season|year|month|week)",
            r"next\s+(?:season|year|month|week)",
            r"last\s+(?:season|year|month|week)",
            r"currently", r"now", r"today", r"recently"
        ]
        
        for pattern in time_patterns:
            if re.search(pattern, user_input):
                clues.append("time_reference")
                break
        
        # Extract location references
        if any(location in user_input for location in self.agricultural_keywords["locations"]):
            clues.append("location_reference")
        
        # Extract quantity references
        if re.search(r"\d+\s*(?:acre|hectare|kg|quintal|ton)", user_input):
            clues.append("quantity_reference")
        
        # Extract problem indicators
        problem_keywords = ["problem", "issue", "trouble", "difficulty", "challenge"]
        if any(keyword in user_input for keyword in problem_keywords):
            clues.append("problem_indicator")
        
        return clues
    
    async def generate_contextual_response(self, intent_classification: IntentClassification, 
                                         user_input: str, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Generate contextual response based on intent and history"""
        
        # Determine response strategy based on intent and sentiment
        response_strategy = self._determine_response_strategy(intent_classification)
        
        # Extract relevant information from entities
        extracted_info = self._extract_relevant_info(intent_classification.entities)
        
        # Generate personalized response
        response = {
            "intent": intent_classification.primary_intent.value,
            "confidence": intent_classification.confidence,
            "strategy": response_strategy,
            "extracted_info": extracted_info,
            "sentiment": intent_classification.sentiment.value,
            "urgency": intent_classification.urgency,
            "context_clues": intent_classification.context_clues,
            "suggested_actions": self._get_suggested_actions(intent_classification),
            "follow_up_questions": self._generate_follow_up_questions(intent_classification)
        }
        
        return response
    
    def _determine_response_strategy(self, intent_classification: IntentClassification) -> str:
        """Determine the best response strategy based on intent and context"""
        intent = intent_classification.primary_intent
        sentiment = intent_classification.sentiment
        urgency = intent_classification.urgency
        
        if urgency == "high" or sentiment == SentimentType.URGENT:
            return "emergency_response"
        elif intent == IntentType.DISEASE_DIAGNOSIS or intent == IntentType.PEST_MANAGEMENT:
            return "diagnostic_response"
        elif intent == IntentType.CROP_RECOMMENDATION:
            return "recommendatory_response"
        elif intent == IntentType.MARKET_INQUIRY:
            return "informative_response"
        elif intent == IntentType.GENERAL_QUESTION:
            return "educational_response"
        else:
            return "interactive_response"
    
    def _extract_relevant_info(self, entities: List[Entity]) -> Dict[str, Any]:
        """Extract relevant information from entities"""
        info = {
            "crops": [],
            "diseases": [],
            "pests": [],
            "locations": [],
            "seasons": [],
            "soil_types": [],
            "quantities": [],
            "time_periods": []
        }
        
        for entity in entities:
            if entity.type == EntityType.CROP:
                info["crops"].append(entity.value)
            elif entity.type == EntityType.DISEASE:
                info["diseases"].append(entity.value)
            elif entity.type == EntityType.PEST:
                info["pests"].append(entity.value)
            elif entity.type == EntityType.LOCATION:
                info["locations"].append(entity.value)
            elif entity.type == EntityType.SEASON:
                info["seasons"].append(entity.value)
            elif entity.type == EntityType.SOIL_TYPE:
                info["soil_types"].append(entity.value)
            elif entity.type == EntityType.QUANTITY:
                info["quantities"].append(entity.value)
            elif entity.type == EntityType.TIME_PERIOD:
                info["time_periods"].append(entity.value)
        
        return info
    
    def _get_suggested_actions(self, intent_classification: IntentClassification) -> List[str]:
        """Get suggested actions based on intent"""
        intent = intent_classification.primary_intent
        
        action_map = {
            IntentType.CROP_RECOMMENDATION: [
                "Get soil test done",
                "Check weather forecast",
                "Research market prices",
                "Plan irrigation schedule"
            ],
            IntentType.DISEASE_DIAGNOSIS: [
                "Upload plant images for diagnosis",
                "Contact agricultural expert",
                "Apply recommended treatment",
                "Monitor plant health"
            ],
            IntentType.PEST_MANAGEMENT: [
                "Identify pest species",
                "Choose appropriate pesticide",
                "Implement IPM strategy",
                "Monitor pest population"
            ],
            IntentType.SOIL_MANAGEMENT: [
                "Test soil pH and nutrients",
                "Add organic matter",
                "Apply appropriate fertilizers",
                "Practice crop rotation"
            ],
            IntentType.WEATHER_ADVICE: [
                "Check weather forecast",
                "Prepare for extreme weather",
                "Adjust irrigation schedule",
                "Protect crops if needed"
            ],
            IntentType.MARKET_INQUIRY: [
                "Check local mandi prices",
                "Research export opportunities",
                "Consider contract farming",
                "Plan harvest timing"
            ]
        }
        
        return action_map.get(intent, ["Continue monitoring", "Seek expert advice"])
    
    def _generate_follow_up_questions(self, intent_classification: IntentClassification) -> List[str]:
        """Generate relevant follow-up questions"""
        intent = intent_classification.primary_intent
        entities = intent_classification.entities
        
        follow_up_map = {
            IntentType.CROP_RECOMMENDATION: [
                "What's your soil type?",
                "What's your farm size?",
                "What's your water availability?",
                "What's your budget for cultivation?"
            ],
            IntentType.DISEASE_DIAGNOSIS: [
                "What symptoms are you seeing?",
                "When did you first notice the problem?",
                "How much of your crop is affected?",
                "What treatments have you tried?"
            ],
            IntentType.PEST_MANAGEMENT: [
                "Which pest is causing damage?",
                "What's the extent of damage?",
                "Are you using any current treatments?",
                "Do you prefer organic solutions?"
            ],
            IntentType.SOIL_MANAGEMENT: [
                "When did you last test your soil?",
                "What crops did you grow previously?",
                "What fertilizers are you currently using?",
                "What's your soil pH level?"
            ]
        }
        
        # Customize questions based on extracted entities
        questions = follow_up_map.get(intent, ["How can I help you further?"])
        
        # Add entity-specific questions
        if any(entity.type == EntityType.LOCATION for entity in entities):
            questions.append("Are there any regional-specific considerations?")
        
        if any(entity.type == EntityType.QUANTITY for entity in entities):
            questions.append("What's your expected yield target?")
        
        return questions[:3]  # Limit to 3 questions

# Singleton instance
nlp_service = AdvancedNLPService()
