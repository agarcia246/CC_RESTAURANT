const MEALS_KEY = 'meals';
const LAST_ORDER_KEY = 'lastOrder';

export function getMeals() {
	try {
		const raw = localStorage.getItem(MEALS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed;
	} catch {
		return [];
	}
}

export function saveMeals(meals) {
	localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
}

export function addMeal(meal) {
	const meals = getMeals();
	meals.push(meal);
	saveMeals(meals);
}

export function getLastOrder() {
	try {
		const raw = localStorage.getItem(LAST_ORDER_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function saveLastOrder(order) {
	localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
}

export function clearLastOrder() {
	localStorage.removeItem(LAST_ORDER_KEY);
}


