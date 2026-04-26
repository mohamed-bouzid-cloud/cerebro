
# Radiomics Feature Set (Segmentation Project)

## 1. First-Order Statistics (Intensity)
- Mean intensity
- Median intensity
- Standard deviation
- Variance
- Skewness
- Kurtosis
- Entropy (important for heterogeneity)

---

## 2. Shape Features (Robust to segmentation noise)
- Volume (V)
- Surface Area (S)
- Sphericity
- Compactness
- Elongation
- Maximum diameter

### 🔥 Stability Trick (IMPORTANT)
Instead of using raw Volume and Surface independently (due to artifacts):

- **Surface-to-Volume Ratio (SVR)** = S / V
- **Normalized Volume features** (if needed across scans)

👉 SVR is more stable when segmentation boundaries fluctuate slightly.

---

## 3. Texture Features (GLCM)
- Contrast
- Correlation
- Energy (ASM)
- Homogeneity
- Entropy

---

## 4. GLRLM Features
- Short Run Emphasis (SRE)
- Long Run Emphasis (LRE)
- Gray-Level Non-Uniformity (GLN)
- Run Length Non-Uniformity (RLN)

---

## 5. GLSZM Features
- Zone Size Variance
- Large Area Emphasis
- Small Area Emphasis
- Zone Entropy

---

## 6. Wavelet Features (VERY IMPORTANT)

Wavelet transforms decompose your image into multiple frequency components:

- Low-frequency (structure / shape)
- High-frequency (edges / texture / noise)

After decomposition, you re-extract ALL features above on each decomposed version.

👉 This allows detection of patterns at multiple scales (fine + coarse).

---

## Final Recommended Core Set
- Entropy (first-order + texture)
- Standard deviation
- SVR (Surface / Volume ratio)
- Sphericity
- GLCM Contrast + Homogeneity
- GLRLM SRE
- GLSZM Zone Entropy
- Wavelet-entropy features

---

## Notes
- Always normalize intensity before extraction.
- Always validate feature stability (test-retest if possible).
- Remove highly correlated features (>0.9 correlation).
