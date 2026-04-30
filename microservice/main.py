from fastapi import FastAPI, File, UploadFile, HTTPException
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
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="No se pudo decodificar la imagen.")

    h, w = img.shape[:2]

    # ─────────────────────────────────────────────
    # 1.  SEÑALES DE ATENCIÓN VISUAL (principios UX)
    # ─────────────────────────────────────────────

    # — A. Tamaño / densidad de bordes (elementos grandes = más atención) —
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 30, 100)
    # Suavizamos mucho para convertir bordes en "manchas de presencia"
    edge_density = cv2.GaussianBlur(edges.astype(np.float32), (0, 0), sigmaX=w * 0.04)

    # — B. Contraste de luminancia local —
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2Lab).astype(np.float32)
    L = lab[:, :, 0]
    L_blur = cv2.GaussianBlur(L, (0, 0), sigmaX=w * 0.05)
    lum_contrast = np.abs(L - L_blur)

    # — C. Saturación de color (colores vivos llaman la atención) —
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    saturation = hsv[:, :, 1]  # 0-255

    # — D. Saliency espectral (novedad global) —
    saliency_sr = cv2.saliency.StaticSaliencySpectralResidual_create()
    _, sr_map = saliency_sr.computeSaliency(img)
    sr_map = (sr_map * 255).astype(np.float32)

    # — E. Sesgo de centro (las personas miran primero al centro-superior) —
    # Centro ponderado: ligeramente arriba del centro geométrico
    cy, cx = h * 0.42, w * 0.5
    Y, X = np.ogrid[0:h, 0:w]
    # Elipse alargada verticalmente para simular patrón F/Z de lectura
    sigma_x, sigma_y = w * 0.40, h * 0.35
    center_bias = np.exp(-((X - cx)**2 / (2 * sigma_x**2) + (Y - cy)**2 / (2 * sigma_y**2)))
    center_bias = (center_bias * 255).astype(np.float32)

    # ─────────────────────────────────────────────
    # 2.  COMBINAR SEÑALES (pesos calibrados a UX)
    # ─────────────────────────────────────────────
    def norm(m):
        mn, mx = m.min(), m.max()
        if mx - mn < 1e-6:
            return np.zeros_like(m)
        return (m - mn) / (mx - mn) * 255.0

    combined = (
        0.30 * norm(edge_density)       # tamaño/presencia de elementos
      + 0.20 * norm(lum_contrast)       # contraste de luminancia
      + 0.15 * norm(saturation)         # saturación / color llamativo
      + 0.15 * norm(sr_map)             # novedad espectral
      + 0.20 * norm(center_bias)        # sesgo de posición central
    )
    combined = norm(combined).astype(np.uint8)

    # ─────────────────────────────────────────────
    # 3.  SUAVIZAR → manchas naturales, no bordes duros
    # ─────────────────────────────────────────────
    # Sigma grande para que parezca un "blob" de calor, no un mapa de bordes
    sigma_blur = max(w, h) * 0.045
    heatmap_smooth = cv2.GaussianBlur(combined, (0, 0), sigmaX=sigma_blur)
    # Segunda pasada para aún más suavidad
    heatmap_smooth = cv2.GaussianBlur(heatmap_smooth, (0, 0), sigmaX=sigma_blur * 0.6)
    heatmap_smooth = norm(heatmap_smooth).astype(np.uint8)

    # ─────────────────────────────────────────────
    # 4.  COLORMAP RGBA → solo las zonas "calientes" son opacas
    # ─────────────────────────────────────────────
    # JET: 0=azul(frío) → 128=verde → 255=rojo(caliente)
    # Invertimos para que rojo = alta atención
    heatmap_color = cv2.applyColorMap(heatmap_smooth, cv2.COLORMAP_JET)  # BGR
    heatmap_rgb   = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

    # Alpha: proporcional al calor, con umbral mínimo para transparencia real
    # Las zonas frías (azul/morado) quedan casi transparentes
    alpha_raw = heatmap_smooth.astype(np.float32) / 255.0
    # Función de potencia: reduce la opacidad de zonas mediocres y amplifica las calientes
    alpha_curve = np.power(alpha_raw, 1.5)
    # Escalar a 0-200 (máx opacidad = 78%, para que el original siempre se vea)
    alpha_channel = (alpha_curve * 200).astype(np.uint8)

    # ─────────────────────────────────────────────
    # 5.  COMPONER: original + overlay RGBA
    # ─────────────────────────────────────────────
    original_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)
    heat_f       = heatmap_rgb.astype(np.float32)
    alpha_f      = (alpha_channel.astype(np.float32) / 255.0)[:, :, np.newaxis]

    blended = (1.0 - alpha_f) * original_rgb + alpha_f * heat_f
    blended = np.clip(blended, 0, 255).astype(np.uint8)

    # ─────────────────────────────────────────────
    # 6.  CODIFICAR Y DEVOLVER
    # ─────────────────────────────────────────────
    result_bgr = cv2.cvtColor(blended, cv2.COLOR_RGB2BGR)
    _, encoded = cv2.imencode('.jpg', result_bgr, [cv2.IMWRITE_JPEG_QUALITY, 94])
    return Response(content=encoded.tobytes(), media_type="image/jpeg")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
