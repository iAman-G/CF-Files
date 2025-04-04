import os
import socket
import datetime
import requests

# Read environment variables
SOLARWINDS_URL = os.getenv("SOLARWINDS_ENDPOINT")
TOKEN = os.getenv("SOLARWINDS_TOKEN")

if not SOLARWINDS_URL or not TOKEN:
    raise ValueError("Missing required environment variables: SOLARWINDS_ENDPOINT or SOLARWINDS_TOKEN")

# Set up UDP syslog server
UDP_IP = "0.0.0.0"
UDP_PORT = 514  # Change to 1514 if non-root

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))

print(f"✅ Listening for syslog messages on {UDP_IP}:{UDP_PORT}...")

while True:
    data, addr = sock.recvfrom(4096)  # Increase buffer if needed
    log_data = data.decode("utf-8", errors="ignore").strip()
    
    client_ip = addr[0]
    client_port = addr[1]
    
    # Resolve hostname if possible
    try:
        client_hostname = socket.gethostbyaddr(client_ip)[0]
    except socket.herror:
        client_hostname = "Unknown"
    
    # Current UTC timestamp
    timestamp = datetime.datetime.utcnow().isoformat()

    # Format log entry
    log_entry = f"[{timestamp}] Source IP: {client_ip}:{client_port} | Hostname: {client_hostname} | Log: {log_data}"
    
    headers = {
        "Content-Type": "application/octet-stream",
        "Authorization": f"Bearer {TOKEN}",
        "X-Client-IP": client_ip,
        "X-Client-Hostname": client_hostname,
    }

    # Forward log to SolarWinds
    response = requests.post(SOLARWINDS_URL, headers=headers, data=log_entry)
    
    print(f"📤 Forwarded log: {log_entry} | Response: {response.status_code}")
