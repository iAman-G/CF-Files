import socket
import datetime
from flask import Flask, request
import requests

app = Flask(__name__)

SOLARWINDS_URL = "https://logs.collector.ap-01.cloud.solarwinds.com/v1/logs"
TOKEN = "b4f9DeyyunOGFXcDYap5g458ZaDQhUbgoI-ykR_kVxOX_gnr_gaJyJTcxrsWNaR3_xiVTZo"

@app.route("/", methods=["POST"])
def receive_log():
    log_data = request.get_data().decode("utf-8", errors="ignore")
    source_ip = request.remote_addr  # Client IP
    timestamp = datetime.datetime.utcnow().isoformat()  # Current time (UTC)
    
    # Attempt to resolve hostname, fallback to IP if resolution fails
    try:
        hostname = socket.gethostbyaddr(source_ip)[0]
    except socket.herror:
        hostname = "Unknown"

    user_agent = request.headers.get("User-Agent", "N/A")  # Get User-Agent header
    content_length = request.headers.get("Content-Length", "N/A")  # Log size
    all_headers = dict(request.headers)  # Capture all headers

    log_entry = (
        f"Timestamp: {timestamp} | "
        f"Source IP: {source_ip} | "
        f"Hostname: {hostname} | "
        f"User-Agent: {user_agent} | "
        f"Content-Length: {content_length} | "
        f"Headers: {all_headers} | "
        f"Log: {log_data}"
    )

    headers = {
        "Content-Type": "application/octet-stream",
        "Authorization": f"Bearer {TOKEN}"
    }

    # Forward to SolarWinds
    requests.post(SOLARWINDS_URL, headers=headers, data=log_entry)

    return "Log forwarded", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=514, debug=True)
