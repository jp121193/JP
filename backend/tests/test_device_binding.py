"""
Backend tests for DEVICE BINDING with ADMIN EXEMPTION auth model.

Covers:
- Login/Register requires device_id (min 6 chars) -> 422 when missing
- Admin can log in from unlimited devices; both tokens work on /auth/me
- Non-admin login binds a device; login from a different device -> 403
- Admin reset-device unbinds; user can then log in from any device
- After reset, old device token becomes invalid (401 with "device is no longer registered")
- Admin token has no device binding requirement
- GET /api/admin/users returns device_bound boolean (bound_device_id not leaked)
- POST /api/admin/users/{admin_id}/reset-device -> 400 (self on admin)
"""

import os
import random
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://jp-logistics.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_MOBILE = "9999999999"
ADMIN_PASSWORD = "admin@JP2026"


def _rand_mobile():
    return "666660" + "".join(random.choice("0123456789") for _ in range(4))


def _admin_login(device_id="admin-device-aaaaaa"):
    r = requests.post(
        f"{API}/auth/login",
        json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD, "device_id": device_id},
        timeout=15,
    )
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"], r.json()["user"]


@pytest.fixture(scope="module")
def admin_token():
    token, _ = _admin_login()
    return token


@pytest.fixture()
def created_user(admin_token):
    """Create + approve a fresh non-admin user; auto-delete after test."""
    mobile = _rand_mobile()
    device_a = "dev-A-" + str(int(time.time()))
    r = requests.post(
        f"{API}/auth/register",
        json={"mobile": mobile, "name": "TEST_DeviceUser", "password": "pass1234", "device_id": device_a},
        timeout=15,
    )
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    uid = r.json()["user"]["id"]

    # Approve so /auth/me works for regular endpoints if needed
    ar = requests.post(
        f"{API}/admin/users/{uid}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=15,
    )
    assert ar.status_code == 200

    yield {"id": uid, "mobile": mobile, "device_a": device_a, "password": "pass1234"}

    # Cleanup
    requests.delete(
        f"{API}/admin/users/{uid}",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=15,
    )


# ---------- Validation ----------

class TestLoginRegisterRequireDeviceId:
    def test_login_without_device_id_returns_422(self):
        r = requests.post(
            f"{API}/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD},
            timeout=15,
        )
        assert r.status_code == 422, r.text

    def test_login_with_short_device_id_returns_422(self):
        r = requests.post(
            f"{API}/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD, "device_id": "abc"},
            timeout=15,
        )
        assert r.status_code == 422, r.text

    def test_register_without_device_id_returns_422(self):
        r = requests.post(
            f"{API}/auth/register",
            json={"mobile": _rand_mobile(), "name": "TEST_NoDevice", "password": "pass1234"},
            timeout=15,
        )
        assert r.status_code == 422, r.text


# ---------- Admin multi-device ----------

class TestAdminMultiDevice:
    def test_two_admin_logins_both_work(self):
        t1, _ = _admin_login("admin-dev-111111")
        time.sleep(1.1)  # ensure iat differs so tokens are distinct strings
        t2, _ = _admin_login("admin-dev-222222")
        assert t1 != t2, "Expected two distinct admin tokens"

        r1 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {t1}"}, timeout=15)
        r2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {t2}"}, timeout=15)
        assert r1.status_code == 200, r1.text
        assert r2.status_code == 200, r2.text
        assert r1.json().get("role") == "admin"
        assert r2.json().get("role") == "admin"

    def test_admin_token_survives_after_reset_device_calls(self, admin_token, created_user):
        # Reset user's device using admin token, admin token must still work after
        rr = requests.post(
            f"{API}/admin/users/{created_user['id']}/reset-device",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15,
        )
        assert rr.status_code == 200
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
        assert me.status_code == 200
        assert me.json().get("role") == "admin"


# ---------- Non-admin device binding ----------

class TestNonAdminDeviceBinding:
    def test_login_same_device_ok_diff_device_403(self, created_user):
        # Same device (dev-A) - already bound at register
        r_ok = requests.post(
            f"{API}/auth/login",
            json={
                "mobile": created_user["mobile"],
                "password": created_user["password"],
                "device_id": created_user["device_a"],
            },
            timeout=15,
        )
        assert r_ok.status_code == 200, r_ok.text
        assert "token" in r_ok.json()

        # Different device -> 403
        r_bad = requests.post(
            f"{API}/auth/login",
            json={
                "mobile": created_user["mobile"],
                "password": created_user["password"],
                "device_id": "dev-B-should-be-rejected",
            },
            timeout=15,
        )
        assert r_bad.status_code == 403, r_bad.text
        assert "already active on another device" in r_bad.json().get("detail", "")

    def test_reset_then_login_from_new_device(self, admin_token, created_user):
        # admin resets user
        rr = requests.post(
            f"{API}/admin/users/{created_user['id']}/reset-device",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15,
        )
        assert rr.status_code == 200

        # login from dev-B ok now
        r_b = requests.post(
            f"{API}/auth/login",
            json={
                "mobile": created_user["mobile"],
                "password": created_user["password"],
                "device_id": "dev-B-newbind-1",
            },
            timeout=15,
        )
        assert r_b.status_code == 200, r_b.text

        # Now dev-A should be rejected (dev-B bound)
        r_a = requests.post(
            f"{API}/auth/login",
            json={
                "mobile": created_user["mobile"],
                "password": created_user["password"],
                "device_id": created_user["device_a"],
            },
            timeout=15,
        )
        assert r_a.status_code == 403, r_a.text
        assert "already active on another device" in r_a.json().get("detail", "")


# ---------- Token invalidation after reset ----------

class TestTokenInvalidationAfterReset:
    def test_old_token_401_after_reset(self, admin_token, created_user):
        # Login as user on dev-A to get a token
        r = requests.post(
            f"{API}/auth/login",
            json={
                "mobile": created_user["mobile"],
                "password": created_user["password"],
                "device_id": created_user["device_a"],
            },
            timeout=15,
        )
        assert r.status_code == 200
        user_token = r.json()["token"]

        # Token works
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {user_token}"}, timeout=15)
        assert me.status_code == 200

        # Admin resets device
        rr = requests.post(
            f"{API}/admin/users/{created_user['id']}/reset-device",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15,
        )
        assert rr.status_code == 200

        # Old token now invalid
        me2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {user_token}"}, timeout=15)
        assert me2.status_code == 401, me2.text
        detail = me2.json().get("detail", "")
        assert "device is no longer registered" in detail.lower(), f"unexpected detail: {detail}"


# ---------- Admin listing ----------

class TestAdminUserListing:
    def test_device_bound_boolean_no_leak(self, admin_token, created_user):
        r = requests.get(
            f"{API}/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15,
        )
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list)
        for u in users:
            assert "device_bound" in u, f"missing device_bound in {u}"
            assert isinstance(u["device_bound"], bool)
            assert "bound_device_id" not in u, "bound_device_id leaked"
            assert "password_hash" not in u

        # created_user should have device_bound True (just registered w/ device)
        me = next((u for u in users if u["id"] == created_user["id"]), None)
        assert me is not None
        assert me["device_bound"] is True


# ---------- Admin self reset ----------

class TestAdminSelfResetForbidden:
    def test_admin_self_reset_400(self, admin_token):
        # find admin id
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
        assert r.status_code == 200
        admin_id = r.json()["id"]

        rr = requests.post(
            f"{API}/admin/users/{admin_id}/reset-device",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15,
        )
        assert rr.status_code == 400, rr.text
        assert "does not have device binding" in rr.json().get("detail", "").lower()


# ---------- Admin login token has no 'did' requirement ----------

class TestAdminTokenNoDeviceRequirement:
    def test_admin_token_works_across_arbitrary_device_events(self):
        # Login admin with device X
        tok, _ = _admin_login("admin-dev-XYZXYZ")
        # Any subsequent 'reset' on any user does not affect admin token
        # Just check that /auth/me returns 200 and role admin
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("role") == "admin"
