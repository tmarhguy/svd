from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from PIL import Image
import numpy as np
import uvicorn

app = FastAPI(title="SVD Image Compression API", version="1.0.0")

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def svd_compress_grayscale(img_bytes: bytes, k: int, mode: str = "largest") -> bytes:
    """Compress grayscale image using SVD with rank-k approximation"""
    A = np.array(Image.open(BytesIO(img_bytes)).convert("L"), dtype=float)
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    
    if mode == "smallest":
        # Use the k smallest singular values
        idx = np.argsort(S)[:k]
        idx = np.sort(idx)  # keep order for matrix multiplication
    else:
        # Use the k largest singular values (default)
        idx = np.argsort(S)[-k:]
        idx = np.sort(idx)
    
    Uk = U[:, idx]
    Sk = S[idx]
    Vtk = Vt[idx, :]
    Ak = (Uk * Sk) @ Vtk
    
    out = Image.fromarray(np.clip(Ak, 0, 255).astype(np.uint8))
    buf = BytesIO()
    out.save(buf, format="PNG")
    return buf.getvalue()

def svd_compress_color(img_bytes: bytes, k: int, mode: str = "largest") -> bytes:
    """Compress color image using SVD with rank-k approximation for each RGB channel"""
    # Load image and convert to RGB
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    img_array = np.array(img, dtype=float)
    
    # Separate RGB channels
    r_channel = img_array[:, :, 0]
    g_channel = img_array[:, :, 1]
    b_channel = img_array[:, :, 2]
    
    # Compress each channel separately
    def compress_channel(channel):
        U, S, Vt = np.linalg.svd(channel, full_matrices=False)
        
        if mode == "smallest":
            idx = np.argsort(S)[:k]
            idx = np.sort(idx)
        else:
            idx = np.argsort(S)[-k:]
            idx = np.sort(idx)
        
        Uk = U[:, idx]
        Sk = S[idx]
        Vtk = Vt[idx, :]
        return (Uk * Sk) @ Vtk
    
    # Compress all channels
    r_compressed = compress_channel(r_channel)
    g_compressed = compress_channel(g_channel)
    b_compressed = compress_channel(b_channel)
    
    # Reconstruct color image
    compressed_array = np.stack([r_compressed, g_compressed, b_compressed], axis=2)
    compressed_array = np.clip(compressed_array, 0, 255).astype(np.uint8)
    
    out = Image.fromarray(compressed_array)
    buf = BytesIO()
    out.save(buf, format="PNG")
    return buf.getvalue()

def svd_compress(img_bytes: bytes, k: int, mode: str = "largest", image_type: str = "grayscale") -> bytes:
    """Compress image using SVD with rank-k approximation"""
    if image_type == "color":
        return svd_compress_color(img_bytes, k, mode)
    else:
        return svd_compress_grayscale(img_bytes, k, mode)

def get_singular_values_grayscale(img_bytes: bytes) -> list:
    """Get singular values for grayscale image visualization"""
    A = np.array(Image.open(BytesIO(img_bytes)).convert("L"), dtype=float)
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    return S.tolist()

def get_singular_values_color(img_bytes: bytes) -> dict:
    """Get singular values for color image visualization (all channels)"""
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    img_array = np.array(img, dtype=float)
    
    # Get singular values for each channel
    r_channel = img_array[:, :, 0]
    g_channel = img_array[:, :, 1]
    b_channel = img_array[:, :, 2]
    
    def get_channel_sv(channel):
        U, S, Vt = np.linalg.svd(channel, full_matrices=False)
        return S.tolist()
    
    return {
        "red": get_channel_sv(r_channel),
        "green": get_channel_sv(g_channel),
        "blue": get_channel_sv(b_channel)
    }

def get_singular_values(img_bytes: bytes, image_type: str = "grayscale") -> dict:
    """Get singular values for visualization"""
    if image_type == "color":
        return get_singular_values_color(img_bytes)
    else:
        return {"grayscale": get_singular_values_grayscale(img_bytes)}

@app.post("/compress")
async def compress(k: int, mode: str = "largest", image_type: str = "grayscale", file: UploadFile = File(...)):
    """Compress image with rank-k SVD approximation"""
    try:
        img_bytes = await file.read()
        compressed_bytes = svd_compress(img_bytes, k, mode, image_type)
        
        return {
            "png": compressed_bytes.hex(),
            "success": True,
            "rank": k,
            "mode": mode,
            "image_type": image_type
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/singular-values")
async def get_singular_values_endpoint(image_type: str = "grayscale", file: UploadFile = File(...)):
    """Get singular values for chart visualization"""
    try:
        img_bytes = await file.read()
        singular_values = get_singular_values(img_bytes, image_type)
        
        return {
            "singular_values": singular_values,
            "success": True,
            "image_type": image_type
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "SVD Compression API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
