import os
import base64
import io
import numpy as np
from django.conf import settings
from django.http import JsonResponse

# ─── Helper ────────────────────────────────────────────────────────────────────

def _get_dicom_files():
    """Return sorted list of .IMA files inside media/s/."""
    path = os.path.join(settings.MEDIA_ROOT, 's')
    if not os.path.exists(path):
        return []
    return sorted([f for f in os.listdir(path) if f.endswith('.IMA')])


def _array_to_base64_png(arr):
    """Convert a 2-D numpy uint8 array to a base64-encoded PNG string."""
    from PIL import Image
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')


# ─── Views ─────────────────────────────────────────────────────────────────────

def list_dicoms(request):
    """List all DICOM file URLs (used by the Cornerstone viewer)."""
    path = os.path.join(settings.MEDIA_ROOT, 's')
    files = []
    if os.path.exists(path):
        files = [
            request.build_absolute_uri(settings.MEDIA_URL + 's/' + f)
            for f in os.listdir(path) if f.endswith('.IMA')
        ]
    return JsonResponse({"dicom_urls": files})


def analyze_dicom(request):
    """
    Read a DICOM file by index, extract metadata and pixel data,
    and return a JSON response with:
      - image   : base64 PNG of the original slice
      - seg     : base64 PNG of a simple threshold segmentation
      - dicom_info : { PatientName, PatientID, Modality, StudyDate }
      - next_idx, prev_idx
    """
    try:
        import pydicom
    except ImportError:
        return JsonResponse({"error": "pydicom is not installed."}, status=500)

    try:
        from PIL import Image
    except ImportError:
        return JsonResponse({"error": "Pillow is not installed. Run: pip install Pillow"}, status=500)

    files = _get_dicom_files()

    if not files:
        return JsonResponse({"error": "No .IMA files found in media/s/"}, status=404)

    # ── Index handling ──────────────────────────────────────────────────────────
    try:
        idx = int(request.GET.get('idx', 0))
    except (ValueError, TypeError):
        idx = 0

    idx = max(0, min(idx, len(files) - 1))
    prev_idx = max(0, idx - 1)
    next_idx = min(len(files) - 1, idx + 1)

    # ── Read DICOM ──────────────────────────────────────────────────────────────
    filepath = os.path.join(settings.MEDIA_ROOT, 's', files[idx])
    ds = pydicom.dcmread(filepath)

    # ── Pixel array → normalised uint8 ─────────────────────────────────────────
    pixel_array = ds.pixel_array.astype(np.float32)
    pmin, pmax = pixel_array.min(), pixel_array.max()
    if pmax > pmin:
        pixel_array = ((pixel_array - pmin) / (pmax - pmin) * 255).astype(np.uint8)
    else:
        pixel_array = np.zeros_like(pixel_array, dtype=np.uint8)

    # ── Simple threshold segmentation ──────────────────────────────────────────
    threshold = 128
    seg_array = np.where(pixel_array > threshold, 255, 0).astype(np.uint8)

    # ── Encode both images ──────────────────────────────────────────────────────
    image_b64 = _array_to_base64_png(pixel_array)
    seg_b64   = _array_to_base64_png(seg_array)

    # ── Metadata ────────────────────────────────────────────────────────────────
    def safe_str(tag):
        val = getattr(ds, tag, None)
        return str(val) if val is not None else ''

    dicom_info = {
        'PatientName': safe_str('PatientName'),
        'PatientID':   safe_str('PatientID'),
        'Modality':    safe_str('Modality'),
        'StudyDate':   safe_str('StudyDate'),
    }

    return JsonResponse({
        'image':      image_b64,
        'seg':        seg_b64,
        'dicom_info': dicom_info,
        'next_idx':   next_idx,
        'prev_idx':   prev_idx,
        'total':      len(files),
        'current':    idx,
        'filename':   files[idx],
    })