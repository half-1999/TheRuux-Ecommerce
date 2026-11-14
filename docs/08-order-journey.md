# Onboarding to order, return, and exchange

The store account is Aman Sharma, `aman.sharma@theruux.in`, password `AmanTest1!`. The second product in a two-piece order is PURPOSE, the Chase Purpose Graphic Tee, sold with REBEL.

## Onboarding

Creating an account sends the welcome email. The account holds the name, email, phone, and saved addresses used at checkout.

## Placing an order

A bag can hold more than one product. Checkout asks for an address and a payment method.

- Cash on delivery confirms the order immediately. Payment stays pending. Stock is held.
- Cashfree confirms the order only after the payment is verified. Stock is held at that point. The card number is not stored.

The confirmation email is GOOD CHOICE. It names the pieces, the total, where it ships, and whether the customer pays on arrival or has already paid.

## Cancellation

The customer can cancel only while the order is still pending, and only within 2 hours of placing it.

Pending means either the online payment has not succeeded, or a cash-on-delivery order is still waiting to be processed. After 2 hours, or once the order is paid, shipped, or delivered, the customer cannot cancel it. Cancelling a held order puts the pieces back in stock and sends ORDER CANCELLED.

## Shipping and delivery

The admin marks the order shipped, then delivered. Shipped sends ITS ON THE MOVE. Delivered sends KNOCK KNOCK. and starts the clocks below.

## Return

A return opens when the order is delivered, and stays open for 3 days. The customer writes a reason. The request is stored on the order and acknowledged by email. The piece should be unused, with its tags. A prepaid refund goes back through the original payment method after inspection. Cash collected on delivery is refunded only after that inspection.

## Exchange

An exchange uses the same delivery date and stays open for 7 days, so it is still available after the return window has closed. It also needs a reason. One request per order: a return and an exchange are not both kept.

## What is published

The same rules are on Terms, Privacy, and Returns & Exchanges. Privacy states that the reason, the order time, and the delivery time are stored to apply these windows, and that the data is not sold.

## Checked

Signed in as Aman Sharma on the store. One cash-on-delivery order held REBEL and PURPOSE together, ₹7,498. Cancelling it while it was still pending removed the order and put both pieces back. A delivered order of the same two pieces accepted a return with the reason written on the page.

The API also refused a cancel after 2 hours, a return after 3 days, and an exchange after 7 days. An exchange on day 4 was accepted. Terms, Privacy, and Returns show these windows.

The journey emails are written for each step. They are not delivered until `RESEND_API_KEY` is set and the sending domain is verified.
