# Simplified Uber Eats (Frontend)

Educational React app demonstrating a two-sided food ordering flow:

- Restaurants register meals (name, description, prep time, price, delivery area)
- Customers choose a delivery area, browse meals, add to cart, and place orders
- Confirmation page shows total cost and estimated delivery time

No authentication or backend is included. Data is stored in `localStorage`.

## Tech
- React 18
- Vite

## Getting Started

1) Install dependencies

```bash
npm install
```

2) Run the dev server

```bash
npm run dev
```

Open the printed local URL in your browser.

## How it Works

- Navigation uses simple hash-based routing (`#/`, `#/restaurant`, `#/customer`, `#/confirmation`).
- Meals are persisted in `localStorage` under the `meals` key.
- Orders are saved temporarily as `lastOrder` to power the confirmation page.
- Delivery areas are simplified categories: Central, North, South, East, West.
- Estimated delivery time:
  - `sum(preparation times for each item × quantity)`
  - `+ fixed pickup time (10 minutes)`
  - `+ fixed delivery time (15 minutes)`

## Project Structure

```
src/
  App.jsx                # Router and layout
  main.jsx               # Entrypoint
  styles.css             # Basic styling
  constants.js           # Areas, time constants, currency
  storage.js             # localStorage helpers
  pages/
    Home.jsx
    Restaurant.jsx       # Meal registration form
    Customer.jsx         # Area/address form, menu, cart, place order
    Confirmation.jsx     # Order summary & ETA
```

## Notes / Assumptions

- No authentication: any visitor can act as a restaurant or customer.
- No server or database: all data is client-side and ephemeral.
- Prices are displayed in USD; change `CURRENCY` in `src/constants.js` if needed.
- This is intentionally simplified to focus on core flows and UI.


