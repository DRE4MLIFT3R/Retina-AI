from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException
)

from fastapi.staticfiles import StaticFiles

from fastapi.middleware.cors import CORSMiddleware

from PIL import Image

from io import BytesIO

from model_service import predict_image

from pathlib import Path

from database import (
    SessionLocal,
    engine,
    Base
)

from models import Prediction


# =========================
# Create Database Tables
# =========================

Base.metadata.create_all(
    bind=engine
)


# =========================
# App
# =========================

app = FastAPI(
    title="Diabetic Retinopathy AI API",
    description="AI-assisted diabetic retinopathy screening API",
    version="1.0.0"
)


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================
# Paths
# =========================

BASE_DIR = Path(
    __file__
).resolve().parent.parent

MODELS_DIR = (
    BASE_DIR / "models"
)


# =========================
# Static Files
# =========================

app.mount(
    "/results",
    StaticFiles(
        directory=str(MODELS_DIR)
    ),
    name="results"
)


# =========================
# Root
# =========================

@app.get("/")
def root():

    return {
        "message":
        "Diabetic Retinopathy AI API is running",

        "model":
        "EfficientNet-B0"
    }


# =========================
# Health Check
# =========================

@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


# =========================
# Prediction
# =========================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):

    if not file.content_type:

        raise HTTPException(
            status_code=400,
            detail="Invalid file."
        )

    if not file.content_type.startswith(
        "image/"
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload an image file."
        )

    db = SessionLocal()

    try:

        # Read uploaded image
        contents = await file.read()

        image = Image.open(
            BytesIO(contents)
        )

        # AI prediction
        result = predict_image(
            image
        )

        # =========================
        # Save Prediction
        # =========================

        prediction = Prediction(

            filename=file.filename,

            class_id=result["class_id"],

            class_name=result["class_name"],

            confidence=result["confidence"],

            gradcam_path=result["gradcam_path"]

        )

        db.add(
            prediction
        )

        db.commit()

        db.refresh(
            prediction
        )

        # =========================
        # Response
        # =========================

        gradcam_url = (
            "/results/latest_gradcam.png"
        )

        return {

            "success": True,

            "prediction_id":
            prediction.id,

            "filename":
            file.filename,

            "prediction": {

                "class_id":
                result["class_id"],

                "class_name":
                result["class_name"],

                "confidence":
                result["confidence"]

            },

            "explainability": {

                "method":
                "Grad-CAM",

                "heatmap_url":
                gradcam_url

            }

        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        db.close()

        # =========================
# Prediction History
# =========================

@app.get("/history")
def get_history():

    db = SessionLocal()

    try:

        predictions = (
            db.query(Prediction)
            .order_by(
                Prediction.created_at.desc()
            )
            .all()
        )

        history = []

        for prediction in predictions:

            history.append({

                "id":
                prediction.id,

                "filename":
                prediction.filename,

                "class_id":
                prediction.class_id,

                "class_name":
                prediction.class_name,

                "confidence":
                prediction.confidence,

                "created_at":
                prediction.created_at

            })

        return {
            "success": True,
            "count": len(history),
            "history": history
        }

    finally:

        db.close()

    # =========================
# Dashboard Statistics
# =========================

@app.get("/stats")
def get_stats():

    db = SessionLocal()

    try:

        predictions = (
            db.query(Prediction)
            .all()
        )

        total_scans = len(predictions)

        class_counts = {
            "No DR": 0,
            "Mild": 0,
            "Moderate": 0,
            "Severe": 0,
            "Proliferative DR": 0
        }

        total_confidence = 0

        for prediction in predictions:

            if prediction.class_name in class_counts:

                class_counts[
                    prediction.class_name
                ] += 1

            total_confidence += (
                prediction.confidence
            )

        if total_scans > 0:

            average_confidence = round(
                total_confidence / total_scans,
                2
            )

        else:

            average_confidence = 0


        dr_detected = (
            total_scans -
            class_counts["No DR"]
        )


        return {

            "success": True,

            "total_scans":
            total_scans,

            "dr_detected":
            dr_detected,

            "no_dr":
            class_counts["No DR"],

            "average_confidence":
            average_confidence,

            "class_distribution":
            class_counts

        }

    finally:

        db.close()