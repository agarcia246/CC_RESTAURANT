import logging
import uuid
import json
from datetime import datetime
import azure.functions as func

JSON_HEADERS = {
	"Content-Type": "application/json",
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "Content-Type, x-functions-key",
}

def main(req: func.HttpRequest, entity: func.Out[str]) -> func.HttpResponse:
	logging.info("HTTP trigger received - register_meal")

	# CORS preflight for browser clients
	if req.method == "OPTIONS":
		return func.HttpResponse(
			status_code=204,
			headers={
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST,OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, x-functions-key",
			},
		)

	try:
		body = req.get_json()
	except ValueError:
		body = {}

	# Accept both camelCase and snake_case from clients
	name = (body.get("name") or "").strip()
	description = (body.get("description") or "").strip()
	price = body.get("price", body.get("unit_price"))
	prep_time = body.get("prepTimeMinutes", body.get("prep_time_minutes", body.get("time")))
	delivery_area = (body.get("delivery_area") or body.get("area") or "").strip()
	restaurant = (body.get("restaurant") or body.get("restaurant_name") or body.get("restaurantId") or "").strip()

	if not name or not description or price is None or prep_time is None or not delivery_area:
		return func.HttpResponse(
			json.dumps({"error": "Fields 'name', 'description', 'price', 'prepTimeMinutes', and 'delivery_area' are required."}),
			headers=JSON_HEADERS,
			status_code=400,
		)

	try:
		price_val = float(price)
		prep_val = int(prep_time)
	except Exception:
		return func.HttpResponse(
			json.dumps({"error": "'price' must be numeric and 'prepTimeMinutes' must be an integer."}),
			headers=JSON_HEADERS,
			status_code=400,
		)

	if price_val <= 0 or prep_val <= 0:
		return func.HttpResponse(
			json.dumps({"error": "'price' and 'prepTimeMinutes' must be greater than 0."}),
			headers=JSON_HEADERS,
			status_code=400,
		)

	# Write meals by delivery area for easy filtering from the frontend
	meal_id = f"meal-{uuid.uuid4().hex}"
	entity_payload = {
		"PartitionKey": restaurant,                 # fast list-by-area
		"RowKey": meal_id,
		"type": "meal",
		"name": name,
		"description": description,
		"price": price_val,
		"prepTimeMinutes": prep_val,
		"delivery_area": delivery_area,
		"createdAt": datetime.utcnow().isoformat() + "Z",
	}

	# Write to Table via output binding
	try:
		entity.set(json.dumps(entity_payload))
	except Exception as e:
		# Surface binding/storage errors with CORS headers so the browser doesn't show "Failed to fetch"
		return func.HttpResponse(
			json.dumps({"error": f"table_write_failed: {str(e)}"}),
			headers=JSON_HEADERS,
			status_code=500,
		)

	return func.HttpResponse(
		json.dumps({"ok": True, "mealId": meal_id, "entity": entity_payload}),
		headers=JSON_HEADERS,
		status_code=201,
	)


