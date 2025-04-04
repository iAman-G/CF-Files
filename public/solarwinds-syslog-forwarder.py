import socket
import requests
import os

# Configuration
HOST = "0.0.0.0"  # Listen on all interfaces
PORT = 514        # UDP Syslog Port
BUFFER_SIZE = 1024
SOLARWINDS_URL = os.getenv("SOLARWINDS_ENDPOINT")
AUTH_TOKEN = os.getenv("SOLARWINDS_TOKEN")
HEADERS = {
    "Content-Type": "application/octet-stream",
    "Authorization": f"Bearer {AUTH_TOKEN}"
}

# Start UDP server
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((HOST, PORT))
print(f"🔄 Listening for syslog messages on UDP {PORT}...")

while True:
    data, addr = sock.recvfrom(BUFFER_SIZE)
    log_message = data.decode().strip()
    
    print(f"📥 Received from {addr[0]}: {log_message}")

    # Send log to SolarWinds
    try:
        response = requests.post(SOLARWINDS_URL, headers=HEADERS, data=log_message)
        print(f"📤 Forwarded to SolarWinds: {response.status_code}")
    except Exception as e:
        print(f"❌ Error forwarding log: {e}")
