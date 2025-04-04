import os
import socket
import requests
import re

# Environment variables for SolarWinds
SOLARWINDS_URL = os.getenv("SOLARWINDS_ENDPOINT")
TOKEN = os.getenv("SOLARWINDS_TOKEN")

if not SOLARWINDS_URL or not TOKEN:
    raise ValueError("Missing required environment variables: SOLARWINDS_ENDPOINT or SOLARWINDS_TOKEN")

# UDP Syslog listener config
UDP_IP = "0.0.0.0"
UDP_PORT = 514  # Use 1514 if non-root

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))

# Regex to remove syslog priority + timestamp + optional hostname
# Example: <15>Apr  4 22:06:57 dlink-router
SYSLOG_CLEANUP_REGEX = re.compile(r"<\d+>\w{3}\s+\d+\s\d{2}:\d{2}:\d{2}(?:\s+\S+)?\s*")

while True:
    try:
        data, addr = sock.recvfrom(4096)
        raw_log = data.decode("utf-8", errors="ignore").strip()

        client_ip = addr[0]

        # Resolve hostname (optional)
        try:
            client_hostname = socket.gethostbyaddr(client_ip)[0]
        except socket.herror:
            client_hostname = None

        # Clean timestamp/prefix from log
        cleaned_log = SYSLOG_CLEANUP_REGEX.sub("", raw_log).strip()

        # Final log line with client IP at start
        log_entry = f"{client_ip}{' - ' + client_hostname if client_hostname else ''} | {cleaned_log}"

        headers = {
            "Content-Type": "application/octet-stream",
            "Authorization": f"Bearer {TOKEN}",
            "X-Client-IP": client_ip,
            "X-Client-Hostname": client_hostname or "",
        }

        requests.post(SOLARWINDS_URL, headers=headers, data=log_entry)

    except Exception as e:
        print(f"❌ Error processing log: {e}")
