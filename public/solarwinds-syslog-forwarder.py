import os
import socket
import datetime
import requests
import re

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

# Regex to remove syslog timestamp & priority (e.g., "<15>Apr 4 22:06:57")
SYSLOG_CLEANUP_REGEX = re.compile(r"<\d+>\w{3}\s+\d+\s\d+:\d+:\d+\s")

while True:
    try:
        data, addr = sock.recvfrom(4096)  # Increase buffer if needed
        log_data = data.decode("utf-8", errors="ignore").strip()

        client_ip = addr[0]

        # Resolve hostname if possible
        try:
            client_hostname = socket.gethostbyaddr(client_ip)[0]
        except socket.herror:
            client_hostname = None  # Don't use "Unknown"

        # Remove syslog timestamp & priority
        log_data_cleaned = SYSLOG_CLEANUP_REGEX.sub("", log_data).strip()

        # Format log entry
        log_entry = f"{client_ip}{' - ' + client_hostname if client_hostname else ''} | {log_data_cleaned}"
        
        headers = {
            "Content-Type": "application/octet-stream",
            "Authorization": f"Bearer {TOKEN}",
            "X-Client-IP": client_ip,
            "X-Client-Hostname": client_hostname or "",
        }

        # Forward log to SolarWinds
        response = requests.post(SOLARWINDS_URL, headers=headers, data=log_entry)

    except Exception as e:
        print(f"❌ Error processing log: {e}")
