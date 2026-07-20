"""Backend tests for iteration 6:
- Removal of `phone` field on ceramics/yards (models, API responses, CSV import)
- Single-device login enforcement (JWT sid must match user's active_session_id)
- Logout invalidates the session
- Register duplicate mobile => 400
- Registration + Login single-device flow
"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # fallback to frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip()
                    break
    except FileNotFoundError:
        pass
BASE_URL = (BASE_URL or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not configured"

ADMIN_MOBILE = "9999999999"
ADMIN_PASSWORD = "admin@JP2026"


def _login(mobile: str, password: str) -> str:
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"mobile": mobile, "password": password})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_token():
    return _login(ADMIN_MOBILE, ADMIN_PASSWORD)


# ---------- Phone-field removal ----------
class TestNoPhoneField:
    def test_ceramics_list_has_no_phone(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/ceramics", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        assert len(items) > 0, "expected seeded ceramics"
        for it in items:
            assert "phone" not in it, f"ceramic {it.get('id')} contains phone: {it}"
            assert set(it.keys()) <= {"id", "name", "category", "map_url"}

    def test_yards_list_has_no_phone(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/yards", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200, r.text
        items = r.json()
        assert len(items) > 0
        for it in items:
            assert "phone" not in it
            assert set(it.keys()) <= {"id", "name", "port", "map_url"}

    def test_create_ceramic_ignores_phone(self, admin_token):
        payload = {
            "name": f"TEST_NoPhoneCer_{uuid.uuid4().hex[:6]}",
            "category": "Wall Tiles",
            "map_url": "https://maps.google.com/?q=test",
            "phone": "1234567890",  # should be ignored (Pydantic extra=ignore by default)
        }
        r = requests.post(
            f"{BASE_URL}/api/admin/ceramics",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        # allow either 200 (silently ignored) or 422 (rejected)
        assert r.status_code in (200, 422), r.text
        cer_id = None
        if r.status_code == 200:
            data = r.json()
            assert "phone" not in data, f"phone leaked in create response: {data}"
            cer_id = data["id"]
            # Verify via list GET that phone not stored
            r2 = requests.get(
                f"{BASE_URL}/api/ceramics",
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            row = next((x for x in r2.json() if x["id"] == cer_id), None)
            assert row is not None
            assert "phone" not in row
        # Cleanup
        if cer_id:
            requests.delete(
                f"{BASE_URL}/api/admin/ceramics/{cer_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
            )

    def test_create_yard_ignores_phone(self, admin_token):
        payload = {
            "name": f"TEST_NoPhoneYard_{uuid.uuid4().hex[:6]}",
            "port": "Mundra",
            "map_url": "https://maps.google.com/?q=test",
            "phone": "9998887777",
        }
        r = requests.post(
            f"{BASE_URL}/api/admin/yards",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code in (200, 422), r.text
        yid = None
        if r.status_code == 200:
            data = r.json()
            assert "phone" not in data
            yid = data["id"]
        if yid:
            requests.delete(
                f"{BASE_URL}/api/admin/yards/{yid}",
                headers={"Authorization": f"Bearer {admin_token}"},
            )

    def test_import_ceramics_csv_with_phone_column(self, admin_token):
        marker = f"TEST_IMP_CER_{uuid.uuid4().hex[:6]}"
        csv_content = (
            "name,category,map_url,phone\n"
            f"{marker},Wall Tiles,https://maps.google.com/?q=abc,1234567890\n"
        )
        files = {"file": ("test.csv", csv_content, "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/admin/ceramics/import",
            files=files,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200, r.text
        assert r.json().get("inserted") == 1, r.text
        # Verify no phone in listing
        r2 = requests.get(
            f"{BASE_URL}/api/ceramics",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        row = next((x for x in r2.json() if x["name"] == marker), None)
        assert row is not None
        assert "phone" not in row
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/admin/ceramics/{row['id']}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )


# ---------- Single-device enforcement ----------
class TestSingleDevice:
    def test_admin_second_login_invalidates_first(self):
        t1 = _login(ADMIN_MOBILE, ADMIN_PASSWORD)
        # T1 works
        r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {t1}"})
        assert r.status_code == 200, r.text
        # Second login with the same admin
        t2 = _login(ADMIN_MOBILE, ADMIN_PASSWORD)
        assert t2 != t1
        # T1 now returns 401 with 'Signed in on another device'
        r1 = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {t1}"})
        assert r1.status_code == 401, f"expected 401 got {r1.status_code} {r1.text}"
        assert "another device" in r1.json().get("detail", "").lower()
        # T2 still valid
        r2 = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {t2}"})
        assert r2.status_code == 200

    def test_logout_invalidates_token(self):
        tok = _login(ADMIN_MOBILE, ADMIN_PASSWORD)
        r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        rl = requests.post(f"{BASE_URL}/api/auth/logout", headers={"Authorization": f"Bearer {tok}"})
        assert rl.status_code == 200
        rme = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {tok}"})
        assert rme.status_code == 401


# ---------- Register + single-device flow ----------
class TestRegisterFlow:
    def test_register_duplicate_and_single_device(self):
        mobile = f"7{uuid.uuid4().int % 10**9:09d}"  # 10 digits starting with 7
        password = "test1234"
        # Register
        r = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"mobile": mobile, "name": "TEST_User", "password": password},
        )
        assert r.status_code == 200, r.text
        t1 = r.json()["token"]
        user_id = r.json()["user"]["id"]
        # /me works with T1
        r_me = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {t1}"})
        assert r_me.status_code == 200

        # Duplicate register with same mobile => 400
        r_dup = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"mobile": mobile, "name": "Another", "password": password},
        )
        assert r_dup.status_code == 400, r_dup.text

        # Login with same mobile => T2, T1 must fail
        t2 = _login(mobile, password)
        assert t2 != t1
        r_me1 = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {t1}"})
        assert r_me1.status_code == 401
        assert "another device" in r_me1.json().get("detail", "").lower()
        r_me2 = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {t2}"})
        assert r_me2.status_code == 200

        # Cleanup: delete this test user (admin required)
        admin_tok = _login(ADMIN_MOBILE, ADMIN_PASSWORD)
        requests.delete(
            f"{BASE_URL}/api/admin/users/{user_id}",
            headers={"Authorization": f"Bearer {admin_tok}"},
        )
