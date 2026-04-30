from fastapi import FastAPI, File, UploadFile
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import io
import cv2
import numpy as np

app = FastAPI(title="Heatmap Analyzer Microservice")

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO: Import and initialize your Hugging Face SUM model here.
# Example:
# from transformers import pipeline
# model = pipeline("image-classification", model="your-sum-model-here")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Heatmap Analyzer Microservice is running."}

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    # 1. Read the image
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 2. Run your AI model here to get the saliency/heatmap.
    # heatmap_result = model(img) ...
    #
    # FOR NOW: Mocking a heatmap by creating a generic center-focused gradient
    height, width = img.shape[:2]
    
    # Create a mock heatmap (radial gradient)
    y, x = np.ogrid[0:height, 0:width]
    center_y, center_x = height / 2, width / 2
    distance = np.sqrt((x - center_x)**2 + (y - center_y)**2)
    
    # Normalize and invert distance to create a hot center
    max_dist = np.sqrt(center_x**2 + center_y**2)
    heatmap_gray = 255 - np.clip((distance / max_dist) * 255, 0, 255).astype(np.uint8)
    
    # Apply colormap
    heatmap = cv2.applyColorMap(heatmap_gray, cv2.COLORMAP_JET)

    # 3. Convert back to bytes and return
    _, encoded_img = cv2.imencode('.jpg', heatmap)
    
    return Response(content=encoded_img.tobytes(), media_type="image/jpeg")

if __name__ == "__main__":
    import uvicorn
    # Correr el servidor en el puerto 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
