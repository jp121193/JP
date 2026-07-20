"""Backend tests for the two new features (Phase 2):
1. CSV bulk import for ceramics and yards (admin only)
2. Phone field on ceramics/yards (model + backfill migration)
"""
import io
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://jp-logistics.preview.emergentagent.com').rstrip('/')
ADMIN_MOBILE = "9999999999"
ADMIN_PASSWORD = "admin@JP2026"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD
    })
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def unapproved_user_token():
    """Register a fresh user (status=pending). Login and return token."""
    mobile = f"7{uuid.uuid4().int % 1_000_000_000:09d}"[:10]
    reg_payload = {"mobile": mobile, "name": "TEST_pending", "password": "pass1234"}
    r = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
    # Even if register returns 500 due to a serialization bug (older iteration),
    # we can fall back to login.
    if r.status_code == 200:
        return r.json()["token"]
    # Try login
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"mobile": mobile, "password": "pass1234"})
    if r.status_code == 200:
        return r.json()["token"]
    pytest.skip(f"Could not create test user: register={r.status_code}")


# ---------- CSV import: ceramics ----------
class TestCeramicsImport:
    def test_import_valid_csv_inserts_rows(self, admin_headers):
        unique = uuid.uuid4().hex[:8]
        csv_content = (
            "name,category,phone,map_url\n"
            f"TEST_CSV_{unique}_A,Vitrified Tiles,+919800000001,https://maps.google.com/?q=1\n"
            f"TEST_CSV_{unique}_B,Wall Tiles,+919800000002,https://maps.google.com/?q=2\n"
        )
        files = {"file": ("ceramics.csv", csv_content.encode("utf-8"), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/ceramics/import", headers=admin_headers, files=files)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["inserted"] == 2
        assert data["errors"] == []

        # verify persistence via GET /api/ceramics
        g = requests.get(f"{BASE_URL}/api/ceramics", headers=admin_headers)
        assert g.status_code == 200
        names = {c["name"] for c in g.json()}
        assert f"TEST_CSV_{unique}_A" in names
        assert f"TEST_CSV_{unique}_B" in names
        # phone persisted
        row_a = next(c for c in g.json() if c["name"] == f"TEST_CSV_{unique}_A")
        assert row_a.get("phone") == "+919800000001"

    def test_import_partial_success_missing_fields(self, admin_headers):
        unique = uuid.uuid4().hex[:8]
        csv_content = (
            "name,category,phone,map_url\n"
            f"TEST_CSV_{unique}_OK,Wall Tiles,+919800000003,https://maps.google.com/?q=3\n"
            ",Wall Tiles,+919800000004,https://maps.google.com/?q=4\n"
            f"TEST_CSV_{unique}_NOMAP,Wall Tiles,+919800000005,\n"
        )
        files = {"file": ("ceramics.csv", csv_content.encode("utf-8"), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/ceramics/import", headers=admin_headers, files=files)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["inserted"] == 1
        assert len(data["errors"]) == 2
        # errors mention row numbers (should be Row 3 and Row 4 since header is line 1)
        assert any("Row 3" in e for e in data["errors"])
        assert any("Row 4" in e for e in data["errors"])

    def test_import_rejects_non_csv_filename(self, admin_headers):
        files = {"file": ("something.txt", b"name,category,phone,map_url\n", "text/plain")}
        r = requests.post(f"{BASE_URL}/api/admin/ceramics/import", headers=admin_headers, files=files)
        assert r.status_code == 400
        assert ".csv" in r.text.lower()

    def test_import_requires_admin_unauth(self):
        files = {"file": ("x.csv", b"name,category,phone,map_url\n", "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/ceramics/import", files=files)
        assert r.status_code in (401, 403)

    def test_import_rejects_non_admin_user(self, unapproved_user_token):
        headers = {"Authorization": f"Bearer {unapproved_user_token}"}
        files = {"file": ("x.csv", b"name,category,phone,map_url\n", "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/ceramics/import", headers=headers, files=files)
        assert r.status_code in (401, 403)


# ---------- CSV import: yards ----------
class TestYardsImport:
    def test_import_valid_yards(self, admin_headers):
        unique = uuid.uuid4().hex[:8]
        csv_content = (
            "name,port,phone,map_url\n"
            f"TEST_CSV_YARD_{unique}_M,Mundra,+912836000001,https://maps.google.com/?q=y1\n"
            f"TEST_CSV_YARD_{unique}_K,Kandla,+912836000002,https://maps.google.com/?q=y2\n"
        )
        files = {"file": ("yards.csv", csv_content.encode("utf-8"), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/yards/import", headers=admin_headers, files=files)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["inserted"] == 2
        assert data["errors"] == []

        g = requests.get(f"{BASE_URL}/api/yards", headers=admin_headers)
        assert g.status_code == 200
        yards = g.json()
        row_m = next(y for y in yards if y["name"] == f"TEST_CSV_YARD_{unique}_M")
        assert row_m["port"] == "Mundra"
        assert row_m["phone"] == "+912836000001"

    def test_import_yards_case_insensitive_port(self, admin_headers):
        unique = uuid.uuid4().hex[:8]
        csv_content = (
            "name,port,phone,map_url\n"
            f"TEST_CSV_YARD_{unique}_LOW,mundra,+912836000003,https://maps.google.com/?q=y3\n"
        )
        files = {"file": ("yards.csv", csv_content.encode("utf-8"), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/yards/import", headers=admin_headers, files=files)
        assert r.status_code == 200
        data = r.json()
        assert data["inserted"] == 1

    def test_import_yards_invalid_port_skipped(self, admin_headers):
        unique = uuid.uuid4().hex[:8]
        csv_content = (
            "name,port,phone,map_url\n"
            f"TEST_CSV_YARD_{unique}_OK,Mundra,+912836000004,https://maps.google.com/?q=y4\n"
            f"TEST_CSV_YARD_{unique}_BAD,Chennai,+912836000005,https://maps.google.com/?q=y5\n"
        )
        files = {"file": ("yards.csv", csv_content.encode("utf-8"), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/yards/import", headers=admin_headers, files=files)
        assert r.status_code == 200
        data = r.json()
        assert data["inserted"] == 1
        assert len(data["errors"]) == 1
        assert "Row 3" in data["errors"][0]

    def test_import_yards_rejects_non_csv(self, admin_headers):
        files = {"file": ("x.xlsx", b"name,port,phone,map_url\n", "application/octet-stream")}
        r = requests.post(f"{BASE_URL}/api/admin/yards/import", headers=admin_headers, files=files)
        assert r.status_code == 400

    def test_import_yards_requires_admin(self):
        files = {"file": ("x.csv", b"name,port,phone,map_url\n", "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/yards/import", files=files)
        assert r.status_code in (401, 403)


# ---------- Phone backfill + CRUD ----------
class TestPhoneField:
    def test_seed_ceramics_have_phone(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/ceramics", headers=admin_headers)
        assert r.status_code == 200
        seed_names = {
            "Morvi Vitrified Tiles Co.",
            "Sunrise Ceramics Pvt Ltd",
            "Royal Sanitaryware",
            "Diamond Floor Tiles",
            "Regal Ceramic Industries",
        }
        seeded = [c for c in r.json() if c["name"] in seed_names]
        assert len(seeded) == 5, f"Expected 5 seed ceramics, found {len(seeded)}"
        for c in seeded:
            assert c.get("phone"), f"Ceramic {c['name']} missing phone"

    def test_seed_yards_have_phone(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/yards", headers=admin_headers)
        assert r.status_code == 200
        seed_names = {
            "Adani Empty Yard - Mundra",
            "Gateway Distriparks - Mundra",
            "Concor CFS - Mundra",
            "Kandla Port ICD Yard",
            "Balaji Empty Container Depot",
            "Kandla CFS Terminal",
        }
        seeded = [y for y in r.json() if y["name"] in seed_names]
        assert len(seeded) == 6
        for y in seeded:
            assert y.get("phone"), f"Yard {y['name']} missing phone"

    def test_create_ceramic_with_phone(self, admin_headers):
        unique = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_CRUD_{unique}",
            "category": "Wall Tiles",
            "phone": "+919812345678",
            "map_url": "https://maps.google.com/?q=crud1",
        }
        r = requests.post(f"{BASE_URL}/api/admin/ceramics", headers=admin_headers, json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["phone"] == "+919812345678"
        # verify persisted
        g = requests.get(f"{BASE_URL}/api/ceramics", headers=admin_headers)
        row = next(c for c in g.json() if c["id"] == created["id"])
        assert row["phone"] == "+919812345678"

    def test_update_yard_phone(self, admin_headers):
        unique = uuid.uuid4().hex[:8]
        # first create a yard
        payload = {
            "name": f"TEST_YARD_PHONE_{unique}",
            "port": "Mundra",
            "phone": "+912836999999",
            "map_url": "https://maps.google.com/?q=yp1",
        }
        c = requests.post(f"{BASE_URL}/api/admin/yards", headers=admin_headers, json=payload)
        assert c.status_code == 200
        yid = c.json()["id"]
        # update phone
        new_payload = {**payload, "phone": "+912836888888"}
        u = requests.put(f"{BASE_URL}/api/admin/yards/{yid}", headers=admin_headers, json=new_payload)
        assert u.status_code == 200
        assert u.json()["phone"] == "+912836888888"
        # verify persisted
        g = requests.get(f"{BASE_URL}/api/yards", headers=admin_headers)
        row = next(y for y in g.json() if y["id"] == yid)
        assert row["phone"] == "+912836888888"


# ---------- Cleanup ----------
@pytest.fixture(scope="session", autouse=True)
def cleanup_after_all():
    yield
    # Best-effort cleanup of TEST_-prefixed data
    try:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD
        })
        if r.status_code != 200:
            return
        h = {"Authorization": f"Bearer {r.json()['token']}"}
        for path in ("/api/ceramics", "/api/yards"):
            data = requests.get(f"{BASE_URL}{path}", headers=h).json()
            for item in data:
                if item.get("name", "").startswith("TEST_"):
                    admin_path = path.replace("/api/", "/api/admin/")
                    requests.delete(f"{BASE_URL}{admin_path}/{item['id']}", headers=h)
        # Delete test users
        users = requests.get(f"{BASE_URL}/api/admin/users", headers=h).json()
        for u in users:
            if u.get("name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/admin/users/{u['id']}", headers=h)
    except Exception:
        pass
