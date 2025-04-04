import os
import socket
import requests
import re

# Load SolarWinds endpoint and token
SOLARWINDS_URL = os.getenv("SOLARWINDS_ENDPOINT")
TOKEN = os.getenv("SOLARWINDS_TOKEN")

if not SOLARWINDS_URL or not TOKEN:
    raise ValueError("Missing required environment variables: SOLARWINDS_ENDPOINT or SOLARWINDS_TOKEN")

# Syslog server config
UDP_IP = "0.0.0.0"
UDP_PORT = 514  # Use 1514 if you're non-root

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))

# Regex to strip leading "<pri>MMM DD HH:MM:SS [hostname]" only
# Examples:
# <15>Apr  4 22:06:57 dlink-router
# <6>Apr 4 8:12:01
SYSLOG_PREFIX_REGEX = re.compile(r"<\d+>\w{3}\s+\d+\s\d{1,2}:\d{2}:\d{2}\s")

while True:
    try:
        data, addr = sock.recvfrom(4096)
        raw_log = data.decode("utf-8", errors="ignore").strip()
        client_ip = addr[0]

        # Optional reverse DNS
        try:
            client_hostname = socket.gethostbyaddr(client_ip)[0]
        except socket.herror:
            client_hostname = None

        # Clean log (only remove syslog prefix)
        cleaned_log = SYSLOG_PREFIX_REGEX.sub("", raw_log).strip()

        # Prepend source IP (no timestamp, no container spam)
        log_entry = f"{client_ip} | {cleaned_log}"

        headers = {
            "Content-Type": "application/octet-stream",
            "Authorization": f"Bearer {TOKEN}",
            "X-Client-IP": client_ip,
            "X-Client-Hostname": client_hostname or "",
        }

        # Send to SolarWinds
        requests.post(SOLARWINDS_URL, headers=headers, data=log_entry)

    except Exception as e:
        print(f"❌ Error processing log: {e}")
