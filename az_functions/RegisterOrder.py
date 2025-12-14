import logging
import uuid
import json
from datetime import datetime
import azure.functions as func

JSON_HEADERS = {
	"Content-Type": "application/json",
	"Access-Control-Allow-Origin": "*",
}

FIXED_PICKUP_MINUTES = 10
FIXED_DELIVERY_MINUTES = 15

def main(req: func.HttpRequest, entity: func.Out[str]) -> func.HttpResponse:
	logging.info("HTTP trigger received - add_order")

	# CORS preflight for browsers
	if req.method == "OPTIONS":
		return func.HttpResponse(
			status_code=204,
			headers={
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		)

	try:
		body = req.get_json()
	except ValueError:
		body = {}

	delivery_area = (body.get("delivery_area") or "").strip()
	address = (body.get("address") or "").strip()
	items = body.get("items")  # expected: list of {restaurantId, mealId, name, price, qty, prepTimeMinutes}

	if not delivery_area or not address or not items or not isinstance(items, list):
		return func.HttpResponse(
			json.dumps({"error": "Fields 'delivery_area', 'address', and list 'items' are required."}),
			headers=JSON_HEADERS,
			status_code=400,
		)

	try:
		subtotal = sum(float(i["price"]) * int(i.get("qty", 1)) for i in items)
		prep_sum = sum(int(i.get("prepTimeMinutes", 0)) * int(i.get("qty", 1)) for i in items)
	except Exception:
		return func.HttpResponse(
			json.dumps({"error": "Each item must include numeric 'price' and 'prepTimeMinutes'."}),
			headers=JSON_HEADERS,
			status_code=400,
		)

	estimated_minutes = prep_sum + FIXED_PICKUP_MINUTES + FIXED_DELIVERY_MINUTES

	order_id = f"ord-{uuid.uuid4().hex}"
	entity_payload = {
		"PartitionKey": delivery_area,   # partition orders by area
		"RowKey": order_id,
		"type": "order",
		"createdAt": datetime.utcnow().isoformat() + "Z",
		"delivery_area": delivery_area,
		"address": address,
		"itemsJson": json.dumps(items),
		"subtotal": float(subtotal),
		"estimatedMinutes": int(estimated_minutes),
	}

	entity.set(json.dumps(entity_payload))

	return func.HttpResponse(
		json.dumps({"ok": True, "orderId": order_id, "entity": entity_payload}),
		headers=JSON_HEADERS,
		status_code=201,
	)


