import json
from http.server import BaseHTTPRequestHandler, HTTPServer

class Handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/api/institutions':
            self._send(200, [{"code": "GCASH", "name": "GCash"}])
            return
        self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path == '/api/orders':
            length = int(self.headers.get('Content-Length', '0'))
            data = self.rfile.read(length).decode('utf-8')
            payload = json.loads(data or '{}')
            reference_no = payload.get('x_reference_no') or 'mock-ref'
            self._send(200, {
                'customerRedirectUrl': f'http://127.0.0.1:8765/pay/{reference_no}',
                'paymentId': f'mock-{reference_no}',
            })
            return
        self._send(404, {"error": "not found"})

    def log_message(self, format, *args):
        return

if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', 8765), Handler)
    print('mock swiftpay listening on 127.0.0.1:8765', flush=True)
    server.serve_forever()
