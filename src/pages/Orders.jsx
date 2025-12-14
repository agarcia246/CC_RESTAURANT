import React from 'react';
import { DELIVERY_AREAS, CURRENCY, RESTAURANTS } from '../constants.js';

function formatMoney(n) {
	return `${CURRENCY} ${n.toFixed(2)}`;
}

export default function Orders() {
	// Configure your Orders query function URL here. It should accept ?delivery_area=...
	// Example: 'https://<your-func>.azurewebsites.net/api/QueryOrders?code=KEY'
	const ORDERS_QUERY_URL = 'https://registermeal.azurewebsites.net/api/QueryOrderTable';
	const [area, setArea] = React.useState(RESTAURANTS[0]);
	const [orders, setOrders] = React.useState([]);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');

	React.useEffect(() => {
		let cancelled = false;
		async function load() {
			setLoading(true);
			setError('');
			try {
				if (!ORDERS_QUERY_URL) {
					// No backend configured; show empty state
					if (!cancelled) setOrders([]);
					return;
				}
				const res = await fetch(`${ORDERS_QUERY_URL}${ORDERS_QUERY_URL.includes('?') ? '&' : '?'}delivery_area=${encodeURIComponent(area)}`);
				if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
				const list = await res.json();
				const normalized = (Array.isArray(list) ? list : []).map((e) => {
					const parsedSubtotal = Number(e.subtotal);
					const safeSubtotal = Number.isFinite(parsedSubtotal) ? parsedSubtotal : 0;
					const parsedEstimated = Number(e.estimatedMinutes);
					const safeEstimated = Number.isFinite(parsedEstimated) ? parsedEstimated : 0;
					return {
						id: e.RowKey || e.orderId || crypto.randomUUID(),
						createdAt: e.createdAt,
						address: e.address,
						subtotal: safeSubtotal,
						estimatedMinutes: safeEstimated,
						items: (() => {
							try { return JSON.parse(e.itemsJson || '[]'); } catch { return []; }
						})()
					};
				});
				if (!cancelled) setOrders(normalized);
			} catch (err) {
				if (!cancelled) setError(String(err.message || err));
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		load();
		return () => { cancelled = true; };
	}, [area]);

	return (
		<section className="card">
			<h2>Restaurant — Active Orders</h2>
			<div className="form">
				<label className="form-field">
					<span>Filter by restaurants</span>
					<select value={area} onChange={(e) => setArea(e.target.value)}>
						{RESTAURANTS.map((a) => (
							<option key={a} value={a}>{a}</option>
						))}
					</select>
				</label>
			</div>
			{!ORDERS_QUERY_URL && (
				<p className="muted">Configure ORDERS_QUERY_URL in `Orders.jsx` to load orders from your Azure Function.</p>
			)}
			{loading ? <p>Loading…</p> : null}
			{error ? <p className="muted">Error: {error}</p> : null}
			{!loading && orders.length === 0 && !error ? <p>No orders found for {area}.</p> : null}
			{orders.length > 0 && (
				<ul className="list">
					{orders.map((o) => (
						<li key={o.id} className="list-item">
							<div className="meal">
								<div className="meal-main">
									<strong>Order {o.id.slice(0, 8)}</strong>
									<p className="muted">{o.createdAt}</p>
									<p className="muted">Deliver to: {o.address}</p>
									{Array.isArray(o.items) && o.items.length > 0 && (
										<ul className="list" style={{ marginTop: 8 }}>
											{o.items.map((it, idx) => (
												<li key={idx} className="list-item">
													<div className="cart-row">
														<div>
															<strong>{it.name}</strong>
															<div className="muted">{it.qty ?? 1} × {formatMoney(Number(it.price || 0))}</div>
														</div>
														<div className="muted">{Number(it.prepTimeMinutes || 0)} min each</div>
													</div>
												</li>
											))}
										</ul>
									)}
								</div>
								<div className="meal-meta">
									<div><strong>{formatMoney(o.subtotal)}</strong></div>
									<div className="muted">ETA: {o.estimatedMinutes} min</div>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}


