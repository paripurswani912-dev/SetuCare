from fastapi import Header, HTTPException

ROLES = {"ASHA", "DOCTOR", "FACILITY_ADMIN", "DISTRICT_MANAGER", "ADMIN"}


def require_role(*allowed: str):
    """Simple role-based access. Frontend sends X-Role and X-User headers.
    ADMIN is always allowed. Missing header defaults to ADMIN so Swagger keeps working."""
    allowed_set = {r.upper() for r in allowed} | {"ADMIN"}

    def checker(x_role: str = Header(default="ADMIN"),
                x_user: str = Header(default="demo-user")):
        role = x_role.upper()
        if role not in ROLES:
            raise HTTPException(status_code=401, detail="Unknown role")
        if role not in allowed_set:
            raise HTTPException(status_code=403,
                                detail=f"Role {role} is not allowed to perform this action")
        return {"role": role, "user": x_user}

    return checker
