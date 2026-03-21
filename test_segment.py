import os
import sys
import django
import json

# Setup Django
sys.path.append('c:/Users/MSI/Desktop/cerebro')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerebro.settings')
django.setup()

from dicom_viewer.views import segment_volume
from django.test import RequestFactory

factory = RequestFactory()
# Use parameters that match what the doctor clicked
data = {
    "x": 256,
    "y": 256,
    "slice_index": 50,
    "series_id": 1
}
request = factory.post('/api/dicom/segment/', data=json.dumps(data), content_type='application/json')

print("--- [ CEREBRO DIAGNOSTIC ]: Starting Manual Segment Test ---")
try:
    response = segment_volume(request)
    print(f"Status: {response.status_code}")
    print(f"Content: {response.content[:500]}...") # Truncate if success
except Exception as e:
    print(f"FAILED with Exception: {e}")
    import traceback
    traceback.print_exc()
print("--- [ CEREBRO DIAGNOSTIC ]: Test Complete ---")
