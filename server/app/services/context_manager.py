import asyncio
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.nlp_models import (
    ConversationSession, IntentClassification, ConversationMemory, 
    UserPreferences, ResponseTemplate, AgriculturalEntity
)
from app.services.nlp_service import IntentClassification as NLPIntentClassification

@dataclass
class UserProfile:
    user_id: str
    location: Optional[str] = None
    farm_size: Optional[str] = None
    soil_type: Optional[str] = None
    farming_experience: Optional[str] = None
    preferred_crops: List[str] = None
    communication_style: str = "friendly"
    last_updated: datetime = None

@dataclass
class ConversationContext:
    session_id: str
    user_id: str
    current_topic: Optional[str] = None
    conversation_summary: Optional[str] = None
    active_entities: Dict[str, Any] = None
    follow_up_questions: List[str] = None
    user_preferences: UserProfile = None
    conversation_history: List[Dict] = None

class DynamicContextManager:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.active_sessions: Dict[str, ConversationContext] = {}
        self.user_profiles: Dict[str, UserProfile] = {}
        
    async def get_or_create_session(self, user_id: str, session_id: Optional[str] = None) -> ConversationContext:
        """Get existing session or create new one"""
        if not session_id:
            session_id = f"{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Check if session exists in memory
        if session_id in self.active_sessions:
            return self.active_sessions[session_id]
        
        # Check database for existing session
        db_session = self.db.query(ConversationSession).filter(
            ConversationSession.session_id == session_id
        ).first()
        
        if db_session:
            context = await self._load_context_from_db(db_session)
        else:
            context = await self._create_new_context(user_id, session_id)
        
        self.active_sessions[session_id] = context
        return context
    
    async def _load_context_from_db(self, db_session: ConversationSession) -> ConversationContext:
        """Load conversation context from database"""
        # Load user profile
        user_profile = UserProfile(
            user_id=db_session.user_id,
            location=db_session.user_location,
            farm_size=db_session.farm_size,
            soil_type=db_session.soil_type,
            farming_experience=db_session.farming_experience,
            preferred_crops=db_session.preferred_crops or [],
            last_updated=db_session.updated_at
        )
        
        # Load conversation history
        history = self.db.query(ConversationMemory).filter(
            ConversationMemory.session_id == db_session.session_id
        ).order_by(ConversationMemory.created_at.desc()).limit(10).all()
        
        conversation_history = []
        for memory in history:
            conversation_history.append({
                "type": memory.message_type,
                "content": memory.content,
                "intent": memory.intent,
                "entities": memory.entities,
                "timestamp": memory.created_at.isoformat()
            })
        
        context = ConversationContext(
            session_id=db_session.session_id,
            user_id=db_session.user_id,
            current_topic=db_session.current_topic,
            conversation_summary=db_session.conversation_summary,
            active_entities={},
            follow_up_questions=[],
            user_preferences=user_profile,
            conversation_history=conversation_history
        )
        
        return context
    
    async def _create_new_context(self, user_id: str, session_id: str) -> ConversationContext:
        """Create new conversation context"""
        # Load or create user profile
        user_profile = await self._get_user_profile(user_id)
        
        # Create database session
        db_session = ConversationSession(
            session_id=session_id,
            user_id=user_id,
            is_active=True,
            created_at=datetime.now()
        )
        self.db.add(db_session)
        self.db.commit()
        
        context = ConversationContext(
            session_id=session_id,
            user_id=user_id,
            current_topic=None,
            conversation_summary=None,
            active_entities={},
            follow_up_questions=[],
            user_preferences=user_profile,
            conversation_history=[]
        )
        
        return context
    
    async def _get_user_profile(self, user_id: str) -> UserProfile:
        """Get or create user profile"""
        if user_id in self.user_profiles:
            return self.user_profiles[user_id]
        
        # Check database for existing profile
        db_session = self.db.query(ConversationSession).filter(
            ConversationSession.user_id == user_id
        ).order_by(ConversationSession.created_at.desc()).first()
        
        if db_session:
            profile = UserProfile(
                user_id=user_id,
                location=db_session.user_location,
                farm_size=db_session.farm_size,
                soil_type=db_session.soil_type,
                farming_experience=db_session.farming_experience,
                preferred_crops=db_session.preferred_crops or [],
                last_updated=db_session.updated_at
            )
        else:
            profile = UserProfile(user_id=user_id)
        
        self.user_profiles[user_id] = profile
        return profile
    
    async def update_context(self, session_id: str, intent_classification: NLPIntentClassification, 
                           user_input: str, bot_response: str) -> ConversationContext:
        """Update conversation context with new interaction"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        context = self.active_sessions[session_id]
        
        # Update current topic
        context.current_topic = intent_classification.primary_intent.value
        
        # Update active entities
        for entity in intent_classification.entities:
            entity_type = entity.type.value
            if entity_type not in context.active_entities:
                context.active_entities[entity_type] = []
            
            if entity.value not in context.active_entities[entity_type]:
                context.active_entities[entity_type].append(entity.value)
        
        # Update conversation history
        interaction = {
            "type": "user",
            "content": user_input,
            "intent": intent_classification.primary_intent.value,
            "entities": [{"type": e.type.value, "value": e.value} for e in intent_classification.entities],
            "timestamp": datetime.now().isoformat()
        }
        context.conversation_history.append(interaction)
        
        bot_interaction = {
            "type": "bot",
            "content": bot_response,
            "intent": intent_classification.primary_intent.value,
            "entities": [],
            "timestamp": datetime.now().isoformat()
        }
        context.conversation_history.append(bot_interaction)
        
        # Update user preferences based on interaction
        await self._update_user_preferences(context, intent_classification, user_input)
        
        # Generate follow-up questions
        context.follow_up_questions = self._generate_contextual_follow_ups(context, intent_classification)
        
        # Update conversation summary
        context.conversation_summary = await self._generate_conversation_summary(context)
        
        # Save to database
        await self._save_context_to_db(context)
        
        return context
    
    async def _update_user_preferences(self, context: ConversationContext, 
                                    intent_classification: NLPIntentClassification, 
                                    user_input: str):
        """Update user preferences based on interaction"""
        user_id = context.user_id
        
        # Extract preference information from entities
        for entity in intent_classification.entities:
            if entity.type.value == "crop":
                await self._update_preference(user_id, "crop_interest", entity.value, 0.8)
            elif entity.type.value == "location":
                context.user_preferences.location = entity.value
            elif entity.type.value == "soil_type":
                context.user_preferences.soil_type = entity.value
            elif entity.type.value == "quantity":
                # Extract farm size from quantity entities
                if "acre" in entity.value or "hectare" in entity.value:
                    context.user_preferences.farm_size = entity.value
        
        # Update communication style based on sentiment
        if intent_classification.sentiment.value == "urgent":
            context.user_preferences.communication_style = "direct"
        elif intent_classification.sentiment.value == "positive":
            context.user_preferences.communication_style = "encouraging"
        
        context.user_preferences.last_updated = datetime.now()
    
    async def _update_preference(self, user_id: str, preference_type: str, 
                               preference_value: str, confidence: float):
        """Update user preference in database"""
        existing = self.db.query(UserPreferences).filter(
            and_(
                UserPreferences.user_id == user_id,
                UserPreferences.preference_type == preference_type,
                UserPreferences.preference_value == preference_value
            )
        ).first()
        
        if existing:
            existing.interaction_count += 1
            existing.confidence = min(existing.confidence + 0.1, 1.0)
            existing.last_updated = datetime.now()
        else:
            new_preference = UserPreferences(
                user_id=user_id,
                preference_type=preference_type,
                preference_value=preference_value,
                confidence=confidence,
                interaction_count=1,
                last_updated=datetime.now()
            )
            self.db.add(new_preference)
        
        self.db.commit()
    
    def _generate_contextual_follow_ups(self, context: ConversationContext, 
                                       intent_classification: NLPIntentClassification) -> List[str]:
        """Generate contextual follow-up questions"""
        follow_ups = []
        intent = intent_classification.primary_intent.value
        
        # Generate follow-ups based on missing information
        if not context.user_preferences.location and intent == "crop_recommendation":
            follow_ups.append("What's your location/state? This helps me give region-specific advice.")
        
        if not context.user_preferences.farm_size and intent == "crop_recommendation":
            follow_ups.append("What's your farm size? This helps me calculate realistic yields.")
        
        if not context.user_preferences.soil_type and intent in ["crop_recommendation", "soil_management"]:
            follow_ups.append("What type of soil do you have? (clay, sandy, loamy, etc.)")
        
        # Generate follow-ups based on conversation context
        if intent == "disease_diagnosis" and not any(e.type.value == "disease" for e in intent_classification.entities):
            follow_ups.append("Can you describe the symptoms you're seeing?")
        
        if intent == "pest_management" and not any(e.type.value == "pest" for e in intent_classification.entities):
            follow_ups.append("Which pest is causing damage to your crops?")
        
        # Generate follow-ups based on conversation history
        recent_topics = [h.get("intent") for h in context.conversation_history[-6:]]
        if "crop_recommendation" in recent_topics and "market_inquiry" not in recent_topics:
            follow_ups.append("Would you like to know about current market prices for these crops?")
        
        return follow_ups[:3]  # Limit to 3 follow-ups
    
    async def _generate_conversation_summary(self, context: ConversationContext) -> str:
        """Generate conversation summary"""
        if not context.conversation_history:
            return "New conversation started"
        
        # Extract key topics from recent interactions
        recent_intents = [h.get("intent") for h in context.conversation_history[-6:]]
        unique_intents = list(set(recent_intents))
        
        # Extract key entities
        all_entities = []
        for interaction in context.conversation_history[-6:]:
            if interaction.get("entities"):
                all_entities.extend(interaction["entities"])
        
        # Create summary
        summary_parts = []
        
        if unique_intents:
            summary_parts.append(f"Topics discussed: {', '.join(unique_intents)}")
        
        if context.user_preferences.location:
            summary_parts.append(f"Location: {context.user_preferences.location}")
        
        if context.user_preferences.farm_size:
            summary_parts.append(f"Farm size: {context.user_preferences.farm_size}")
        
        if context.user_preferences.soil_type:
            summary_parts.append(f"Soil type: {context.user_preferences.soil_type}")
        
        # Extract key crops mentioned
        crops_mentioned = [e["value"] for e in all_entities if e.get("type") == "crop"]
        if crops_mentioned:
            unique_crops = list(set(crops_mentioned))
            summary_parts.append(f"Crops discussed: {', '.join(unique_crops[:3])}")
        
        return ". ".join(summary_parts) if summary_parts else "Conversation in progress"
    
    async def _save_context_to_db(self, context: ConversationContext):
        """Save conversation context to database"""
        # Update session
        db_session = self.db.query(ConversationSession).filter(
            ConversationSession.session_id == context.session_id
        ).first()
        
        if db_session:
            db_session.current_topic = context.current_topic
            db_session.conversation_summary = context.conversation_summary
            db_session.last_interaction = datetime.now()
            db_session.updated_at = datetime.now()
            
            # Update user profile data
            if context.user_preferences.location:
                db_session.user_location = context.user_preferences.location
            if context.user_preferences.farm_size:
                db_session.farm_size = context.user_preferences.farm_size
            if context.user_preferences.soil_type:
                db_session.soil_type = context.user_preferences.soil_type
            if context.user_preferences.farming_experience:
                db_session.farming_experience = context.user_preferences.farming_experience
            if context.user_preferences.preferred_crops:
                db_session.preferred_crops = context.user_preferences.preferred_crops
        
        # Save conversation memory
        for interaction in context.conversation_history[-2:]:  # Save last 2 interactions
            memory = ConversationMemory(
                session_id=context.session_id,
                message_type=interaction["type"],
                content=interaction["content"],
                intent=interaction.get("intent"),
                entities=interaction.get("entities"),
                created_at=datetime.fromisoformat(interaction["timestamp"])
            )
            self.db.add(memory)
        
        self.db.commit()
    
    async def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences for personalization"""
        preferences = self.db.query(UserPreferences).filter(
            UserPreferences.user_id == user_id
        ).all()
        
        pref_dict = {}
        for pref in preferences:
            if pref.preference_type not in pref_dict:
                pref_dict[pref.preference_type] = []
            
            pref_dict[pref.preference_type].append({
                "value": pref.preference_value,
                "confidence": pref.confidence,
                "count": pref.interaction_count
            })
        
        return pref_dict
    
    async def get_conversation_suggestions(self, context: ConversationContext) -> List[str]:
        """Get conversation suggestions based on context"""
        suggestions = []
        
        # Suggest based on user profile gaps
        if not context.user_preferences.location:
            suggestions.append("Tell me about your location for better advice")
        
        if not context.user_preferences.farm_size:
            suggestions.append("Share your farm size for yield calculations")
        
        if not context.user_preferences.soil_type:
            suggestions.append("What's your soil type? I can suggest suitable crops")
        
        # Suggest based on conversation history
        recent_intents = [h.get("intent") for h in context.conversation_history[-4:]]
        
        if "crop_recommendation" in recent_intents and "market_inquiry" not in recent_intents:
            suggestions.append("Check current market prices for your crops")
        
        if "disease_diagnosis" in recent_intents and "pest_management" not in recent_intents:
            suggestions.append("Learn about pest management strategies")
        
        if "soil_management" in recent_intents and "irrigation_advice" not in recent_intents:
            suggestions.append("Get advice on water management")
        
        return suggestions[:3]  # Limit to 3 suggestions
    
    async def cleanup_old_sessions(self, days: int = 7):
        """Clean up old inactive sessions"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Mark old sessions as inactive
        old_sessions = self.db.query(ConversationSession).filter(
            and_(
                ConversationSession.last_interaction < cutoff_date,
                ConversationSession.is_active == True
            )
        ).all()
        
        for session in old_sessions:
            session.is_active = False
        
        self.db.commit()
        
        # Remove from memory
        for session_id in list(self.active_sessions.keys()):
            if session_id in [s.session_id for s in old_sessions]:
                del self.active_sessions[session_id]
    
    def get_session_stats(self) -> Dict[str, Any]:
        """Get session statistics"""
        active_count = len(self.active_sessions)
        total_sessions = self.db.query(ConversationSession).count()
        active_db_sessions = self.db.query(ConversationSession).filter(
            ConversationSession.is_active == True
        ).count()
        
        return {
            "active_in_memory": active_count,
            "active_in_db": active_db_sessions,
            "total_sessions": total_sessions,
            "user_profiles_cached": len(self.user_profiles)
        }
