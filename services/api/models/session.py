import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from .user import Base

class Session(Base):
    __tablename__ = 'cf_sessions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, ForeignKey('cf_users.user_id', ondelete='CASCADE'), nullable=False)
    module_id = Column(Integer)
    forge_score = Column(Integer) # 0-100
    verbal_json = Column(JSON)
    visual_json = Column(JSON)
    carnegie_json = Column(JSON)
    embedding = Column(Vector(1536)) # Dimension for OpenAI or Claude embeddings
    recording_r2 = Column(String) # R2 object key
    created_at = Column(DateTime, default=datetime.utcnow)
