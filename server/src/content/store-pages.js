export const RETURNS_BODY = `Return and exchange

A return opens only after the order is marked Delivered. You then have 3 days to ask for a return. The request needs a reason.

An exchange opens on the same delivery date and stays open for 7 days. The request needs a reason. After the 3-day return window, an exchange can still be requested until day 7.

Items should be unused, with the original tags. We inspect the piece before a refund or a replacement. Prepaid refunds go back to the original payment method. Cash on delivery is refunded only after the returned piece passes inspection.

One request per order. A return or an exchange cannot be opened before delivery, or after its window has closed.

Cancel an order

You can cancel while the order is still pending, and only within 2 hours of placing it. Pending means we have not taken a successful online payment, or a cash-on-delivery order is still waiting to be processed. Once those 2 hours pass, or the order is paid, shipped, or delivered, cancellation moves to our team through Contact.`;

export const PRIVACY_BODY = `TheRuux respects your data.

We collect the name, email, phone, and shipping address you give us so we can create your account, deliver the order, and send the messages in that journey: welcome, order confirmation, shipping, delivery, cancellation, and a return or exchange request.

We store the reason you write for a return or an exchange, the time you placed the order, and the time it was delivered. Those facts are how we apply the 2-hour cancellation window, the 3-day return window, and the 7-day exchange window. We do not sell this information.

Payment details are processed by Cashfree. We do not store full card numbers. Cash-on-delivery orders record that you chose to pay on arrival.

Cookies and local storage keep your session, bag, and preferences working. You can clear them in your browser.

Questions: use Contact, or the address on your order email.`;

export const TERMS_BODY = `By using TheRuux you agree to shop in good faith: accurate details, respectful use of the site, and acceptance of the product description, price, and stock shown at checkout.

Orders

A cash-on-delivery order is confirmed when you place it. An online order is confirmed when Cashfree reports the payment as paid. We may cancel an order for fraud risk, a pricing error, or stock we cannot supply. If we cancel a paid order, the refund goes to the original payment method.

You may cancel your own order only while it is still pending and only within 2 hours of placing it. After that, or after the order is paid, shipped, or delivered, contact us.

Returns and exchanges

A return can be requested for 3 days after the order is marked Delivered. An exchange can be requested for 7 days after that same delivery. Both need a reason. The piece should be unused and carry its original tags. We inspect it before a refund or a replacement size. One request per order.

Product imagery can vary slightly by screen. TheRuux names, graphics, and site design stay with the brand.

Governing law: India.`;

export const ABOUT_BODY = `TheRuux is an Indian streetwear label. The clothes are cut clean, then given a point of view: graphics, denim, embroidery, and the details you notice up close.

We sell from theruux.in. Each piece is listed with its fabric, fit, and size run. What you see on the product page is what we ship.

Questions about an order go through the contact form.`;

export const STORY_BODY = `Udbhav is the collection about beginning again. Graphics, denim construction, embroidery, and experimental detailing, made to be worn, not just looked at.

The rest of the line follows the same idea: a name with a meaning, a cut you can live in, and a finish that holds up.`;

export const SHIPPING_BODY = `We ship across India.

Standard delivery is 3 to 5 business days. Express is 1 to 2 business days. The choice and the charge are shown at checkout before you pay.

Cash on delivery is collected when the order arrives. Online payment is taken by Cashfree, and the order is confirmed only after that payment is verified.

A tracking note is added when the order is marked shipped. Delivery times can move during festivals or if the address needs a correction.`;

export const FAQ_BODY = `Orders

A cash-on-delivery order is placed when you confirm checkout. An online order is placed when Cashfree confirms the payment.

Cancel

You can cancel only while the order is still pending, and only within 2 hours of placing it. After that, write to us through Contact.

Returns

A return opens after the order is marked Delivered, and stays open for 3 days. The request needs a reason. The piece should be unused, with its original tags. We inspect it before a refund.

Exchanges

An exchange stays open for 7 days after delivery and also needs a reason. After the 3-day return window, an exchange can still be requested until day 7. One request per order.

Shipping

Standard is 3 to 5 business days inside India. Express is 1 to 2 business days.`;

export const STATIC_PAGES = {
  'about-us': { slug: 'about-us', title: 'About Us', body: ABOUT_BODY },
  'our-story': { slug: 'our-story', title: 'Our Story', body: STORY_BODY },
  'shipping-delivery': { slug: 'shipping-delivery', title: 'Shipping & Delivery', body: SHIPPING_BODY },
  'returns-exchanges': { slug: 'returns-exchanges', title: 'Returns & Exchanges', body: RETURNS_BODY },
  faqs: { slug: 'faqs', title: 'FAQs', body: FAQ_BODY },
  privacy: { slug: 'privacy', title: 'Privacy Policy', body: PRIVACY_BODY },
  terms: { slug: 'terms', title: 'Terms & Conditions', body: TERMS_BODY },
};
