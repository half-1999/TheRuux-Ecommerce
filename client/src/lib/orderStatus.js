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

export const ORDER_STEP = {
  PENDING_PAYMENT: ['warn', 'Mark pending'],
  PROCESSING: ['info', 'Start processing'],
  SHIPPED: ['info', 'Mark shipped'],
  DELIVERED: ['ok', 'Mark delivered'],
  COMPLETED: ['ok', 'Complete order'],
  PAID: ['ok', 'Mark paid'],
  FAILED: ['danger', 'Mark failed'],
  CANCELLED: ['danger', 'Cancel order'],
  REFUNDED: ['warn', 'Mark refunded'],
};

export const orderStep = (status) => ORDER_STEP[status] || ['info', orderStatusLabel(status)];

export const statusTone = (status) => {
  if (['PAID', 'DELIVERED', 'COMPLETED'].includes(status)) return 'ok';
  if (['FAILED', 'CANCELLED', 'REFUNDED'].includes(status)) return 'danger';
  if (status === 'SHIPPED') return 'info';
  if (status === 'PENDING_PAYMENT' || status === 'PENDING' || status === 'PROCESSING') return 'warn';
  return 'info';
};

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
