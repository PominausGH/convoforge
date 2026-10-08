/**
 * Initiate Stripe Pro payment by calling our proxy API.
 * The proxy returns a Stripe Checkout URL with regional pricing.
 */
export const initiateProPayment = async (userId: string) => {
  const res = await fetch('/api/payments/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }), // Matches the FastAPI CheckoutSessionCreate model
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.url) {
    // Throw so callers can reset their busy state and show an error,
    // instead of leaving the button stuck on "Opening checkout…".
    throw new Error(`Payment initiation failed (${res.status}): ${data.detail || data.error || 'no URL returned'}`)
  }
  // Redirect to localized Stripe Checkout
  window.location.href = data.url
}
