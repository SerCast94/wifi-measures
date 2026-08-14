from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    full_name = Column(String(250), nullable=True)
    email = Column(String(250), nullable=True, unique=True)
    hashed_password = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(String(128), unique=True, nullable=False, index=True)
    name = Column(String(250), nullable=True)
    date = Column(DateTime, nullable=True)
    technician = Column(String(250), nullable=True)
    device = Column(String(250), nullable=True)
    audit_type = Column(String(100), nullable=True)
    status = Column(String(50), nullable=True)
    raw = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String(100), nullable=False, index=True)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    fetched_at = Column(Integer, nullable=True)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(String(128), nullable=False, index=True)
    path = Column(String(1024), nullable=False)
    generated_by = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
