from datetime import datetime
from sqlalchemy import JSON, Column, String, Integer, DateTime, Text, Boolean
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
    email = Column(Text, nullable=True)
    newsletter_opt_in = Column(Boolean, default=False, nullable=False)
    email_captured_at = Column(DateTime, nullable=True)
    # Set once the person proves they own `email` by tapping a sign-in link.
    # Only verified emails can be used to sign in on another device.
    email_verified_at = Column(DateTime, nullable=True)
    # Friends Lab challenge progress, synced only for signed-in (verified) users.
    friend_challenges = Column(JSON, nullable=True)
