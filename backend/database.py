from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# MySQL Database
DATABASE_URL = "mysql+pymysql://root:@localhost/retina_ai"


# Database Engine
engine = create_engine(
    DATABASE_URL,
    echo=False
)


# Database Session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# Base class for database models
Base = declarative_base()
