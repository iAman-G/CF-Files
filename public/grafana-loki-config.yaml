print(">>> STARTING LOKI FORWARDER <<<")

import socket
import requests
import os
from datetime import datetime

# Environment configs
LOKI_HOST = os.getenv("LOKI_HOST", "localhost")
LOKI_USERNAME = os.getenv("LOKI_USERNAME")
LOKI_PASSWORD = os.getenv("LOKI_PASSWORD")
LISTEN_PORT = int(os.getenv("LISTEN_PORT", "514"))

# Loki push URL (HTTPS only)
LOKI_URL = f"https://{LOKI_HOST}/loki/api/v1/push"

# Setup UDP listener
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(("0.0.0.0", LISTEN_PORT))
print(f"Listening on UDP port {LISTEN_PORT}")
print(f"Sending logs to {LOKI_URL}")

# Basic auth if provided
auth = (LOKI_USERNAME, LOKI_PASSWORD) if LOKI_USERNAME and LOKI_PASSWORD else None

while True:
    try:
        data, addr = sock.recvfrom(65535)
        log = data.decode(errors='ignore').strip()
        print(f"[LOG] {addr[0]}: {log}")

        timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f") + "000Z"

        payload = {
            "streams": [
                {
                    "labels": f'{{host="{addr[0]}", job="udp-logs"}}',
                    "entries": [
                        {
                            "ts": timestamp,
                            "line": log
                        }
                    ]
                }
            ]
        }

        r = requests.post(LOKI_URL, auth=auth, json=payload, timeout=5)
        print(f"[LOKI] {r.status_code} - {r.text}")

    except Exception as e:
        print(f"[ERROR] {e}")
