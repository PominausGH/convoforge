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


def _button(link: str, label: str) -> str:
    return (
        f'<p><a href="{link}" style="display:inline-block;background:#000;color:#fff;'
        f'padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">{label}</a></p>'
    )


def sign_in_email(link: str) -> tuple[str, str]:
    subject = "Your ConvoForge sign-in link"
    html = f"""
        <p>Tap the button to sign in to ConvoForge on this device. Your streak, history and Pro come with you.</p>
        {_button(link, "Sign in to ConvoForge")}
        <p style="color:#666;font-size:13px">The link works once and expires in 30 minutes. If you didn't ask for it, you can ignore this email.</p>
        <hr><p style="color:#888;font-size:12px">ConvoForge</p>
    """
    return subject, html


def welcome_email(newsletter_opt_in: bool, confirm_link: str | None = None) -> tuple[str, str]:
    subject = "Welcome to ConvoForge"
    opt_in_line = (
        "<p>You're also on the list for practice tips and new persona drops — unsubscribe any time.</p>"
        if newsletter_opt_in
        else ""
    )
    confirm = (
        f"<p>Confirm your email so you can pick up your streak on any device:</p>{_button(confirm_link, 'Confirm my email')}"
        if confirm_link
        else "<p>To use ConvoForge on another device, tap <b>Sign in</b> in the app and we'll email you a link.</p>"
    )
    html = f"""
        <p>You're in.</p>
        {confirm}
        {opt_in_line}
        <p>Jump back in: <a href="https://convoforge.app/session">convoforge.app/session</a></p>
        <hr><p style="color:#888;font-size:12px">ConvoForge</p>
    """
    return subject, html


def pro_upgrade_email(confirm_link: str | None = None) -> tuple[str, str]:
    subject = "You're on ConvoForge Pro"
    confirm = (
        "<p><b>Secure your Pro access:</b> confirm your email so you can sign in on another phone "
        f"or computer and keep Pro.</p>{_button(confirm_link, 'Confirm my email')}"
        if confirm_link
        else ""
    )
    html = f"""
        <p>Thanks for upgrading — your account is now on Pro.</p>
        {confirm}
        <p>The weekly session limit is gone, so practice as much as you want: <a href="https://convoforge.app/session">convoforge.app/session</a></p>
        <hr><p style="color:#888;font-size:12px">ConvoForge</p>
    """
    return subject, html


def cancellation_email() -> tuple[str, str]:
    subject = "You're back on ConvoForge Free"
    html = """
        <p>Your Pro subscription has ended and your account is back on the free tier.</p>
        <p>Mind telling us why you left — too expensive, didn't use it enough, missing a feature, found something else? Just reply, even one line helps.</p>
        <p>Changed your mind? You can upgrade again any time: <a href="https://convoforge.app/pricing">convoforge.app/pricing</a></p>
        <hr><p style="color:#888;font-size:12px">ConvoForge</p>
    """
    return subject, html
