import React from 'react';

export default function Home() {
	return (
		<section className="card">
			<h2>Welcome</h2>
			<p>This is a simplified two-sided food ordering platform.</p>
			<div className="grid two">
				<a className="button primary" href="#/restaurant">I am a Restaurant</a>
				<a className="button" href="#/customer">I am a Customer</a>
			</div>
		</section>
	);
}


