import urllib.request
import urllib.error
import urllib.parse
import json

url = "http://127.0.0.1:8000/api/token/"
data = json.dumps({"username": "test", "password": "password"}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print("Success:", response.read().decode('utf-8'))
except urllib.error.URLError as e:
    print(f"Error ({e.__class__.__name__}): {e}")
    if hasattr(e, 'read'):
        try:
            print("Response:", e.read().decode('utf-8'))
        except:
            pass
