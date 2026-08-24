from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class GovernmentScheme(Base):
    __tablename__ = "government_schemes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    eligibility_criteria = Column(Text)
    benefits = Column(Text)
    subsidy_percentage = Column(String(50))
    category = Column(String(50))  # Direct Benefit Transfer, Insurance, Credit/Loan, etc.
    sector = Column(String(50), default="Government")  # Government, Private
    applicable_states = Column(Text)  # JSON string
    applicable_crops = Column(Text)  # JSON string
    application_process = Column(Text)
    required_documents = Column(Text)  # JSON string
    contact_info = Column(Text)  # JSON string
    website_url = Column(String(255))
    official_apply_url = Column(String(500))  # Official application URL
    is_active = Column(Boolean, default=True)
    is_new = Column(Boolean, default=False)  # Mark new schemes
    expiry_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_refreshed = Column(DateTime(timezone=True), server_default=func.now())

class SchemeApplication(Base):
    __tablename__ = "scheme_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    scheme_id = Column(Integer, ForeignKey("government_schemes.id"))
    application_data = Column(Text)  # JSON string
    status = Column(String(20), default="pending")  # pending, approved, rejected, under_review
    application_date = Column(DateTime(timezone=True), server_default=func.now())
    review_date = Column(DateTime(timezone=True))
    comments = Column(Text)
    
    # Relationships
    user = relationship("User", back_populates="scheme_applications")
    scheme = relationship("GovernmentScheme")

class SchemeRefreshLog(Base):
    __tablename__ = "scheme_refresh_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    refresh_type = Column(String(50), nullable=False)  # manual, scheduled, external_api
    new_schemes_count = Column(Integer, default=0)
    updated_schemes_count = Column(Integer, default=0)
    refresh_status = Column(String(20), default="success")  # success, failed, partial
    error_message = Column(Text)
    refresh_date = Column(DateTime(timezone=True), server_default=func.now())
    next_refresh = Column(DateTime(timezone=True))

