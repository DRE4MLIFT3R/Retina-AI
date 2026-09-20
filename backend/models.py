from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey
)

from sqlalchemy.sql import func

from database import Base


# =========================
# Prediction Model
# =========================

class Prediction(Base):

    __tablename__ = "predictions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # User who made this prediction
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    filename = Column(
        String(255),
        nullable=False
    )

    class_id = Column(
        Integer,
        nullable=False
    )

    class_name = Column(
        String(100),
        nullable=False
    )

    confidence = Column(
        Float,
        nullable=False
    )

    gradcam_path = Column(
        String(500),
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )


# =========================
# User Model
# =========================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    password = Column(
        String(255),
        nullable=False
    )

    # User role: "user" or "admin"
    role = Column(
        String(20),
        nullable=False,
        default="user"
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )