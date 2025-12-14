import React from 'react';
import { DELIVERY_AREAS, RESTAURANTS } from '../constants.js';






export default function Restaurant() {
	// Prefer calling a secure proxy if provided via env; fall back to direct function URL
	const MEAL_PROXY_URL = 'https://registermeal.azurewebsites.net/api/ProxyRegisterMeal';
	const [form, setForm] = React.useState({
		name: '',
		restaurant:RESTAURANTS[0],
		description: '',
		prepTimeMinutes: '',
		price: '',
		area: DELIVERY_AREAS[0]
	});
	const [message, setMessage] = React.useState('');

	function updateField(field, value) {
		setForm((prev) => ({ ...prev, [field]: value }));
	}



	async function onSubmit(e) {
		e.preventDefault();
		const name = form.name.trim();
		const restaurant = form.restaurant;
		const description = form.description.trim();
		const prepTimeMinutes = Number(form.prepTimeMinutes);
		const price = Number(form.price);
		const area = form.area;
	
		if (prepTimeMinutes <= 0 || price <= 0) {
			setMessage('Preparation time and price must be greater than 0.');
			return;
		}
	
		setMessage('Registering meal...');
		try {
			const targetUrl = MEAL_PROXY_URL;
			const res = await fetch(targetUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					restaurant,
					description,
					price,
					prepTimeMinutes,
					delivery_area: area,
				})
			});
	
			if (!res.ok) {
				const err = await res.text().catch(() => '');
				throw new Error(err || `Request failed with ${res.status}`);
			}
	
			const data = await res.json().catch(() => ({}));
			setMessage(`Meal "${name}" registered for ${area}.`);
			setForm({
				name: '',
				restaurant: '',
				description: '',
				prepTimeMinutes: '',
				price: '',
				area: DELIVERY_AREAS[0]
			});
		} catch (err) {
			setMessage(`Error: ${String(err.message || err)}`);
		}
	}

	return (
		<section className="card">
			<h2>Restaurant — Register a Meal</h2>
			<form onSubmit={onSubmit} className="form">
				<label className="form-field">
					<span>Name of dish</span>
					<input
						type="text"
						value={form.name}
						onChange={(e) => updateField('name', e.target.value)}
						placeholder="e.g., Margherita Pizza"
						required
					/>
				</label>

				<label className="form-field">
					<span>Description</span>
					<textarea
						value={form.description}
						onChange={(e) => updateField('description', e.target.value)}
						placeholder="Fresh tomatoes, mozzarella, basil..."
						required
					/>
				</label>

				<div className="grid two">
					<label className="form-field">
						<span>Estimated preparation time (minutes)</span>
						<input
							type="number"
							min="1"
							step="1"
							value={form.prepTimeMinutes}
							onChange={(e) => updateField('prepTimeMinutes', e.target.value)}
							placeholder="e.g., 15"
							required
						/>
					</label>
					<label className="form-field">
						<span>Price</span>
						<input
							type="number"
							min="0.01"
							step="0.01"
							value={form.price}
							onChange={(e) => updateField('price', e.target.value)}
							placeholder="e.g., 9.99"
							required
						/>
					</label>
				</div>

				<label className="form-field">
					<span>Restaurant</span>
					<select value={form.area} onChange={(e) => updateField('restaurant', e.target.value)}>
						{RESTAURANTS.map((b) => (
							<option key={b} value={b}>{b}</option>
						))}
					</select>
				</label>




				<div className="actions">
					<button type="submit" className="button primary">Register Meal</button>
					<a href="#/customer" className="button">Go to Customer</a>
				</div>
			</form>
			{message && <p className="success">{message}</p>}
		</section>
	);
}


