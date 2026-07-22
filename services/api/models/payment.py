import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from models.user import Base

class Payment(Base):
    __tablename__ = 'cf_payments'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, ForeignKey('cf_users.user_id'))
    stripe_session_id = Column(String, unique=True, nullable=False)
    stripe_cust_id = Column(String)
    amount = Column(Numeric(10, 2))
    currency = Column(String)
    status = Column(String, default='pending') # pending | succeeded | failed
    created_at = Column(DateTime, default=datetime.utcnow)
