import os
import json
import logging
import urllib.request
import azure.functions as func

JSON_HEADERS = {
	"Content-Type": "application/json",
	"Access-Control-Allow-Origin": "*",  # restrict to your origins in production
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Allow-Methods": "POST,OPTIONS"
}

def main(req: func.HttpRequest) -> func.HttpResponse:
	logging.info("HTTP trigger received - proxy_register_meal")

	# CORS preflight
	if req.method == "OPTIONS":
		return func.HttpResponse(status_code=204, headers=JSON_HEADERS)

	# Read JSON body
	try:
		payload = req.get_json()
	except ValueError:
		return func.HttpResponse(
			json.dumps({"error": "Invalid JSON"}),
			headers=JSON_HEADERS,
			status_code=400
		)

	target_url = os.environ.get("TARGET_MEAL_URL")  # e.g., https://registermeal.azurewebsites.net/api/RegisterMeal
	target_key = os.environ.get("TARGET_MEAL_KEY")  # function key
	if not target_url or not target_key:
		return func.HttpResponse(
			json.dumps({"error": "Server not configured (TARGET_MEAL_URL / TARGET_MEAL_KEY missing)"}),
			headers=JSON_HEADERS,
			status_code=500
		)

	url = f"{target_url}?code={target_key}"
	data = json.dumps(payload).encode("utf-8")
	req_fw = urllib.request.Request(
		url,
		data=data,
		headers={"Content-Type": "application/json"},
		method="POST"
	)

	try:
		with urllib.request.urlopen(req_fw) as resp:
			body = resp.read()
			status = resp.getcode()
			return func.HttpResponse(body, status_code=status, headers=JSON_HEADERS)
	except Exception as e:
		logging.exception("Proxy meal call failed")
		return func.HttpResponse(
			json.dumps({"error": "proxy_failed", "detail": str(e)}),
			headers=JSON_HEADERS,
			status_code=502
		)