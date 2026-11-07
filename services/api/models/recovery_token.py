from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from models.user import Base

class RecoveryToken(Base):
    """One-time emailed token. Only the SHA-256 of the token is stored.

    purpose 'restore': restore this account on a new device.
    purpose 'verify':  prove the owner controls `email` (the address the token
                       was sent to), so restore may use it.
    """
    __tablename__ = 'cf_recovery_tokens'

    token_hash = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey('cf_users.user_id'), nullable=False, index=True)
    purpose = Column(String, nullable=False, default='restore')
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
