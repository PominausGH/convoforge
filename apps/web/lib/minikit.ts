/**
 * Initiate Stripe Pro payment by calling our proxy API.
 * The proxy returns a Stripe Checkout URL with regional pricing.
 */
export const initiateProPayment = async (userId: string) => {
  try {
    const res = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    const { url } = await res.json()
    if (url) {
      // Redirect to localized Stripe Checkout
      window.location.href = url
    }
  } catch (error) {
    console.error('Payment initiation failed:', error)
  }
}
