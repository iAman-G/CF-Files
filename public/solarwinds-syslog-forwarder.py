import os
import socket
import datetime
from flask import Flask, request
import requests

app = Flask(__name__)

# Read from environment variables (without fallback!)
SOLARWINDS_URL = os.getenv("SOLARWINDS_ENDPOINT")
TOKEN = os.getenv("SOLARWINDS_TOKEN")

if not SOLARWINDS_URL or not TOKEN:
    raise ValueError("Missing required environment variables: SOLARWINDS_ENDPOINT or SOLARWINDS_TOKEN")

@app.route("/", methods=["POST"])
def receive_log():
    log_data = request.get_data().decode("utf-8", errors="ignore")
    source_ip = request.remote_addr  # Client IP
    timestamp = datetime.datetime.utcnow().isoformat()  # Current UTC time
    
    try:
        hostname = socket.gethostbyaddr(source_ip)[0]
    except socket.herror:
        hostname = "Unknown"

    log_entry = f"[{timestamp}] {source_ip} ({hostname}): {log_data}"

    headers = {
        "Content-Type": "application/octet-stream",
        "Authorization": f"Bearer {TOKEN}"
    }

    requests.post(SOLARWINDS_URL, headers=headers, data=log_entry)
    return "Log forwarded", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=514, debug=True)
