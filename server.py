#!/usr/bin/env python3
"""
AIRY — Local Development Server
Zero-dependency static & API server for AIRY web app.
Handles correct MIME types for ES modules, CORS, and optional Gemini proxy.
"""

import http.server
import socketserver
import os
import sys
import json
import urllib.request
import urllib.error

PORT = int(os.environ.get("PORT", 5173))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class AiryRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable aggressive caching in dev
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        # Optional AI Proxy endpoint to avoid exposing keys in client code
        if self.path == '/api/chat':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                body = json.loads(post_data.decode('utf-8'))
                prompt = body.get('prompt', '')
                api_key = os.environ.get('AIRY_AI_KEY') or os.environ.get('GEMINI_API_KEY')
                
                if not api_key:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': 'No AIRY_AI_KEY configured on server. Using client local engine.'
                    }).encode('utf-8'))
                    return

                # Forward to Gemini API
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                req = urllib.request.Request(
                    url,
                    data=json.dumps({
                        'contents': [{'role': 'user', 'parts': [{'text': prompt}]}]
                    }).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )

                with urllib.request.urlopen(req, timeout=15) as resp:
                    resp_data = resp.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(resp_data)

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def guess_type(self, path):
        # Ensure ES modules get proper javascript MIME type on Windows
        if path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        if path.endswith('.mjs'):
            return 'application/javascript; charset=utf-8'
        if path.endswith('.css'):
            return 'text/css; charset=utf-8'
        if path.endswith('.json'):
            return 'application/json; charset=utf-8'
        if path.endswith('.svg'):
            return 'image/svg+xml'
        return super().guess_type(path)

def run():
    handler = AiryRequestHandler
    # Allow port reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    # Try finding an open port starting at PORT
    current_port = PORT
    max_tries = 10
    httpd = None

    for i in range(max_tries):
        try:
            httpd = socketserver.TCPServer(("", current_port), handler)
            break
        except OSError:
            current_port += 1

    if not httpd:
        print(f"Error: Could not bind to any port from {PORT} to {PORT + max_tries}", file=sys.stderr)
        sys.exit(1)

    print(f"✨ AIRY dev server running at: http://localhost:{current_port}")
    print(f"📁 Serving directory: {DIRECTORY}")
    print("Press Ctrl+C to stop.")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    run()
