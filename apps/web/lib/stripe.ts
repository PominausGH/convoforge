/**
 * Initiate Stripe Pro payment by calling our proxy API.
 * The proxy returns a Stripe Checkout URL with regional pricing.
 */
export const initiateProPayment = async (userId: string) => {
  try {
    const res = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }), // Matches the FastAPI CheckoutSessionCreate model
    })

    const data = await res.json()
    if (data.url) {
      // Redirect to localized Stripe Checkout
      window.location.href = data.url
    } else {
      console.error('Payment initiation failed: No URL returned', data)
    }
  } catch (error) {
    console.error('Payment initiation failed:', error)
  }
}
