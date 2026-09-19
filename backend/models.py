from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime
)

from sqlalchemy.sql import func

from database import Base


class Prediction(Base):

    __tablename__ = "predictions"

    id = Column(
        Integer,
        primary_key=True,
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