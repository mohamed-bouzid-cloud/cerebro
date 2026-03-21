import os
import sys
import django
import json
import base64

# Setup Django
sys.path.append('c:/Users/MSI/Desktop/cerebro')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from dicom_viewer.views import segment_volume
from django.test import RequestFactory
from PIL import Image
import io

factory = RequestFactory()
data = {
    "study_id": 1,
    "series_id": "1.2.276.0.7230010.3.1.3.4087122745.11320.1706769490.2801",
    "slice_idx": 14,
    "x": 480,
    "y": 480
}
request = factory.post('/api/dicom/segment/', data=json.dumps(data), content_type='application/json')

print("--- [ CEREBRO DEBUG ]: Capturing Actual Mask PNGs ---")
response = segment_volume(request)
if response.status_code == 200:
    res_data = json.loads(response.content)
    masks = res_data.get('masks', {})
    print(f"Detected masks in {len(masks)} slices.")
    
    os.makedirs('debug_masks', exist_ok=True)
    for slice_idx, b64 in masks.items():
        # Decode the PNG
        img_data = base64.b64decode(b64)
        img = Image.open(io.BytesIO(img_data))
        img.save(f"debug_masks/slice_{slice_idx}.png")
        # Check if it's mostly opaque
        # In RGBA, the 4th channel is alpha
        # For our Cyan masks, $(34, 211, 238, 255)$
        alpha = img.getchannel('A')
        extrema = alpha.getextrema()
        print(f"Slice {slice_idx}: Alpha Extrema: {extrema}")
else:
    print(f"Failed with {response.status_code}: {response.content}")
print("--- [ CEREBRO DEBUG ]: Done ---")
