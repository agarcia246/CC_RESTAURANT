import React from 'react';
import { CURRENCY } from '../constants.js';
import { getLastOrder, clearLastOrder } from '../storage.js';

function formatMoney(n) {
	return `${CURRENCY} ${n.toFixed(2)}`;
}

export default function Confirmation() {
	const [order, setOrder] = React.useState(null);

	React.useEffect(() => {
		const o = getLastOrder();
		setOrder(o);
	}, []);

	if (!order) {
		return (
			<section className="card">
				<h2>No recent order</h2>
				<p>Place an order from the Customer page to see the confirmation.</p>
				<a className="button" href="#/customer">Go to Customer</a>
			</section>
		);
	}

	const total = order.subtotal;

	function finish() {
		clearLastOrder();
		window.location.hash = '/';
	}

	return (
		<section className="card">
			<h2>Order Confirmed</h2>
			<p><strong>Order ID:</strong> {order.id}</p>
			<p><strong>Delivery area:</strong> {order.area}</p>
			<p><strong>Address:</strong> {order.address}</p>

			<h3>Items</h3>
			<ul className="list">
				{order.items.map((it) => (
					<li key={it.id} className="list-item">
						<div className="cart-row">
							<div>
								<strong>{it.name}</strong>
								<div className="muted">{it.quantity} × {formatMoney(it.price)}</div>
							</div>
							<div className="muted">{it.prepTimeMinutes} min each</div>
						</div>
					</li>
				))}
			</ul>

			<div className="summary">
				<div className="summary-row">
					<span>Total cost</span>
					<strong>{formatMoney(total)}</strong>
				</div>
				<div className="summary-row">
					<span>Estimated delivery time</span>
					<strong>{order.estimatedMinutes} minutes</strong>
				</div>
			</div>
			<div className="actions">
				<button className="button primary" onClick={finish}>Finish</button>
				<a className="button" href="#/customer">Order more</a>
			</div>
		</section>
	);
}


