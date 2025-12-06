import React from 'react';
import Home from './pages/Home.jsx';
import Restaurant from './pages/Restaurant.jsx';
import Customer from './pages/Customer.jsx';
import Confirmation from './pages/Confirmation.jsx';
import Orders from './pages/Orders.jsx';

function useHashRoute() {
	const [route, setRoute] = React.useState(() => window.location.hash.replace('#', '') || '/');
	React.useEffect(() => {
		const onHashChange = () => setRoute(window.location.hash.replace('#', '') || '/');
		window.addEventListener('hashchange', onHashChange);
		return () => window.removeEventListener('hashchange', onHashChange);
	}, []);
	return [route, (to) => { window.location.hash = to; }];
}

export default function App() {
	const [route, navigate] = useHashRoute();

	let page = null;
	if (route === '/' || route === '') page = <Home navigate={navigate} />;
	else if (route === '/restaurant') page = <Restaurant navigate={navigate} />;
	else if (route === '/customer') page = <Customer navigate={navigate} />;
	else if (route === '/confirmation') page = <Confirmation navigate={navigate} />;
	else if (route === '/orders') page = <Orders navigate={navigate} />;
	else page = <Home navigate={navigate} />;

	return (
		<div className="app">
			<header className="app-header">
				<h1>Simplified Uber Eats</h1>
				<nav className="nav">
					<a href="#/" className="nav-link">Home</a>
					<a href="#/restaurant" className="nav-link">Restaurant</a>
					<a href="#/customer" className="nav-link">Customer</a>
					<a href="#/orders" className="nav-link">Restaurant Orders</a>
				</nav>
			</header>
			<main className="app-main">{page}</main>
			<footer className="app-footer">
				<small>Educational demo — no authentication or real payments</small>
			</footer>
		</div>
	);
}


