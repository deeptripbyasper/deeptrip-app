import urllib.request
import json
import time

BASE = "http://127.0.0.1:8000"

def test_full_flow():
    print(">>> 1. Validating Planner HTML elements...")
    req = urllib.request.Request(f"{BASE}/planner")
    with urllib.request.urlopen(req, timeout=5) as resp:
        html = resp.read().decode("utf-8")
        assert resp.status == 200, "Planner status not 200"
        assert "Deep<span>Trip</span>" in html or "DeepTrip" in html, "Brand title missing"
        assert "modal-close-btn" in html, "Modal close button missing"
        assert "btn-social-google" in html, "Google signup button missing"
        assert "btn-social-fb" in html, "Facebook signup button missing"
        assert "social-auth-divider" in html, "Social auth divider missing"
        assert "closeOnBackdrop" in html, "Backdrop dismiss handler missing"
        print("  [OK] Modal close button (X), Google/Facebook social signup options & handlers verified!")

    print("\n>>> 2. Testing Social Auth (Google)...")
    google_payload = {
        "provider": "google",
        "name": "Aarav Mehta (Google)",
        "email": "aarav.mehta.google@gmail.com",
        "phone": "+91 98200 45678"
    }
    req = urllib.request.Request(f"{BASE}/api/user/social-auth", method="POST", data=json.dumps(google_payload).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=5) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        assert res["success"] is True, "Google social auth failed"
        print(f"  [OK] Google Sign-In Successful: {res['user']['name']} ({res['user']['email']})")

    print("\n>>> 3. Testing Social Auth (Facebook)...")
    fb_payload = {
        "provider": "facebook",
        "name": "Pooja Iyer (Facebook)",
        "email": "pooja.iyer.fb@example.com",
        "phone": "+91 98333 78901"
    }
    req = urllib.request.Request(f"{BASE}/api/user/social-auth", method="POST", data=json.dumps(fb_payload).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=5) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        assert res["success"] is True, "Facebook social auth failed"
        print(f"  [OK] Facebook Sign-In Successful: {res['user']['name']} ({res['user']['email']})")

    print("\n>>> ALL CHECKS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    test_full_flow()
