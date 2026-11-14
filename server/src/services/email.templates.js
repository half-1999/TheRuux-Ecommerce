/**
 * Brand email templates — microcopy from Doc 01 / PDF.
 */
import { formatMoney } from '../utils/money.js';
import { env } from '../config/env.js';

const wrap = (title, bodyHtml) => `<!doctype html>
<html>
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;background:#F5F2EC;color:#141414;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <p style="letter-spacing:0.12em;text-transform:uppercase;font-size:11px;color:#5C5C5C;">TheRuux</p>
    ${bodyHtml}
    <p style="margin-top:40px;font-size:12px;color:#8A8A8A;">Beyond boundaries<br/>Minimal on the surface. Personality in the details.</p>
  </div>
</body>
</html>`;

const payLine = (order) =>
  order.paymentMethod === 'cod' ? 'Pay with cash when it arrives.' : 'Paid online.';

const shipLine = (order) => {
  const address = order.shippingAddress || {};
  return [address.fullName, address.line1, address.city, address.postalCode].filter(Boolean).join(', ');
};

export const welcomeEmail = ({ name }) => ({
  subject: 'WELCOME. · TheRuux',
  html: wrap(
    'Welcome',
    `<h1 style="font-size:28px;margin:16px 0 8px;">WELCOME.</h1>
     <p style="color:#5C5C5C;">${name ? `${name}, your` : 'Your'} account is ready.</p>
     <p style="margin-top:24px;"><a href="${env.clientUrl}/shop" style="color:#103020;">Shop the drop</a></p>`,
  ),
  text: `WELCOME.\n${name ? `${name}, your` : 'Your'} account is ready.\n${env.clientUrl}/shop`,
});

export const orderConfirmationEmail = (order) => {
  const lines = (order.items || [])
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #D9D3C8;">${i.productName} — ${i.productTitle} (${i.size}/${i.colourName}) × ${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #D9D3C8;text-align:right;">₹${formatMoney(i.lineTotal)}</td></tr>`,
    )
    .join('');
  const where = shipLine(order);

  return {
    subject: `GOOD CHOICE. · ${order.orderNumber}`,
    html: wrap(
      'Order confirmed',
      `<h1 style="font-size:28px;margin:16px 0 8px;">GOOD CHOICE.</h1>
       <p style="color:#5C5C5C;margin:0 0 24px;">We'll handle the rest.</p>
       <p>Order <strong>${order.orderNumber}</strong></p>
       <p>${payLine(order)}</p>
       <table style="width:100%;border-collapse:collapse;margin-top:16px;">${lines}</table>
       <p style="margin-top:16px;font-weight:600;">Total ₹${formatMoney(order.grandTotal)}</p>
       ${where ? `<p style="color:#5C5C5C;">Ships to ${where}</p>` : ''}
       <p style="margin-top:24px;"><a href="${env.clientUrl}/account/orders" style="color:#103020;">View orders</a></p>`,
    ),
    text: `GOOD CHOICE.\nWe'll handle the rest.\nOrder ${order.orderNumber}\n${payLine(order)}\nTotal ₹${formatMoney(order.grandTotal)}${where ? `\nShips to ${where}` : ''}`,
  };
};

export const shippedEmail = (order) => ({
  subject: `ITS ON THE MOVE. · ${order.orderNumber}`,
  html: wrap(
    'Shipped',
    `<h1 style="font-size:28px;margin:16px 0 8px;">ITS ON THE MOVE.</h1>
     <p style="color:#5C5C5C;">Order ${order.orderNumber}${order.trackingNumber ? ` · Tracking ${order.trackingNumber}` : ''}${order.carrier ? ` (${order.carrier})` : ''}</p>`,
  ),
  text: `ITS ON THE MOVE.\nOrder ${order.orderNumber}`,
});

export const deliveredEmail = (order) => ({
  subject: `KNOCK KNOCK. · ${order.orderNumber}`,
  html: wrap(
    'Delivered',
    `<h1 style="font-size:28px;margin:16px 0 8px;">KNOCK KNOCK.</h1>
     <p style="color:#5C5C5C;">Your TheRuux is here.</p>
     <p>Order ${order.orderNumber}</p>`,
  ),
  text: `KNOCK KNOCK.\nYour TheRuux is here.\nOrder ${order.orderNumber}`,
});

export const newsletterWelcomeEmail = () => ({
  subject: 'STAY IN THE LOOP. · TheRuux',
  html: wrap(
    'Newsletter',
    `<h1 style="font-size:28px;margin:16px 0 8px;">STAY IN THE LOOP.</h1>
     <p style="color:#5C5C5C;">New drops. New stories. No unnecessary emails.</p>`,
  ),
  text: 'STAY IN THE LOOP.\nNew drops. New stories. No unnecessary emails.',
});

export const aftercareEmail = (order) => {
  const kind = order.aftercare?.type === 'exchange' ? 'Exchange' : 'Return';
  return {
    subject: `${kind.toUpperCase()} RECEIVED. · ${order.orderNumber}`,
    html: wrap(
      kind,
      `<h1 style="font-size:28px;margin:16px 0 8px;">${kind.toUpperCase()} RECEIVED.</h1>
       <p style="color:#5C5C5C;">Order ${order.orderNumber}</p>
       <p>${order.aftercare?.reason || ''}</p>
       <p style="margin-top:24px;">We will inspect the piece and write back.</p>`,
    ),
    text: `${kind.toUpperCase()} RECEIVED.\nOrder ${order.orderNumber}\n${order.aftercare?.reason || ''}`,
  };
};

export const cancelledEmail = (order) => ({
  subject: `ORDER CANCELLED. · ${order.orderNumber}`,
  html: wrap(
    'Cancelled',
    `<h1 style="font-size:28px;margin:16px 0 8px;">ORDER CANCELLED.</h1>
     <p style="color:#5C5C5C;">Order ${order.orderNumber} will not be shipped.</p>
     <p style="margin-top:24px;"><a href="${env.clientUrl}/shop" style="color:#103020;">Shop again</a></p>`,
  ),
  text: `ORDER CANCELLED.\nOrder ${order.orderNumber} will not be shipped.`,
});

export const contactAckEmail = ({ name }) => ({
  subject: 'We got your note · TheRuux',
  html: wrap(
    'Contact',
    `<h1 style="font-size:24px;margin:16px 0 8px;">Thanks, ${name}.</h1>
     <p style="color:#5C5C5C;">We read every note. Someone from TheRuux will reply soon.</p>`,
  ),
  text: `Thanks, ${name}. We read every note.`,
});
