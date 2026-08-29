import urllib.request
import json

BASE = "http://127.0.0.1:8000"

def test_endpoint(name, path, method="GET", payload=None):
    url = f"{BASE}{path}"
    try:
        req = urllib.request.Request(url, method=method)
        if payload is not None:
            req.add_header("Content-Type", "application/json")
            data = json.dumps(payload).encode("utf-8")
        else:
            data = None
            
        with urllib.request.urlopen(req, data=data, timeout=5) as resp:
            body = resp.read().decode("utf-8")
            if "json" in resp.headers.get("Content-Type", ""):
                parsed = json.loads(body)
                print(f"[PASS] {method} {path} -> {resp.status} (Items: {len(parsed.get('data', [])) if isinstance(parsed.get('data'), list) else 'OK'})")
                return parsed
            else:
                print(f"[PASS] {method} {path} -> {resp.status} (HTML Page Loaded: {len(body)} chars)")
                return body
    except Exception as e:
        print(f"[FAIL] {method} {path} -> Error: {e}")
        return None

def run_tests():
    print("=== DEEPTRIP BACKEND VERIFICATION ===")
    test_endpoint("Get Cars", "/api/cars")
    test_endpoint("Get Stays", "/api/stays")
    test_endpoint("Get Meals", "/api/meals")
    test_endpoint("Get Trips", "/api/trips")
    test_endpoint("Get Bookings", "/api/bookings")
    test_endpoint("Get Analytics", "/api/analytics")

    print("\n=== TESTING INVENTORY MUTATIONS ===")
    new_car = {
        "name": "Mercedes-Benz GLS Maybach Edition",
        "category": "Luxury 7-Seater Flagship",
        "capacity": 7,
        "base_fare_per_day": 9500,
        "rate_per_km": 42,
        "captain": "Devendra Rathore (5.0 ★)",
        "amenities": ["Champagne Flutes", "Massage Captain Seats", "Senior Step"],
        "is_active": True
    }
    car_res = test_endpoint("Create Car", "/api/cars", method="POST", payload=new_car)
    if car_res and car_res.get("data"):
        car_id = car_res["data"]["id"]
        test_endpoint("Update Car", f"/api/cars/{car_id}", method="PUT", payload={"base_fare_per_day": 9800})
        test_endpoint("Delete Car", f"/api/cars/{car_id}", method="DELETE")

    print("\n=== TESTING STATIC PAGES ===")
    test_endpoint("Mobile View", "/mobile")
    test_endpoint("Admin View", "/admin")
    print("=== ALL TESTS COMPLETED ===")

if __name__ == "__main__":
    run_tests()
