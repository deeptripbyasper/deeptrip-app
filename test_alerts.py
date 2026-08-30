import urllib.request
import json
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("🚀 Starting DeepTrip Alerts & Booking Validation Tests...")

    # Test 1: Health check
    req = urllib.request.Request(f"{BASE_URL}/api/cars")
    with urllib.request.urlopen(req) as resp:
        cars_data = json.loads(resp.read().decode())
        assert cars_data["success"], "Failed to load cars"
        print(f"✅ Cars loaded: {len(cars_data['data'])} vehicles")

    # Test 2: Create a callback request with Hotel and Food package
    payload = {
        "id": "DT-TEST-9999",
        "user_name": "Kavita Sharma",
        "user_phone": "+91 98765 12345",
        "user_email": "kavita.sharma@example.com",
        "preferred_callback_time": "Immediate (Within 15 Mins)",
        "whatsapp_optin": True,
        "source": "Delhi (NCR)",
        "destination": "Jaipur Heritage Circuit",
        "days": 4,
        "passengers": 5,
        "car_name": "Toyota Innova Crysta",
        "car_category": "6-Seater MUV",
        "stay_name": "Heritage Haveli Palace & Spa",
        "stay_type": "5-Star Luxury Heritage",
        "meal_name": "Pure Vegetarian & Satvik Culinary Package",
        "meal_dietary": "Pure Veg Satvik",
        "total_price": 38500,
        "status": "Callback Requested",
        "payment_status": "Pending Callback"
    }

    req = urllib.request.Request(
        f"{BASE_URL}/api/bookings",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        assert res["success"], "Booking creation failed"
        assert "alerts" in res, "Alerts bundle missing from response"
        wa_text = res["alerts"]["whatsapp_text"]
        print("✅ Booking created with automated WhatsApp & Email alert bundle!")
        print("\n--- [GENERATED WHATSAPP ALERT PREVIEW] ---")
        print(wa_text)
        print("-------------------------------------------\n")
        assert "Heritage Haveli Palace & Spa" in wa_text, "Stay name missing in WhatsApp alert"
        assert "Pure Vegetarian & Satvik" in wa_text, "Meal name missing in WhatsApp alert"
        assert "Toyota Innova Crysta" in wa_text, "Car name missing in WhatsApp alert"
        assert "Kavita Sharma" in wa_text, "User name missing in WhatsApp alert"

    # Test 3: Check /api/alerts
    req = urllib.request.Request(f"{BASE_URL}/api/alerts")
    with urllib.request.urlopen(req) as resp:
        alerts_data = json.loads(resp.read().decode())
        assert alerts_data["success"], "Failed to load alerts"
        assert len(alerts_data["data"]) > 0, "No alerts found in log"
        print(f"✅ Alert log verified: {len(alerts_data['data'])} alerts recorded")

    # Test 4: Dispatch alert via /api/alerts/send
    req = urllib.request.Request(
        f"{BASE_URL}/api/alerts/send",
        data=json.dumps({"booking_id": "DT-TEST-9999", "channel": "all"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        alert_send_res = json.loads(resp.read().decode())
        assert alert_send_res["success"], "Alert dispatch failed"
        print(f"✅ Multi-channel alert dispatch verified for #{alert_send_res['booking_id']}")

    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        sys.exit(1)
