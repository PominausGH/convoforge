"""Transactional email via Brevo's HTTP API. No-ops (logs and returns) when
BREVO_API_KEY isn't configured, same pattern as tts.py's OpenAI fallback, so
missing config degrades gracefully instead of breaking the calling request."""
import logging
import os

import httpx

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
FROM_EMAIL = os.getenv("FROM_EMAIL", "hello@convoforge.app")
FROM_NAME = os.getenv("FROM_NAME", "ConvoForge")


async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    api_key = os.getenv("BREVO_API_KEY", "").strip()
    if not api_key:
        logger.warning("BREVO_API_KEY not configured — skipping email to %s", to_email)
        return False

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                BREVO_API_URL,
                headers={
                    "accept": "application/json",
                    "content-type": "application/json",
                    "api-key": api_key,
                },
                json={
                    "sender": {"email": FROM_EMAIL, "name": FROM_NAME},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "htmlContent": html_content,
                },
            )
        if res.status_code >= 400:
            logger.error("Brevo error %s: %s", res.status_code, res.text[:500])
            return False
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to_email)
        return False


def welcome_email(newsletter_opt_in: bool) -> tuple[str, str]:
    subject = "Welcome to ConvoForge"
    opt_in_line = (
        "<p>You're also on the list for practice tips and new persona drops — unsubscribe any time.</p>"
        if newsletter_opt_in
        else ""
    )
    html = f"""
        <p>You're in.</p>
        <p>Your ConvoForge progress is now tied to this email, so you can pick up your streak from any device.</p>
        {opt_in_line}
        <p>Jump back in: <a href="https://convoforge.app/session">convoforge.app/session</a></p>
        <hr><p style="color:#888;font-size:12px">ConvoForge</p>
    """
    return subject, html


def pro_upgrade_email() -> tuple[str, str]:
    subject = "You're on ConvoForge Pro"
    html = """
        <p>Thanks for upgrading — your account is now on Pro.</p>
        <p>The weekly session limit is gone, so practice as much as you want: <a href="https://convoforge.app/session">convoforge.app/session</a></p>
        <hr><p style="color:#888;font-size:12px">ConvoForge</p>
    """
    return subject, html
