import asyncio
import json
import random
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from dataclasses import dataclass
from sqlalchemy.orm import Session

from app.services.nlp_service import IntentClassification as NLPIntentClassification, IntentType, SentimentType
from app.services.context_manager import ConversationContext, DynamicContextManager
from app.models.nlp_models import ResponseTemplate

@dataclass
class ResponseStrategy:
    type: str  # 'informative', 'diagnostic', 'recommendatory', 'educational', 'emergency'
    tone: str  # 'professional', 'friendly', 'urgent', 'encouraging'
    format: str  # 'text', 'structured', 'interactive', 'visual'
    personalization_level: int  # 1-5
    include_suggestions: bool
    include_follow_ups: bool

@dataclass
class GeneratedResponse:
    content: str
    strategy: ResponseStrategy
    confidence: float
    suggested_actions: List[str]
    follow_up_questions: List[str]
    metadata: Dict[str, Any]

class IntelligentResponseGenerator:
    def __init__(self, db_session: Session, context_manager: DynamicContextManager):
        self.db = db_session
        self.context_manager = context_manager
        self.response_templates = self._load_response_templates()
        self.agricultural_knowledge = self._load_agricultural_knowledge()
        
    def _load_response_templates(self) -> Dict[str, List[Dict]]:
        """Load response templates for different intents"""
        return {
            "crop_recommendation": [
                {
                    "template": "🌾 Based on your {location} location and {soil_type} soil, I recommend {crop_name} for the {season} season.",
                    "variables": ["location", "soil_type", "crop_name", "season"],
                    "tone": "recommendatory"
                },
                {
                    "template": "For {farm_size} farm in {location}, {crop_name} would be ideal because {reason}.",
                    "variables": ["farm_size", "location", "crop_name", "reason"],
                    "tone": "informative"
                }
            ],
            "disease_diagnosis": [
                {
                    "template": "🦠 The symptoms you're describing suggest {disease_name}. Here's what you can do: {treatment}",
                    "variables": ["disease_name", "treatment"],
                    "tone": "diagnostic"
                },
                {
                    "template": "Based on {symptoms}, this appears to be {disease_name}. Immediate action: {immediate_action}",
                    "variables": ["symptoms", "disease_name", "immediate_action"],
                    "tone": "urgent"
                }
            ],
            "pest_management": [
                {
                    "template": "🐛 For {pest_name} control, I recommend {treatment_method}. This is {effectiveness} effective.",
                    "variables": ["pest_name", "treatment_method", "effectiveness"],
                    "tone": "informative"
                }
            ],
            "soil_management": [
                {
                    "template": "🌱 Your {soil_type} soil needs {nutrient} supplementation. Add {fertilizer} at {rate}.",
                    "variables": ["soil_type", "nutrient", "fertilizer", "rate"],
                    "tone": "educational"
                }
            ],
            "market_inquiry": [
                {
                    "template": "📈 Current market price for {crop_name} in {location} is ₹{price}/quintal. Trend: {trend}",
                    "variables": ["crop_name", "location", "price", "trend"],
                    "tone": "informative"
                }
            ],
            "weather_advice": [
                {
                    "template": "🌤️ Weather forecast for {location}: {forecast}. Farming advice: {advice}",
                    "variables": ["location", "forecast", "advice"],
                    "tone": "informative"
                }
            ],
            "emergency_help": [
                {
                    "template": "🚨 URGENT: {emergency_type} detected. Immediate action required: {action}. Contact: {contact}",
                    "variables": ["emergency_type", "action", "contact"],
                    "tone": "urgent"
                }
            ]
        }
    
    def _load_agricultural_knowledge(self) -> Dict[str, Any]:
        """Load agricultural knowledge base"""
        return {
            "crop_recommendations": {
                "rice": {
                    "seasons": ["kharif"],
                    "soil_types": ["clay", "loamy"],
                    "water_requirement": "high",
                    "duration": "120-150 days",
                    "yield": "4-6 tons/hectare",
                    "market_price": "₹2200-2800/quintal"
                },
                "wheat": {
                    "seasons": ["rabi"],
                    "soil_types": ["loamy", "clay"],
                    "water_requirement": "medium",
                    "duration": "120-140 days",
                    "yield": "4-5 tons/hectare",
                    "market_price": "₹2100-2400/quintal"
                },
                "cotton": {
                    "seasons": ["kharif"],
                    "soil_types": ["black", "alluvial"],
                    "water_requirement": "medium",
                    "duration": "150-180 days",
                    "yield": "2-3 tons/hectare",
                    "market_price": "₹6500-7200/quintal"
                },
                "tomato": {
                    "seasons": ["rabi", "zaid"],
                    "soil_types": ["loamy", "sandy"],
                    "water_requirement": "medium",
                    "duration": "90-120 days",
                    "yield": "25-30 tons/hectare",
                    "market_price": "₹40-80/kg"
                }
            },
            "disease_treatments": {
                "bacterial_wilt": {
                    "symptoms": ["wilting", "yellowing", "stunted growth"],
                    "treatment": "Remove infected plants, apply copper-based fungicide",
                    "prevention": "Use disease-resistant varieties, proper drainage"
                },
                "powdery_mildew": {
                    "symptoms": ["white powdery coating", "leaf distortion"],
                    "treatment": "Apply sulfur-based fungicide, improve air circulation",
                    "prevention": "Avoid overhead watering, proper spacing"
                },
                "leaf_spot": {
                    "symptoms": ["brown spots on leaves", "leaf drop"],
                    "treatment": "Apply copper fungicide, remove affected leaves",
                    "prevention": "Avoid wetting leaves, proper spacing"
                }
            },
            "pest_control": {
                "aphid": {
                    "damage": ["stunted growth", "curled leaves", "honeydew"],
                    "treatment": "Neem oil, insecticidal soap, beneficial insects",
                    "prevention": "Companion planting, regular monitoring"
                },
                "whitefly": {
                    "damage": ["yellowing leaves", "sticky honeydew"],
                    "treatment": "Yellow sticky traps, neem oil, beneficial insects",
                    "prevention": "Reflective mulch, proper ventilation"
                },
                "caterpillar": {
                    "damage": ["chewed leaves", "holes in fruits"],
                    "treatment": "Bacillus thuringiensis, hand picking",
                    "prevention": "Row covers, beneficial insects"
                }
            },
            "soil_improvements": {
                "clay": {
                    "issues": ["poor drainage", "compaction"],
                    "solutions": ["add sand", "organic matter", "gypsum"],
                    "suitable_crops": ["rice", "wheat", "cotton"]
                },
                "sandy": {
                    "issues": ["poor water retention", "nutrient leaching"],
                    "solutions": ["add clay", "organic matter", "mulching"],
                    "suitable_crops": ["groundnut", "cotton", "millet"]
                },
                "loamy": {
                    "issues": ["generally good"],
                    "solutions": ["maintain organic matter"],
                    "suitable_crops": ["most crops"]
                }
            }
        }
    
    async def generate_response(self, intent_classification: NLPIntentClassification, 
                              user_input: str, context: ConversationContext) -> GeneratedResponse:
        """Generate intelligent, contextual response"""
        
        # Determine response strategy
        strategy = self._determine_response_strategy(intent_classification, context)
        
        # Generate base response content
        content = await self._generate_response_content(intent_classification, context, strategy)
        
        # Personalize response
        personalized_content = await self._personalize_response(content, context, strategy)
        
        # Generate suggested actions
        suggested_actions = await self._generate_suggested_actions(intent_classification, context)
        
        # Generate follow-up questions
        follow_up_questions = await self._generate_follow_up_questions(intent_classification, context)
        
        # Calculate confidence
        confidence = self._calculate_response_confidence(intent_classification, context)
        
        # Create metadata
        metadata = {
            "intent": intent_classification.primary_intent.value,
            "entities": [{"type": e.type.value, "value": e.value} for e in intent_classification.entities],
            "sentiment": intent_classification.sentiment.value,
            "urgency": intent_classification.urgency,
            "context_clues": intent_classification.context_clues,
            "generated_at": datetime.now().isoformat(),
            "template_used": strategy.type
        }
        
        return GeneratedResponse(
            content=personalized_content,
            strategy=strategy,
            confidence=confidence,
            suggested_actions=suggested_actions,
            follow_up_questions=follow_up_questions,
            metadata=metadata
        )
    
    def _determine_response_strategy(self, intent_classification: NLPIntentClassification, 
                                   context: ConversationContext) -> ResponseStrategy:
        """Determine the best response strategy"""
        intent = intent_classification.primary_intent
        sentiment = intent_classification.sentiment
        urgency = intent_classification.urgency
        
        # Determine response type
        if urgency == "high" or sentiment == SentimentType.URGENT:
            response_type = "emergency"
            tone = "urgent"
            personalization_level = 5
        elif intent == IntentType.DISEASE_DIAGNOSIS:
            response_type = "diagnostic"
            tone = "professional"
            personalization_level = 4
        elif intent == IntentType.CROP_RECOMMENDATION:
            response_type = "recommendatory"
            tone = "friendly"
            personalization_level = 5
        elif intent == IntentType.MARKET_INQUIRY:
            response_type = "informative"
            tone = "professional"
            personalization_level = 3
        elif intent == IntentType.SOIL_MANAGEMENT:
            response_type = "educational"
            tone = "friendly"
            personalization_level = 4
        else:
            response_type = "interactive"
            tone = "friendly"
            personalization_level = 3
        
        # Adjust tone based on user preferences
        if context.user_preferences and context.user_preferences.communication_style:
            if context.user_preferences.communication_style == "direct":
                tone = "professional"
            elif context.user_preferences.communication_style == "encouraging":
                tone = "encouraging"
        
        return ResponseStrategy(
            type=response_type,
            tone=tone,
            format="text",
            personalization_level=personalization_level,
            include_suggestions=True,
            include_follow_ups=True
        )
    
    async def _generate_response_content(self, intent_classification: NLPIntentClassification, 
                                       context: ConversationContext, strategy: ResponseStrategy) -> str:
        """Generate base response content"""
        intent = intent_classification.primary_intent.value
        entities = intent_classification.entities
        
        # Extract relevant information
        extracted_info = self._extract_entity_info(entities)
        
        # Get appropriate template
        template = self._get_response_template(intent, strategy)
        
        if template:
            # Fill template with extracted information
            content = self._fill_template(template, extracted_info, context)
        else:
            # Generate dynamic response
            content = await self._generate_dynamic_response(intent_classification, context, strategy)
        
        return content
    
    def _get_response_template(self, intent: str, strategy: ResponseStrategy) -> Optional[Dict]:
        """Get appropriate response template"""
        templates = self.response_templates.get(intent, [])
        
        if not templates:
            return None
        
        # Filter by tone if available
        tone_templates = [t for t in templates if t.get("tone") == strategy.tone]
        if tone_templates:
            return random.choice(tone_templates)
        
        return random.choice(templates)
    
    def _fill_template(self, template: Dict, extracted_info: Dict, context: ConversationContext) -> str:
        """Fill template with extracted information"""
        template_text = template["template"]
        variables = template.get("variables", [])
        
        # Create variable mapping
        var_map = {}
        
        for var in variables:
            if var == "location" and context.user_preferences.location:
                var_map[var] = context.user_preferences.location
            elif var == "soil_type" and context.user_preferences.soil_type:
                var_map[var] = context.user_preferences.soil_type
            elif var == "farm_size" and context.user_preferences.farm_size:
                var_map[var] = context.user_preferences.farm_size
            elif var in extracted_info:
                var_map[var] = extracted_info[var]
            else:
                var_map[var] = self._get_default_value(var)
        
        # Fill template
        try:
            content = template_text.format(**var_map)
        except KeyError as e:
            # Fallback to dynamic generation if template fails
            content = f"I understand you're asking about {var_map.get('crop_name', 'agriculture')}. Let me help you with that."
        
        return content
    
    def _get_default_value(self, variable: str) -> str:
        """Get default value for template variable"""
        defaults = {
            "location": "your region",
            "soil_type": "your soil",
            "farm_size": "your farm",
            "crop_name": "suitable crops",
            "season": "current season",
            "disease_name": "plant disease",
            "pest_name": "pest",
            "treatment": "appropriate treatment",
            "price": "current market price",
            "forecast": "weather conditions",
            "advice": "farming advice"
        }
        return defaults.get(variable, "relevant information")
    
    def _extract_entity_info(self, entities: List) -> Dict[str, Any]:
        """Extract information from entities"""
        info = {}
        
        for entity in entities:
            entity_type = entity.type.value
            entity_value = entity.value
            
            if entity_type == "crop":
                info["crop_name"] = entity_value
                # Add crop knowledge
                crop_info = self.agricultural_knowledge["crop_recommendations"].get(entity_value.lower())
                if crop_info:
                    info["crop_info"] = crop_info
            elif entity_type == "disease":
                info["disease_name"] = entity_value
                # Add disease knowledge
                disease_info = self.agricultural_knowledge["disease_treatments"].get(entity_value.lower())
                if disease_info:
                    info["disease_info"] = disease_info
            elif entity_type == "pest":
                info["pest_name"] = entity_value
                # Add pest knowledge
                pest_info = self.agricultural_knowledge["pest_control"].get(entity_value.lower())
                if pest_info:
                    info["pest_info"] = pest_info
            elif entity_type == "location":
                info["location"] = entity_value
            elif entity_type == "season":
                info["season"] = entity_value
            elif entity_type == "soil_type":
                info["soil_type"] = entity_value
                # Add soil knowledge
                soil_info = self.agricultural_knowledge["soil_improvements"].get(entity_value.lower())
                if soil_info:
                    info["soil_info"] = soil_info
        
        return info
    
    async def _generate_dynamic_response(self, intent_classification: NLPIntentClassification, 
                                      context: ConversationContext, strategy: ResponseStrategy) -> str:
        """Generate dynamic response when no template is available"""
        intent = intent_classification.primary_intent.value
        entities = intent_classification.entities
        sentiment = intent_classification.sentiment.value
        
        # Base response based on intent
        if intent == "crop_recommendation":
            content = "🌾 I'd be happy to help you with crop recommendations! "
            if entities:
                crops = [e.value for e in entities if e.type.value == "crop"]
                if crops:
                    content += f"For {', '.join(crops)}, I can provide specific growing advice. "
        elif intent == "disease_diagnosis":
            content = "🦠 I understand you're concerned about plant health. "
            if entities:
                diseases = [e.value for e in entities if e.type.value == "disease"]
                if diseases:
                    content += f"Let me help you with {', '.join(diseases)} management. "
        elif intent == "pest_management":
            content = "🐛 Pest management is crucial for healthy crops. "
            if entities:
                pests = [e.value for e in entities if e.type.value == "pest"]
                if pests:
                    content += f"I can help you control {', '.join(pests)} effectively. "
        elif intent == "soil_management":
            content = "🌱 Soil health is the foundation of good farming. "
            if entities:
                soil_types = [e.value for e in entities if e.type.value == "soil_type"]
                if soil_types:
                    content += f"For {', '.join(soil_types)} soil, I have specific recommendations. "
        elif intent == "market_inquiry":
            content = "📈 Market intelligence helps maximize profits. "
            if entities:
                crops = [e.value for e in entities if e.type.value == "crop"]
                if crops:
                    content += f"Let me share current market insights for {', '.join(crops)}. "
        else:
            content = "🌱 I'm here to help with your agricultural needs! "
        
        # Add personalized touch
        if context.user_preferences and context.user_preferences.location:
            content += f"Since you're in {context.user_preferences.location}, "
        
        # Add urgency indicator
        if sentiment == "urgent":
            content += "This seems urgent, so let me provide immediate assistance. "
        
        # Add context from conversation
        if context.current_topic and context.current_topic != intent:
            content += f"Building on our discussion about {context.current_topic}, "
        
        return content
    
    async def _personalize_response(self, content: str, context: ConversationContext, 
                                  strategy: ResponseStrategy) -> str:
        """Personalize response based on user context"""
        if strategy.personalization_level < 3:
            return content
        
        personalized_content = content
        
        # Add user-specific information
        if context.user_preferences:
            if context.user_preferences.farm_size and strategy.personalization_level >= 4:
                personalized_content += f" For your {context.user_preferences.farm_size} farm, "
            
            if context.user_preferences.farming_experience and strategy.personalization_level >= 3:
                if "beginner" in context.user_preferences.farming_experience.lower():
                    personalized_content += "As a beginner farmer, I'll explain everything step by step. "
                elif "experienced" in context.user_preferences.farming_experience.lower():
                    personalized_content += "Given your experience, I'll focus on advanced techniques. "
        
        # Add conversation context
        if context.conversation_history and len(context.conversation_history) > 2:
            recent_topics = [h.get("intent") for h in context.conversation_history[-4:]]
            unique_topics = list(set(recent_topics))
            if len(unique_topics) > 1:
                personalized_content += f" I notice we've been discussing {', '.join(unique_topics[:2])}. "
        
        # Add regional considerations
        if context.user_preferences and context.user_preferences.location:
            location = context.user_preferences.location.lower()
            if any(state in location for state in ["punjab", "haryana"]):
                personalized_content += "Given your location in the wheat belt, "
            elif any(state in location for state in ["maharashtra", "gujarat"]):
                personalized_content += "In your cotton-growing region, "
            elif any(state in location for state in ["karnataka", "tamil nadu"]):
                personalized_content += "In your rice-growing region, "
        
        return personalized_content
    
    async def _generate_suggested_actions(self, intent_classification: NLPIntentClassification, 
                                        context: ConversationContext) -> List[str]:
        """Generate suggested actions based on intent and context"""
        intent = intent_classification.primary_intent.value
        entities = intent_classification.entities
        
        actions = []
        
        if intent == "crop_recommendation":
            actions.extend([
                "Get soil test done for accurate recommendations",
                "Check weather forecast for planting timing",
                "Research market prices for profitability",
                "Plan irrigation and water management"
            ])
        elif intent == "disease_diagnosis":
            actions.extend([
                "Upload plant images for accurate diagnosis",
                "Isolate affected plants to prevent spread",
                "Apply recommended treatment immediately",
                "Monitor plant health regularly"
            ])
        elif intent == "pest_management":
            actions.extend([
                "Identify pest species accurately",
                "Choose appropriate control method",
                "Implement integrated pest management",
                "Monitor pest population levels"
            ])
        elif intent == "soil_management":
            actions.extend([
                "Test soil pH and nutrient levels",
                "Add organic matter and compost",
                "Apply appropriate fertilizers",
                "Practice crop rotation"
            ])
        elif intent == "market_inquiry":
            actions.extend([
                "Check local mandi prices",
                "Research export opportunities",
                "Consider contract farming options",
                "Plan optimal harvest timing"
            ])
        
        # Add context-specific actions
        if context.user_preferences and not context.user_preferences.location:
            actions.append("Share your location for region-specific advice")
        
        if context.user_preferences and not context.user_preferences.farm_size:
            actions.append("Provide farm size for yield calculations")
        
        return actions[:4]  # Limit to 4 actions
    
    async def _generate_follow_up_questions(self, intent_classification: NLPIntentClassification, 
                                         context: ConversationContext) -> List[str]:
        """Generate follow-up questions based on intent and context"""
        intent = intent_classification.primary_intent.value
        entities = intent_classification.entities
        
        questions = []
        
        if intent == "crop_recommendation":
            if not any(e.type.value == "location" for e in entities):
                questions.append("What's your location/state for region-specific advice?")
            if not any(e.type.value == "soil_type" for e in entities):
                questions.append("What type of soil do you have?")
            if not any(e.type.value == "quantity" for e in entities):
                questions.append("What's your farm size?")
            questions.append("What's your budget for cultivation?")
        
        elif intent == "disease_diagnosis":
            questions.extend([
                "What specific symptoms are you seeing?",
                "When did you first notice the problem?",
                "How much of your crop is affected?",
                "What treatments have you tried so far?"
            ])
        
        elif intent == "pest_management":
            questions.extend([
                "Which pest is causing damage?",
                "What's the extent of damage?",
                "Do you prefer organic or chemical control?",
                "What's your current pest management strategy?"
            ])
        
        elif intent == "soil_management":
            questions.extend([
                "When did you last test your soil?",
                "What crops did you grow previously?",
                "What fertilizers are you currently using?",
                "What's your soil pH level?"
            ])
        
        # Add context-specific questions
        if context.user_preferences and context.user_preferences.preferred_crops:
            questions.append(f"Are you interested in growing {', '.join(context.user_preferences.preferred_crops[:2])}?")
        
        return questions[:3]  # Limit to 3 questions
    
    def _calculate_response_confidence(self, intent_classification: NLPIntentClassification, 
                                     context: ConversationContext) -> float:
        """Calculate confidence score for the response"""
        base_confidence = intent_classification.confidence
        
        # Increase confidence based on context
        if context.user_preferences and context.user_preferences.location:
            base_confidence += 0.1
        
        if context.user_preferences and context.user_preferences.farm_size:
            base_confidence += 0.1
        
        if context.user_preferences and context.user_preferences.soil_type:
            base_confidence += 0.1
        
        # Increase confidence based on conversation history
        if context.conversation_history and len(context.conversation_history) > 2:
            base_confidence += 0.05
        
        # Increase confidence based on entity extraction
        if intent_classification.entities:
            base_confidence += min(len(intent_classification.entities) * 0.05, 0.2)
        
        return min(base_confidence, 1.0)
    
    async def learn_from_interaction(self, intent_classification: NLPIntentClassification, 
                                   user_input: str, bot_response: str, user_feedback: Optional[int] = None):
        """Learn from user interaction to improve future responses"""
        # This would be implemented to update response templates and improve future responses
        # For now, we'll just log the interaction
        pass
