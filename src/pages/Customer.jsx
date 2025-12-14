import React from 'react';
import { DELIVERY_AREAS, FIXED_DELIVERY_MINUTES, FIXED_PICKUP_MINUTES, CURRENCY, RESTAURANTS } from '../constants.js';
import { saveLastOrder } from '../storage.js';

function formatMoney(n) {
	return `${CURRENCY} ${n.toFixed(2)}`;
}

export default function Customer() {
	const [area, setArea] = React.useState(RESTAURANTS[0]);
	const [address, setAddress] = React.useState(DELIVERY_AREAS[0]);
	const [meals, setMeals] = React.useState([]);
	const [cart, setCart] = React.useState({});

	// Query meals from Azure Function for the selected area
	const QUERY_URL = 'https://registermeal.azurewebsites.net/api/QueryMealTable?';
	// Optional: configure an Orders API to persist orders to Azure Tables
	const ORDER_API_URL = 'https://registermeal.azurewebsites.net/api/ProxyRegisterOrder?'; // e.g., 'https://<your-func>.azurewebsites.net/api/AddOrder?code=KEY'
	React.useEffect(() => {
		let cancelled = false;
		async function load() {
			try {
				const res = await fetch(`${QUERY_URL}&delivery_area=${encodeURIComponent(area)}`);
				if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
				const list = await res.json();
				// Normalize entities from Table Storage with robust numeric parsing and fallbacks
				const normalized = (Array.isArray(list) ? list : []).map((e) => {
					const rawPrep = e.prepTimeMinutes ?? e.time;
					const parsedPrep = Number(rawPrep);
					const safePrepTime = Number.isFinite(parsedPrep) ? parsedPrep : 15; // fallback

					const rawPrice = e.price;
					const parsedPrice = Number(rawPrice);
					const safePrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;

					return {
						id: e.RowKey || e.id,
						name: e.name,
						description: e.description,
						price: safePrice,
						prepTimeMinutes: safePrepTime,
						area: e.delivery_area || area
					};
				});
				if (!cancelled) setMeals(normalized);
			} catch {
				if (!cancelled) setMeals([]);
			}
		}
		load();
		return () => { cancelled = true; };
	}, [area]);

	// Meals already filtered by area from API
	const availableMeals = meals;

	function addToCart(mealId) {
		setCart((prev) => {
			const qty = prev[mealId] || 0;
			return { ...prev, [mealId]: qty + 1 };
		});
	}

	function removeFromCart(mealId) {
		setCart((prev) => {
			const qty = (prev[mealId] || 0) - 1;
			if (qty <= 0) {
				const { [mealId]: _, ...rest } = prev;
				return rest;
			}
			return { ...prev, [mealId]: qty };
		});
	}

	const cartItems = Object.entries(cart).map(([mealId, quantity]) => {
		const meal = meals.find((m) => m.id === mealId);
		return { meal, quantity };
	}).filter((i) => i.meal);

	const subtotal = cartItems.reduce((sum, { meal, quantity }) => sum + meal.price * quantity, 0);
	const prepTimeSum = cartItems.reduce((sum, { meal, quantity }) => sum + meal.prepTimeMinutes * quantity, 0);
	const estimatedTotalMinutes = prepTimeSum + FIXED_PICKUP_MINUTES + FIXED_DELIVERY_MINUTES;

	async function placeOrder() {
		if (!address.trim()) {
			alert('Please enter your delivery address.');
			return;
		}
		if (cartItems.length === 0) {
			alert('Your cart is empty.');
			return;
		}
		const order = {
			id: crypto.randomUUID(),
			createdAt: new Date().toISOString(),
			area,
			address: address.trim(),
			items: cartItems.map(({ meal, quantity }) => ({
				id: meal.id,
				name: meal.name,
				price: meal.price,
				prepTimeMinutes: meal.prepTimeMinutes,
				quantity
			})),
			subtotal,
			estimatedMinutes: estimatedTotalMinutes
		};
		// Save locally for confirmation page
		saveLastOrder(order);

		// Best-effort: POST to backend to persist order (if configured)
		if (ORDER_API_URL) {
			try {
				console.log('Order payload about to be sent:', {
					delivery_area: area,
					address: order.address,
					items: order.items.map(it => ({
					  ...it,
					  parsedPrep: Number(it.prepTimeMinutes),
					  parsedPrice: Number(it.price)
					}))
				  });







				await fetch(ORDER_API_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						delivery_area: area,
						address: order.address,
						items: order.items.map((it) => ({
							restaurantId: it.restaurantId || '', // optional if you enhance meal data
							mealId: it.id,
							name: it.name,
							price: Number(it.price),
							qty: Number(it.quantity),
							prepTimeMinutes: Number(it.prepTimeMinutes ?? 15)
						}))
					})
				});
			} catch {
				// ignore network/backend errors for demo purposes
			}
		}

		window.location.hash = '/confirmation';
	}

	return (
		<section className="card">
			<h2>Customer — Order Meals</h2>
			<div className="grid two">
				<div>
					<div className="form">
						<label className="form-field">
							<span>Restaurant Name</span>
							<select value={area} onChange={(e) => setArea(e.target.value)}>
								{RESTAURANTS.map((a) => (
									<option key={a} value={a}>{a}</option>
								))}
							</select>
						</label>




						<label className="form-field">
							<span>Delivery address</span>
							<select value={address} onChange={(e) => setAddress(e.target.value)}>
								{DELIVERY_AREAS.map((a) => (
									<option key={a} value={a}>{a}</option>
								))}
							</select>
						</label>
					</div>

					<h3>Available meals in {area}</h3>
					{availableMeals.length === 0 ? (
						<p>No meals registered for this area yet. Check back later.</p>
					) : (
						<ul className="list">
							{availableMeals.map((m) => (
								<li key={m.id} className="list-item">
									<div className="meal">
										<div className="meal-main">
											<strong>{m.name}</strong>
											<p className="muted">{m.description}</p>
										</div>
										<div className="meal-meta">
											<div>{formatMoney(m.price)}</div>
											<div className="muted">{m.prepTimeMinutes} min prep</div>
											<button className="button small" onClick={() => addToCart(m.id)}>Add</button>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
				<div>
					<h3>Your Cart</h3>
					{cartItems.length === 0 ? (
						<p>Your cart is empty.</p>
					) : (
						<>
							<ul className="list">
								{cartItems.map(({ meal, quantity }) => (
									<li key={meal.id} className="list-item">
										<div className="cart-row">
											<div>
												<strong>{meal.name}</strong>
												<div className="muted">{quantity} × {formatMoney(meal.price)}</div>
											</div>
											<div className="cart-actions">
												<button className="button small" onClick={() => removeFromCart(meal.id)}>-</button>
												<span className="qty">{quantity}</span>
												<button className="button small" onClick={() => addToCart(meal.id)}>+</button>
											</div>
										</div>
									</li>
								))}
							</ul>
							<div className="summary">
								<div className="summary-row">
									<span>Subtotal</span>
									<strong>{formatMoney(subtotal)}</strong>
								</div>
								<div className="summary-row">
									<span>Estimated time</span>
									<strong>{estimatedTotalMinutes} minutes</strong>
								</div>
							</div>
							<button className="button primary" onClick={placeOrder}>Place Order</button>
						</>
					)}
				</div>
			</div>
		</section>
	);
}


