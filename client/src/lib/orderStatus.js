export const ORDER_STATUS_LABEL = {
  PENDING_PAYMENT: 'Pending',
  FAILED: 'Failed',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const orderStatusLabel = (status) => ORDER_STATUS_LABEL[status] || status || '';

export const PAYMENT_STATUS_LABEL = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  PARTIAL_REFUND: 'Partial refund',
};

export const paymentStatusLabel = (status) => PAYMENT_STATUS_LABEL[status] || status || '';

export const formatOrderDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
