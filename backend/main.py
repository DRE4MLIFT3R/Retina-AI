from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Depends
)

from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from pydantic import BaseModel

from PIL import Image
from io import BytesIO

from pathlib import Path

from model_service import predict_image

from database import (
    SessionLocal,
    engine,
    Base
)

from models import (
    Prediction,
    User
)

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(
    bind=engine
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Diabetic Retinopathy AI API",
    description="AI-assisted diabetic retinopathy screening API",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

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


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(
    __file__
).resolve().parent.parent

MODELS_DIR = BASE_DIR / "models"


# ============================================================
# STATIC FILES
# ============================================================

app.mount(
    "/results",
    StaticFiles(
        directory=str(MODELS_DIR)
    ),
    name="results"
)


# ============================================================
# JWT SECURITY
# ============================================================

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    )
):
    """
    Get the currently authenticated user
    from the JWT token.
    """

    token = credentials.credentials

    try:

        token_data = verify_access_token(
            token
        )

    except ValueError as e:

        raise HTTPException(
            status_code=401,
            detail=str(e)
        )

    user_id = token_data["user_id"]

    db = SessionLocal()

    try:

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:

            raise HTTPException(
                status_code=401,
                detail="User not found."
            )

        return user

    finally:

        db.close()


def get_current_admin(
    current_user: User = Depends(
        get_current_user
    )
):
    """
    Allow access only to admin users.
    """

    if current_user.role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    return current_user


# ============================================================
# REQUEST MODELS
# ============================================================

class RegisterRequest(BaseModel):

    name: str
    email: str
    password: str


class LoginRequest(BaseModel):

    email: str
    password: str


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Diabetic Retinopathy AI API is running",
        "model": "EfficientNet-B0"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


# ============================================================
# REGISTER
# ============================================================

@app.post("/register")
def register(
    request: RegisterRequest
):

    db = SessionLocal()

    try:

        existing_user = (
            db.query(User)
            .filter(
                User.email == request.email
            )
            .first()
        )

        if existing_user:

            raise HTTPException(
                status_code=400,
                detail="Email already registered."
            )

        if len(request.password) < 6:

            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters."
            )

        hashed_password = hash_password(
            request.password
        )

        user = User(
            name=request.name,
            email=request.email,
            password=hashed_password,
            role="user"
        )

        db.add(user)

        db.commit()

        db.refresh(user)

        return {

            "success": True,

            "message": "Registration successful.",

            "user": {

                "id": user.id,

                "name": user.name,

                "email": user.email,

                "role": user.role

            }

        }

    except HTTPException:

        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        db.close()


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(
    request: LoginRequest
):

    db = SessionLocal()

    try:

        user = (
            db.query(User)
            .filter(
                User.email == request.email
            )
            .first()
        )

        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        password_correct = verify_password(
            request.password,
            user.password
        )

        if not password_correct:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        # Create JWT containing user ID + role
        access_token = create_access_token(
            user.id,
            user.role
        )

        return {

            "success": True,

            "message": "Login successful.",

            "access_token": access_token,

            "token_type": "bearer",

            "user": {

                "id": user.id,

                "name": user.name,

                "email": user.email,

                "role": user.role

            }

        }

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        db.close()


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/me")
def get_current_user_info(
    current_user: User = Depends(
        get_current_user
    )
):

    return {

        "success": True,

        "user": {

            "id": current_user.id,

            "name": current_user.name,

            "email": current_user.email,

            "role": current_user.role

        }

    }


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
async def predict(

    file: UploadFile = File(...),

    current_user: User = Depends(
        get_current_user
    )

):

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Validate File
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # Read Image
        # ----------------------------------------------------

        contents = await file.read()

        try:

            image = Image.open(
                BytesIO(contents)
            )

            image.load()

        except Exception:

            raise HTTPException(
                status_code=400,
                detail="Invalid image file."
            )

        # ----------------------------------------------------
        # AI Prediction
        # ----------------------------------------------------

        result = predict_image(
            image
        )

        # ----------------------------------------------------
        # Save Prediction
        # ----------------------------------------------------

        prediction = Prediction(

            user_id=current_user.id,

            filename=file.filename,

            class_id=result["class_id"],

            class_name=result["class_name"],

            confidence=result["confidence"],

            gradcam_path=result["gradcam_path"]

        )

        db.add(prediction)

        db.commit()

        db.refresh(prediction)

        # ----------------------------------------------------
        # Grad-CAM URL
        # ----------------------------------------------------

        gradcam_url = (
            "/results/latest_gradcam.png"
        )

        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return {

            "success": True,

            "prediction_id": prediction.id,

            "filename": file.filename,

            "prediction": {

                "class_id":
                    result["class_id"],

                "class_name":
                    result["class_name"],

                "confidence":
                    result["confidence"]

            },

            "explainability": {

                "method": "Grad-CAM",

                "heatmap_url": gradcam_url

            }

        }

    except HTTPException:

        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        db.close()


# ============================================================
# USER PREDICTION HISTORY
# ============================================================

@app.get("/history")
def get_history(

    current_user: User = Depends(
        get_current_user
    )

):

    db = SessionLocal()

    try:

        predictions = (
            db.query(Prediction)
            .filter(
                Prediction.user_id ==
                current_user.id
            )
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

            "count":
                len(history),

            "history":
                history

        }

    finally:

        db.close()


# ============================================================
# USER DASHBOARD STATISTICS
# ============================================================

@app.get("/stats")
def get_stats(

    current_user: User = Depends(
        get_current_user
    )

):

    db = SessionLocal()

    try:

        predictions = (
            db.query(Prediction)
            .filter(
                Prediction.user_id ==
                current_user.id
            )
            .all()
        )

        total_scans = len(
            predictions
        )

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
                total_confidence /
                total_scans,
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


# ============================================================
# ADMIN DASHBOARD
# ============================================================


# ============================================================
# ADMIN STATISTICS
# ============================================================

@app.get("/admin/stats")
def admin_stats(

    current_admin: User = Depends(
        get_current_admin
    )

):

    db = SessionLocal()

    try:

        total_users = db.query(
            User
        ).count()

        total_predictions = db.query(
            Prediction
        ).count()

        predictions = db.query(
            Prediction
        ).all()

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

        if total_predictions > 0:

            average_confidence = round(
                total_confidence /
                total_predictions,
                2
            )

        else:

            average_confidence = 0

        dr_detected = (
            total_predictions -
            class_counts["No DR"]
        )

        return {

            "success": True,

            "total_users":
                total_users,

            "total_predictions":
                total_predictions,

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


# ============================================================
# ADMIN USERS
# ============================================================

@app.get("/admin/users")
def admin_users(

    current_admin: User = Depends(
        get_current_admin
    )

):

    db = SessionLocal()

    try:

        users = (
            db.query(User)
            .order_by(
                User.created_at.desc()
            )
            .all()
        )

        result = []

        for user in users:

            result.append({

                "id":
                    user.id,

                "name":
                    user.name,

                "email":
                    user.email,

                "role":
                    user.role,

                "created_at":
                    user.created_at

            })

        return {

            "success": True,

            "users":
                result

        }

    finally:

        db.close()


# ============================================================
# ADMIN PREDICTIONS
# ============================================================

@app.get("/admin/predictions")
def admin_predictions(

    current_admin: User = Depends(
        get_current_admin
    )

):

    db = SessionLocal()

    try:

        predictions = (
            db.query(Prediction)
            .order_by(
                Prediction.created_at.desc()
            )
            .limit(50)
            .all()
        )

        result = []

        for prediction in predictions:

            user = (
                db.query(User)
                .filter(
                    User.id ==
                    prediction.user_id
                )
                .first()
            )

            result.append({

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

                "user_id":
                    prediction.user_id,

                "user_name":
                    user.name
                    if user
                    else "Unknown",

                "user_email":
                    user.email
                    if user
                    else "Unknown",

                "created_at":
                    prediction.created_at

            })

        return {

            "success": True,

            "count":
                len(result),

            "predictions":
                result

        }

    finally:

        db.close()