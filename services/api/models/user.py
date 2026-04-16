from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = 'cf_users'

    user_id = Column(String, primary_key=True)
    tier = Column(String, default='free') # free | pro
    streak_days = Column(Integer, default=0)
    last_session_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    persona_id = Column(String, default='global_pro')
