import os
import stripe
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db import get_db
from models.user import User
from models.payment import Payment

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
                "app": "convoforge",
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
        session = event["data"]["object"].to_dict()

        # This Stripe account is shared across multiple products; every
        # webhook endpoint on the account receives every event regardless
        # of which app's checkout created it, so ignore anything not ours.
        if (session.get("metadata") or {}).get("app") != "convoforge":
            return {"status": "ignored"}

        user_id = session["metadata"].get("user_id")

        if user_id:
            # Upgrade user to Pro
            query = select(User).where(User.user_id == user_id)
            result = await db.execute(query)
            user = result.scalar_one_or_none()

            if user:
                user.tier = "pro"

                # Pull email from Stripe and store only if user consented to marketing
                customer_details = session.get("customer_details") or {}
                email = customer_details.get("email")
                consented = (
                    (session.get("consent_collection") or {}).get("promotions") == "opt_in"
                    or (session.get("consent") or {}).get("promotions") == "opt_in"
                )
                if email and consented:
                    user.email = email
                    user.newsletter_opt_in = True
                    user.email_captured_at = datetime.utcnow()
                elif email and not user.email:
                    # Store transactional email (needed for receipts/cancellation) without marketing flag
                    user.email = email
                    user.email_captured_at = datetime.utcnow()

                # Record Payment
                payment = Payment(
                    user_id=user_id,
                    stripe_session_id=session["id"],
                    stripe_cust_id=session.get("customer"),
                    amount=session["amount_total"] / 100 if session["amount_total"] else 0,
                    currency=session["currency"],
                    status="succeeded"
                )
                db.add(payment)
                await db.commit()

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"].to_dict()
        # Find user by stripe customer ID or metadata if available
        customer_id = subscription.get("customer")
        if customer_id:
            # First try to find by customer_id in payments
            query = select(Payment).where(Payment.stripe_cust_id == customer_id).limit(1)
            result = await db.execute(query)
            payment = result.scalar_one_or_none()
            
            if payment:
                query = select(User).where(User.user_id == payment.user_id)
                result = await db.execute(query)
                user = result.scalar_one_or_none()
                if user:
                    user.tier = "free"
                    await db.commit()

    return {"status": "success"}
