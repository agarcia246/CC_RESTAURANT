import logging
import os
import json
from azure.data.tables import TableServiceClient
import azure.functions as func

JSON_HEADERS = {
	"Content-Type": "application/json",
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "Content-Type, x-functions-key",
}

def main(req: func.HttpRequest) -> func.HttpResponse:
	logging.info("HTTP trigger received to query MealsByArea")

	# CORS preflight for browsers
	if req.method == "OPTIONS":
		return func.HttpResponse(
			status_code=204,
			headers={
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET,OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, x-functions-key",
			},
		)

	table_name = os.environ.get("TABLE_NAME", "MealsByArea")
	connection_string = os.environ.get("AzureWebJobsStorage")

	if not connection_string:
		return func.HttpResponse(json.dumps({"error": "Missing AzureWebJobsStorage connection string."}), headers=JSON_HEADERS, status_code=500)

	# Read query params
	def qp(name, cast=str, default=None):
		val = req.params.get(name)
		if val is None:
			return default
		try:
			return cast(val)
		except Exception:
			return default

	delivery_area = qp("delivery_area", str, None)  # REQUIRED
	name_eq = qp("name", str, None)                 # optional exact match
	max_price = qp("max_price", float, None)        # optional <=
	min_price = qp("min_price", float, None)        # optional >=
	top = qp("top", int, 100)                       # client-side cap

	if not delivery_area:
		return func.HttpResponse(json.dumps({"error": "Query param 'delivery_area' is required."}), headers=JSON_HEADERS, status_code=400)

	table_client = TableServiceClient.from_connection_string(conn_str=connection_string).get_table_client(table_name)

	# Build filter: PartitionKey eq '{area}' AND [optional filters]
	val = str(delivery_area).replace("'", "''")
	parts = [f"PartitionKey eq '{val}'"]
	if name_eq:
		name_val = str(name_eq).replace("'", "''")
		parts.append(f"name eq '{name_val}'")
	if max_price is not None:
		parts.append(f"price le {max_price}")
	if min_price is not None:
		parts.append(f"price ge {min_price}")
	filter_expr = " and ".join(parts)

	try:
		results = []
		for entity in table_client.query_entities(query_filter=filter_expr):
			results.append(dict(entity))
			if len(results) >= top:
				break
		return func.HttpResponse(json.dumps(results), headers=JSON_HEADERS, status_code=200)
	except Exception as e:
		return func.HttpResponse(json.dumps({"error": str(e), "filter": filter_expr}), headers=JSON_HEADERS, status_code=500)


