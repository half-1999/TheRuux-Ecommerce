export const ORDER_STATUS_LABEL = {
  PENDING_PAYMENT: 'Pending',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const orderStatusLabel = (status) => ORDER_STATUS_LABEL[status] || status || '';
