from fastapi import FastAPI, File, UploadFile
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np

app = FastAPI(title="Heatmap Analyzer Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Heatmap Analyzer Microservice is running."}

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    # 1. Leer la imagen
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="No se pudo decodificar la imagen.")

    height, width = img.shape[:2]

    # 2. Calcular saliency map con tres métodos y combinarlos por ensemble
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # --- Método A: Spectral Residual (rápido, detecta bordes prominentes) ---
    saliency_sr = cv2.saliency.StaticSaliencySpectralResidual_create()
    _, saliency_map_sr = saliency_sr.computeSaliency(img)
    saliency_map_sr = (saliency_map_sr * 255).astype(np.uint8)

    # --- Método B: Fine Grained (más detallado, basado en frecuencia espacial) ---
    saliency_fg = cv2.saliency.StaticSaliencyFineGrained_create()
    _, saliency_map_fg = saliency_fg.computeSaliency(img)
    saliency_map_fg = (saliency_map_fg * 255).astype(np.uint8)

    # --- Método C: Contrast-based local saliency (detecta regiones inusuales) ---
    # Convertir a Lab para medir contraste de color perceptual
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2Lab).astype(np.float32)
    blurred_lab = cv2.GaussianBlur(lab, (51, 51), 0)
    contrast_map = np.linalg.norm(lab - blurred_lab, axis=2)
    contrast_map = cv2.normalize(contrast_map, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    # --- Ensemble: combinación ponderada ---
    # Spectral residual capta la "novedad" general, FineGrained los detalles,
    # y contrast_map el color/contraste local.
    combined = (
        0.40 * saliency_map_sr.astype(np.float32)
        + 0.35 * saliency_map_fg.astype(np.float32)
        + 0.25 * contrast_map.astype(np.float32)
    )
    combined = cv2.normalize(combined, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    # 3. Suavizar para aspecto más natural
    combined = cv2.GaussianBlur(combined, (31, 31), 0)

    # 4. Aplicar CLAHE para mejorar el contraste del heatmap
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    combined = clahe.apply(combined)

    # 5. Aplicar colormap JET y mezclar semitransparentemente sobre la imagen original
    heatmap_color = cv2.applyColorMap(combined, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(img, 0.35, heatmap_color, 0.65, 0)

    # 6. Codificar y devolver
    _, encoded_img = cv2.imencode('.jpg', overlay, [cv2.IMWRITE_JPEG_QUALITY, 92])
    return Response(content=encoded_img.tobytes(), media_type="image/jpeg")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
