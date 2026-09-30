import re
from typing import Optional

from pydantic import BaseModel, field_validator


class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    abha_id: Optional[str] = None

    # ---- data-quality checks ----
    @field_validator("name")
    @classmethod
    def name_ok(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name is too short")
        return v

    @field_validator("age")
    @classmethod
    def age_ok(cls, v):
        if not 0 <= v <= 120:
            raise ValueError("Age must be between 0 and 120")
        return v

    @field_validator("gender")
    @classmethod
    def gender_ok(cls, v):
        v = v.strip().upper()
        if v not in {"MALE", "FEMALE", "OTHER"}:
            raise ValueError("Gender must be Male, Female or Other")
        return v.capitalize()

    @field_validator("phone")
    @classmethod
    def phone_ok(cls, v):
        if v is None or v == "":
            return None
        digits = re.sub(r"\D", "", v)[-10:]
        if not re.fullmatch(r"[6-9]\d{9}", digits):
            raise ValueError("Phone must be a valid 10-digit Indian mobile number")
        return digits

    @field_validator("abha_id")
    @classmethod
    def abha_ok(cls, v):
        if v is None or v == "":
            return None
        digits = re.sub(r"\D", "", v)
        if len(digits) != 14:
            raise ValueError("ABHA ID must be 14 digits")
        return f"{digits[:2]}-{digits[2:6]}-{digits[6:10]}-{digits[10:]}"
