import numpy as np

def get_affine_matrix(ds):
    """
    Calculate the 4x4 affine transformation matrix from DICOM metadata.
    Maps (col, row, 0, 1) to (x, y, z, 1) in Patient Coordinate System (mm).
    """
    # Image Orientation Patient (Direction Cosines)
    iop = getattr(ds, 'ImageOrientationPatient', [1, 0, 0, 0, 1, 0])
    x_orient = np.array(iop[:3])
    y_orient = np.array(iop[3:])
    
    # Pixel Spacing
    ps = getattr(ds, 'PixelSpacing', [1.0, 1.0])
    delta_r, delta_c = float(ps[0]), float(ps[1])
    
    # Image Position Patient (Origin of the slice)
    ipp = getattr(ds, 'ImagePositionPatient', [0, 0, 0])
    t = np.array(ipp)
    
    # Construct Matrix
    # [ Sx*Xx  Sy*Yx  0  Tx ]
    # [ Sx*Xy  Sy*Yy  0  Ty ]
    # [ Sx*Xz  Sy*Yz  0  Tz ]
    # [   0      0    0   1 ]
    affine = np.eye(4)
    affine[:3, 0] = x_orient * delta_c
    affine[:3, 1] = y_orient * delta_r
    # Note: Column 2 (z-direction) is slice-dependent for 2D slices, 
    # but for a single slice's local-to-patient mapping, it's 0.
    affine[:3, 3] = t
    
    return affine

def patient_to_pixel(point_mm, ds, n_rows=None, n_cols=None):
    """
    Convert a 3D patient coordinate (x, y, z in mm) to (row, col) in a specific slice.

    Returns None if the reprojected point is more than 50% outside the image bounds,
    which cleanly rejects cross-plane projections instead of passing negative coordinates
    to the SAM-Med3D inference engine.
    """
    affine = get_affine_matrix(ds)
    inv_affine = np.linalg.inv(affine)
    
    point_patient = np.array([point_mm[0], point_mm[1], point_mm[2], 1.0])
    point_pixel = inv_affine @ point_patient
    
    # point_pixel is [col, row, z_unused, w]
    col = point_pixel[0]
    row = point_pixel[1]

    # Bounds check: reject if >50% outside image dimensions
    if n_rows is not None and n_cols is not None:
        if row < -0.5 * n_rows or row > 1.5 * n_rows:
            return None
        if col < -0.5 * n_cols or col > 1.5 * n_cols:
            return None
        # Clamp to valid range
        row = max(0, min(n_rows - 1, int(round(row))))
        col = max(0, min(n_cols - 1, int(round(col))))
        return row, col

    return int(round(row)), int(round(col))

def pixel_to_patient(row, col, ds):
    """
    Convert (row, col) in a specific slice to 3D patient coordinates (x, y, z in mm).
    """
    affine = get_affine_matrix(ds)
    pixel = np.array([col, row, 0, 1.0])
    patient = affine @ pixel
    return patient[:3]
