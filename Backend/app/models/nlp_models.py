from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime
from typing import Dict, List, Optional, Any

Base = declarative_base()

class ConversationSession(Base):
    """Store conversation sessions for context management"""
    __tablename__ = "conversation_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), unique=True, index=True)
    user_id = Column(String(255), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # User profile data
    user_location = Column(String(255))
    farm_size = Column(String(100))
    soil_type = Column(String(100))
    farming_experience = Column(String(100))
    preferred_crops = Column(JSON)
    
    # Conversation context
    current_topic = Column(String(255))
    conversation_summary = Column(Text)
    last_interaction = Column(DateTime(timezone=True))

class IntentClassification(Base):
    """Store intent classification results for learning"""
    __tablename__ = "intent_classifications"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), index=True)
    user_input = Column(Text)
    primary_intent = Column(String(100))
    secondary_intents = Column(JSON)
    confidence_score = Column(Float)
    entities = Column(JSON)
    sentiment = Column(String(50))
    urgency = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ConversationMemory(Base):
    """Store conversation history and learning data"""
    __tablename__ = "conversation_memory"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), index=True)
    message_type = Column(String(50))  # 'user' or 'bot'
    content = Column(Text)
    intent = Column(String(100))
    entities = Column(JSON)
    response_quality = Column(Float)  # User feedback score
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserPreferences(Base):
    """Store learned user preferences"""
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), index=True)
    preference_type = Column(String(100))  # 'crop_interest', 'problem_area', 'communication_style'
    preference_value = Column(String(255))
    confidence = Column(Float)
    interaction_count = Column(Integer, default=1)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())

class ResponseTemplate(Base):
    """Store dynamic response templates"""
    __tablename__ = "response_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    intent_category = Column(String(100), index=True)
    template_name = Column(String(255))
    template_content = Column(Text)
    variables = Column(JSON)  # Template variables
    usage_count = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AgriculturalEntity(Base):
    """Store agricultural entities and their relationships"""
    __tablename__ = "agricultural_entities"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_name = Column(String(255), index=True)
    entity_type = Column(String(100))  # 'crop', 'disease', 'pest', 'equipment', 'location'
    synonyms = Column(JSON)
    description = Column(Text)
    related_entities = Column(JSON)
    regional_variants = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
