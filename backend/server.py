from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt as pyjwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, field_validator

# ---------- Config ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
JWT_EXPIRY_HOURS = 24 * 7  # 7 days

app = FastAPI(title="JP Directory API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ---------- Utils ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def normalize_mobile(mobile: str) -> str:
    m = "".join(ch for ch in (mobile or "") if ch.isdigit())
    return m

# ---------- Models ----------
class RegisterIn(BaseModel):
    mobile: str
    name: str
    password: str

    @field_validator("mobile")
    @classmethod
    def _mobile(cls, v):
        v = normalize_mobile(v)
        if len(v) < 7 or len(v) > 15:
            raise ValueError("Mobile number must be 7-15 digits")
        return v

    @field_validator("password")
    @classmethod
    def _pw(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("name")
    @classmethod
    def _name(cls, v):
        v = (v or "").strip()
        if len(v) < 2:
            raise ValueError("Name is required")
        return v


class LoginIn(BaseModel):
    mobile: str
    password: str


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    mobile: str
    name: str
    role: str
    status: str
    created_at: str


class CeramicIn(BaseModel):
    name: str
    category: str
    map_url: str


class CeramicOut(CeramicIn):
    id: str


class YardIn(BaseModel):
    name: str
    port: Literal["Mundra", "Kandla"]
    map_url: str


class YardOut(YardIn):
    id: str


# ---------- Auth deps ----------
async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_approved(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") == "admin":
        return user
    if user.get("status") != "approved":
        raise HTTPException(status_code=403, detail="Your account is pending admin approval")
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------- Auth routes ----------
@api_router.post("/auth/register")
async def register(payload: RegisterIn):
    existing = await db.users.find_one({"mobile": payload.mobile})
    if existing:
        raise HTTPException(status_code=400, detail="A user with this mobile number already exists")
    user_doc = {
        "id": str(uuid.uuid4()),
        "mobile": payload.mobile,
        "name": payload.name,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_doc["id"], user_doc["role"])
    return {
        "token": token,
        "user": {k: v for k, v in user_doc.items() if k != "password_hash"},
    }


@api_router.post("/auth/login")
async def login(payload: LoginIn):
    mobile = normalize_mobile(payload.mobile)
    user = await db.users.find_one({"mobile": mobile})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid mobile number or password")
    token = create_token(user["id"], user["role"])
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"token": token, "user": user}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------- Directory routes ----------
@api_router.get("/ceramics", response_model=List[CeramicOut])
async def list_ceramics(_: dict = Depends(require_approved)):
    items = await db.ceramics.find({}, {"_id": 0}).to_list(1000)
    return items


@api_router.get("/yards", response_model=List[YardOut])
async def list_yards(_: dict = Depends(require_approved)):
    items = await db.yards.find({}, {"_id": 0}).to_list(1000)
    return items


# ---------- Admin routes ----------
@api_router.get("/admin/users")
async def admin_list_users(_: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    users.sort(key=lambda u: u.get("created_at", ""), reverse=True)
    return users


@api_router.post("/admin/users/{user_id}/approve")
async def admin_approve(user_id: str, _: dict = Depends(require_admin)):
    res = await db.users.update_one({"id": user_id}, {"$set": {"status": "approved"}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


@api_router.post("/admin/users/{user_id}/revoke")
async def admin_revoke(user_id: str, _: dict = Depends(require_admin)):
    res = await db.users.update_one({"id": user_id}, {"$set": {"status": "pending"}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")
    res = await db.users.delete_one({"id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


# Ceramics CRUD (admin)
@api_router.post("/admin/ceramics", response_model=CeramicOut)
async def admin_create_ceramic(payload: CeramicIn, _: dict = Depends(require_admin)):
    doc = {"id": str(uuid.uuid4()), **payload.model_dump()}
    await db.ceramics.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/ceramics/{item_id}", response_model=CeramicOut)
async def admin_update_ceramic(item_id: str, payload: CeramicIn, _: dict = Depends(require_admin)):
    res = await db.ceramics.update_one({"id": item_id}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ceramic not found")
    doc = await db.ceramics.find_one({"id": item_id}, {"_id": 0})
    return doc


@api_router.delete("/admin/ceramics/{item_id}")
async def admin_delete_ceramic(item_id: str, _: dict = Depends(require_admin)):
    res = await db.ceramics.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ceramic not found")
    return {"ok": True}


# Yards CRUD (admin)
@api_router.post("/admin/yards", response_model=YardOut)
async def admin_create_yard(payload: YardIn, _: dict = Depends(require_admin)):
    doc = {"id": str(uuid.uuid4()), **payload.model_dump()}
    await db.yards.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/yards/{item_id}", response_model=YardOut)
async def admin_update_yard(item_id: str, payload: YardIn, _: dict = Depends(require_admin)):
    res = await db.yards.update_one({"id": item_id}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Yard not found")
    doc = await db.yards.find_one({"id": item_id}, {"_id": 0})
    return doc


@api_router.delete("/admin/yards/{item_id}")
async def admin_delete_yard(item_id: str, _: dict = Depends(require_admin)):
    res = await db.yards.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Yard not found")
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"service": "JP Directory API", "status": "ok"}


# ---------- Seeding ----------
SEED_CERAMICS = [
    {"name": "Morvi Vitrified Tiles Co.", "category": "Vitrified Tiles", "map_url": "https://www.google.com/maps/place/Morbi,+Gujarat/@22.8173,70.8378,13z"},
    {"name": "Sunrise Ceramics Pvt Ltd", "category": "Wall Tiles", "map_url": "https://www.google.com/maps/place/Morbi,+Gujarat/@22.8250,70.8300,14z"},
    {"name": "Royal Sanitaryware", "category": "Sanitaryware", "map_url": "https://www.google.com/maps/place/Morbi,+Gujarat/@22.8100,70.8500,14z"},
    {"name": "Diamond Floor Tiles", "category": "Floor Tiles", "map_url": "https://www.google.com/maps/place/Morbi,+Gujarat/@22.8200,70.8400,13z"},
    {"name": "Regal Ceramic Industries", "category": "Polished Tiles", "map_url": "https://www.google.com/maps/place/Morbi,+Gujarat/@22.8150,70.8450,14z"},
]

SEED_YARDS = [
    {"name": "Adani Empty Yard - Mundra", "port": "Mundra", "map_url": "https://www.google.com/maps/place/Mundra+Port/@22.7440,69.7100,13z"},
    {"name": "Gateway Distriparks - Mundra", "port": "Mundra", "map_url": "https://www.google.com/maps/place/Mundra+Port/@22.7500,69.7200,13z"},
    {"name": "Concor CFS - Mundra", "port": "Mundra", "map_url": "https://www.google.com/maps/place/Mundra+Port/@22.7400,69.7300,13z"},
    {"name": "Kandla Port ICD Yard", "port": "Kandla", "map_url": "https://www.google.com/maps/place/Kandla+Port/@23.0230,70.2200,13z"},
    {"name": "Balaji Empty Container Depot", "port": "Kandla", "map_url": "https://www.google.com/maps/place/Kandla+Port/@23.0300,70.2100,13z"},
    {"name": "Kandla CFS Terminal", "port": "Kandla", "map_url": "https://www.google.com/maps/place/Kandla+Port/@23.0180,70.2250,13z"},
]


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("mobile", unique=True)
    await db.ceramics.create_index("name")
    await db.yards.create_index("name")

    # Seed admin
    admin_mobile = normalize_mobile(os.environ["ADMIN_MOBILE"])
    admin_pw = os.environ["ADMIN_PASSWORD"]
    admin_name = os.environ.get("ADMIN_NAME", "Admin")
    existing_admin = await db.users.find_one({"mobile": admin_mobile})
    if not existing_admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "mobile": admin_mobile,
            "name": admin_name,
            "password_hash": hash_password(admin_pw),
            "role": "admin",
            "status": "approved",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        # ensure admin role/status and password kept in sync with env
        updates = {"role": "admin", "status": "approved"}
        if not verify_password(admin_pw, existing_admin.get("password_hash", "")):
            updates["password_hash"] = hash_password(admin_pw)
        await db.users.update_one({"mobile": admin_mobile}, {"$set": updates})

    # Seed ceramics if empty
    if await db.ceramics.count_documents({}) == 0:
        docs = [{"id": str(uuid.uuid4()), **c} for c in SEED_CERAMICS]
        await db.ceramics.insert_many(docs)

    # Seed yards if empty
    if await db.yards.count_documents({}) == 0:
        docs = [{"id": str(uuid.uuid4()), **y} for y in SEED_YARDS]
        await db.yards.insert_many(docs)


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jp")
