const seenPurchases = new Set();

export const track = (name, params = {}) => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
};

export const trackPurchase = (orderNumber, value) => {
  if (!orderNumber || seenPurchases.has(orderNumber)) return;
  seenPurchases.add(orderNumber);
  track('purchase', {
    transaction_id: orderNumber,
    currency: 'INR',
    value: Number(value) || 0,
  });
};
