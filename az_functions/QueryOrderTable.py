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
	logging.info("HTTP trigger received to query Orders table")

	# CORS preflight
	if req.method == "OPTIONS":
		return func.HttpResponse(
			status_code=204,
			headers={
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET,OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, x-functions-key",
			},
		)

	table_name = os.environ.get("TABLE_NAME", "Orders")
	connection_string = os.environ.get("AzureWebJobsStorage")
	if not connection_string:
		return func.HttpResponse(json.dumps({"error": "Missing AzureWebJobsStorage connection string."}), headers=JSON_HEADERS, status_code=500)

	# Query params
	def qp(name, cast=str, default=None):
		val = req.params.get(name)
		if val is None:
			return default
		try:
			return cast(val)
		except Exception:
			return default

	delivery_area = qp("delivery_area", str, None)  # REQUIRED for area feed
	order_id = qp("order_id", str, None)            # optional: filter by RowKey
	top = qp("top", int, 100)

	if not delivery_area and not order_id:
		return func.HttpResponse(json.dumps({"error": "Provide 'delivery_area' or 'order_id'"}), headers=JSON_HEADERS, status_code=400)

	table = TableServiceClient.from_connection_string(conn_str=connection_string).get_table_client(table_name)

	# Build filter
	parts = []
	if delivery_area:
		area_val = str(delivery_area).replace("'", "''")
		parts.append(f"PartitionKey eq '{area_val}'")
	if order_id:
		row_val = str(order_id).replace("'", "''")
		parts.append(f"RowKey eq '{row_val}'")
	filter_expr = " and ".join(parts) if parts else None

	try:
		results = []
		if filter_expr:
			entities = table.query_entities(query_filter=filter_expr)
		else:
			entities = table.list_entities()
		for e in entities:
			results.append(dict(e))
			if len(results) >= top:
				break
		return func.HttpResponse(json.dumps(results), headers=JSON_HEADERS, status_code=200)
	except Exception as e:
		return func.HttpResponse(json.dumps({"error": str(e), "filter": filter_expr}), headers=JSON_HEADERS, status_code=500)


