import os, json, logging
import azure.functions as func
import urllib.request

JSON_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",             # restrict to your origins in production
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
}

def main(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return func.HttpResponse(status_code=204, headers=JSON_HEADERS)

    try:
        payload = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON"}),
            headers=JSON_HEADERS, status_code=400
        )

    target_url = os.environ.get("TARGET_ORDER_URL")
    target_key = os.environ.get("TARGET_ORDER_KEY")
    if not target_url or not target_key:
        return func.HttpResponse(
            json.dumps({"error": "Server not configured"}), headers=JSON_HEADERS, status_code=500
        )

    # Forward to the real function with the key server-side
    url = f"{target_url}?code={target_key}"
    data = json.dumps(payload).encode("utf-8")
    req_fw = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(req_fw) as resp:
            body = resp.read()
            status = resp.getcode()
            return func.HttpResponse(body, status_code=status, headers=JSON_HEADERS)
    except Exception as e:
        logging.exception("Proxy call failed")
        return func.HttpResponse(
            json.dumps({"error": "proxy_failed", "detail": str(e)}),
            headers=JSON_HEADERS, status_code=502
        )