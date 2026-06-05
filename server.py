import http.server
import socketserver
import socket

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Disable caching for easier development and testing
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't need to be reachable, just to resolve internal routing
        s.connect(('8.8.8.8', 80))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

local_ip = get_local_ip()

print("=" * 60)
print("  NEON ENDEAVOR - LOCAL DEVELOPMENT SERVER")
print("=" * 60)
print(f"  * Desktop Access: http://localhost:{PORT}")
print(f"  * Mobile Access:  http://{local_ip}:{PORT}")
print("-" * 60)
print("  Note: Sensor features (Gyro) require a secure context (HTTPS)")
print("  or localhost. For mobile testing over Wi-Fi, you can use")
print("  Chrome's port forwarding, or use the touch fallback controls.")
print("=" * 60)
print("Press Ctrl+C to stop the server.")

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
