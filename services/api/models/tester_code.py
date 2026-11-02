from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from models.user import Base

class TesterCode(Base):
    __tablename__ = 'cf_tester_codes'

    code = Column(String, primary_key=True)
    note = Column(String, nullable=True)  # who it was handed to / where
    created_at = Column(DateTime, default=datetime.utcnow)
    redeemed_by = Column(String, ForeignKey('cf_users.user_id'), nullable=True)
    redeemed_at = Column(DateTime, nullable=True)
