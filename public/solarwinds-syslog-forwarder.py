import os
import socket
import datetime
from flask import Flask, request
import requests

app = Flask(__name__)

# Read from environment variables (NO HARDCODED SECRETS!)
SOLARWINDS_URL = os.getenv("SOLARWINDS_ENDPOINT")
TOKEN = os.getenv("SOLARWINDS_TOKEN")

if not SOLARWINDS_URL or not TOKEN:
    raise ValueError("Missing required environment variables: SOLARWINDS_ENDPOINT or SOLARWINDS_TOKEN")

@app.route("/", methods=["POST"])
def receive_log():
    log_data = request.get_data().decode("utf-8", errors="ignore")
    source_ip = request.remote_addr  # Client IP
    timestamp = datetime.datetime.utcnow().isoformat()  # Current UTC time
    
    # Try resolving hostname
    try:
        hostname = socket.gethostbyaddr(source_ip)[0]
    except socket.herror:
        hostname = "Unknown"

    # Collect client headers (User-Agent, etc.)
    client_headers = {key: request.headers[key] for key in request.headers.keys()}
    
    # Format log entry with all details
    log_entry = f"""
    [{timestamp}]
    Source IP: {source_ip}
    Hostname: {hostname}
    Raw Log: {log_data}
    Headers: {client_headers}
    """

    headers = {
        "Content-Type": "application/octet-stream",
        "Authorization": f"Bearer {TOKEN}"
    }

    response = requests.post(SOLARWINDS_URL, headers=headers, data=log_entry)
    
    return f"Log forwarded (Status: {response.status_code})", response.status_code

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=514, debug=True)
