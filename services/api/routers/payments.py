import os
import stripe
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_db
from ..models.user import User
from ..models.payment import Payment

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_API_KEY", "sk_test_123")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_123")
APP_URL = os.getenv("APP_URL", "http://localhost:3000")

class CheckoutSessionCreate(BaseModel):
    user_id: str

@router.post("/create-checkout-session")
async def create_checkout_session(data: CheckoutSessionCreate, db: AsyncSession = Depends(get_db)):
    try:
        # 1. Ensure user exists in our DB
        query = select(User).where(User.user_id == data.user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            user = User(user_id=data.user_id, tier="free")
            db.add(user)
            await db.commit()

        # 2. Create a checkout session with PPP support
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': os.getenv("STRIPE_PRO_PRICE_ID", "price_123"),
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{APP_URL}/session?payment=success",
            cancel_url=f"{APP_URL}/pricing?payment=cancelled",
            metadata={
                "user_id": data.user_id
            }
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"].get("user_id")
        
        if user_id:
            # Upgrade user to Pro
            query = select(User).where(User.user_id == user_id)
            result = await db.execute(query)
            user = result.scalar_one_or_none()
            
            if user:
                user.tier = "pro"
                
                # Record Payment
                payment = Payment(
                    user_id=user_id,
                    stripe_session_id=session["id"],
                    stripe_cust_id=session["customer"],
                    amount=session["amount_total"] / 100,
                    currency=session["currency"],
                    status="succeeded"
                )
                db.add(payment)
                
                await db.commit()

    return {"status": "success"}
