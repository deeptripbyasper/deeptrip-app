#!/usr/bin/env python3
"""
DeepTrip Backend Server & REST API
India's Ultimate Road Trip Partner / Journey Stewardship Platform
Supports Mobile App (Android/iOS) and Admin Control Panel
"""

import json
import os
import sys
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import uuid
import datetime

PORT = int(os.environ.get("PORT", 8000))
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "deeptrip2026")
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
DATA_FILE = os.path.join(DATA_DIR, "deeptrip_db.json")

# Initial Seed Data
DEFAULT_DATA = {
    "cars": [
        {
            "id": "car-1",
            "name": "Honda City Elegance / Dzire Prime",
            "category": "4-Seater Sedan",
            "capacity": 4,
            "luggage": "3 Bags",
            "base_fare_per_day": 2400,
            "rate_per_km": 14,
            "transmission": "Automatic / Manual",
            "fuel_type": "Petrol / Hybrid",
            "image": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
            "description": "Perfect for small families and couples. Equipped with soft blankets, chilled water, and high-speed Wi-Fi.",
            "amenities": ["Chauffeur-Guide", "Backseat Pillows", "High-Speed Wi-Fi", "Pet Safety Harness Compatible", "First-Aid Kit"],
            "pet_friendly": True,
            "senior_accessible": True,
            "is_active": True,
            "captain": "Rajesh Sharma (4.9 ★, 8+ yrs exp)"
        },
        {
            "id": "car-2",
            "name": "Toyota Innova Crysta / Hycross",
            "category": "7-Seater Premium SUV/MUV",
            "capacity": 7,
            "luggage": "6 Bags",
            "base_fare_per_day": 3800,
            "rate_per_km": 19,
            "transmission": "Automatic",
            "fuel_type": "Diesel / Hybrid",
            "image": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
            "description": "The gold standard for road trips in India. Ultra-comfortable captain seats, rear AC, senior accessibility side steps, and spacious boot space.",
            "amenities": ["Captain Chauffeur-Guide", "Android Backseat Screens + Headphones", "Senior Accessibility Step", "Dedicated Pet Space", "Chilled Mini-Fridge", "Fast-Charging Docks"],
            "pet_friendly": True,
            "senior_accessible": True,
            "is_active": True,
            "captain": "Vikramaditya Singh (5.0 ★, 12+ yrs exp)"
        },
        {
            "id": "car-3",
            "name": "Mahindra Scorpio-N / XUV700",
            "category": "7-Seater Adventure SUV",
            "capacity": 7,
            "luggage": "5 Bags",
            "base_fare_per_day": 3400,
            "rate_per_km": 17,
            "transmission": "Automatic 4x4",
            "fuel_type": "Diesel",
            "image": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
            "description": "Rugged yet plush SUV designed for scenic mountain terrains, hill climbs, and coastal highways with panoramic sunroof.",
            "amenities": ["Expert Mountain Driver", "Panoramic Sunroof", "Pet Seat Covers", "Emergency Oxygen Kit", "Roof Carrier (on demand)"],
            "pet_friendly": True,
            "senior_accessible": True,
            "is_active": True,
            "captain": "Manpreet Singh (4.9 ★, 9+ yrs exp)"
        },
        {
            "id": "car-4",
            "name": "BMW 5 Series / Mercedes-Benz E-Class",
            "category": "Luxury Chauffeur Sedan",
            "capacity": 4,
            "luggage": "3 Bags",
            "base_fare_per_day": 7500,
            "rate_per_km": 35,
            "transmission": "Automatic Luxury",
            "fuel_type": "Petrol / Diesel",
            "image": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
            "description": "First-class road luxury. Reclining massage leather seats, ambient mood lighting, premium Harman Kardon acoustics, and white-glove chauffeur service.",
            "amenities": ["White-Glove Butler Chauffeur", "Reclining Leather Seats", "Burmester Sound System", "Premium Refreshment Hamper", "Tablet Concierge"],
            "pet_friendly": False,
            "senior_accessible": True,
            "is_active": True,
            "captain": "Arjun Malhotra (5.0 ★, 14+ yrs exp)"
        },
        {
            "id": "car-5",
            "name": "Toyota Fortuner Legender 4x4",
            "category": "Luxury 7-Seater Flagship",
            "capacity": 7,
            "luggage": "6 Bags",
            "base_fare_per_day": 6200,
            "rate_per_km": 28,
            "transmission": "Automatic 4WD",
            "fuel_type": "Diesel",
            "image": "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
            "description": "Dominating luxury SUV with unmatched road presence, supreme safety, senior hydraulic ease-step, and full pet containment suite.",
            "amenities": ["Executive Chauffeur", "Hydraulic Easy Step for Seniors", "Pet Carrier Enclosure", "Mini Espresso Machine", "Noise-Cancelling Headphones"],
            "pet_friendly": True,
            "senior_accessible": True,
            "is_active": True,
            "captain": "Dharmendra Rawat (4.9 ★, 11+ yrs exp)"
        }
    ],
    "stays": [
        {
            "id": "stay-1",
            "name": "Heritage Orchard Homestay & Farmhouse",
            "type": "Budget Homestay",
            "location": "Jaipur / Shimla / Coorg Outskirts",
            "price_per_night": 2200,
            "rating": 4.8,
            "reviews_count": 142,
            "image": "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80",
            "description": "Warm, home-cooked organic hospitality with lush gardens, ground-floor accessibility for seniors, and open lawns for pets to run freely.",
            "amenities": ["Ground Floor Rooms (No Stairs)", "Pet Friendly Lawns", "Home-Cooked Fresh Meals", "Doctor-on-Call", "Bonfire Pit"],
            "pet_friendly": True,
            "senior_accessible": True,
            "is_active": True
        },
        {
            "id": "stay-2",
            "name": "Valley View Boutique Hotel & Spa",
            "type": "Standard 3/4-Star Hotel",
            "location": "Manali / Udaipur / Goa / Munnar",
            "price_per_night": 3800,
            "rating": 4.7,
            "reviews_count": 298,
            "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            "description": "Charming boutique hotel with panoramic balcony views, elevator access, 24-hr room dining, and curated local cultural evenings.",
            "amenities": ["Elevator / Lift Access", "Heated Pool & Spa", "24/7 Room Service", "Wheelchair Friendly", "Secure Dedicated Parking"],
            "pet_friendly": True,
            "senior_accessible": True,
            "is_active": True
        },
        {
            "id": "stay-3",
            "name": "The Royal Palace & Luxury Heritage Resort",
            "type": "Premium Luxury 5-Star Resort / Villa",
            "location": "Udaipur / Mussoorie / Goa Beachfront / Kabini",
            "price_per_night": 8500,
            "rating": 4.95,
            "reviews_count": 480,
            "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
            "description": "Unrivaled luxury living with private plunge pools, butler service, ayurvedic wellness spas, and curated royal dining experiences.",
            "amenities": ["Private Butler Service", "Infinity Pool & Wellness Spa", "Fine Dining Restaurants", "Pet Concierge & Pet Grooming", "Golf Cart Transit inside Property"],
            "pet_friendly": True,
            "senior_accessible": True,
            "is_active": True
        },
        {
            "id": "stay-4",
            "name": "Riverside Wooden Pine Chalet",
            "type": "Budget Homestay / Eco Lodge",
            "location": "Jibhi / Kasol / Rishikesh / Wayanad",
            "price_per_night": 2600,
            "rating": 4.85,
            "reviews_count": 89,
            "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
            "description": "Tranquil riverside retreat surrounded by whispering pines. Clean spring water, campfire stories, and calming nature trails.",
            "amenities": ["Riverside Sitout", "Pet Safe Fenced Compound", "Organic Herbal Teas", "Warm Electric Blankets", "Board Games"],
            "pet_friendly": True,
            "senior_accessible": False,
            "is_active": True
        }
    ],
    "meals": [
        {
            "id": "meal-1",
            "name": "Pure Vegetarian & Satvik Culinary Package",
            "type": "Veg",
            "dietary": "100% Vegetarian / Jain Options Available",
            "price_per_person_per_day": 850,
            "image": "https://images.unsplash.com/photo-1613292443284-c774643c7b65?auto=format&fit=crop&w=800&q=80",
            "description": "Wholesome, low-spice, hygienic homestyle thalis curated for road comfort. Includes traditional highway breakfast, lunch thali, evening tea & snack, and dinner.",
            "inclusions": [
                "Breakfast: Fresh Poha/Idli/Parathas with Masala Chai/Filter Coffee",
                "Highway Lunch: Traditional Grand Veg Thali at pre-screened hygienic partner restaurants",
                "Sunset High Tea: Artisan Cookies & Roadside Kulhad Chai",
                "Dinner: Light & soothing Dal Tadka, Seasonal Sabzi, Phulkas, Basmati Rice & Sweet"
            ],
            "is_active": True
        },
        {
            "id": "meal-2",
            "name": "Royal Feast & Non-Veg Gourmet Package",
            "type": "Non-Veg",
            "dietary": "Non-Vegetarian & Multi-Cuisine",
            "price_per_person_per_day": 1250,
            "image": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
            "description": "Authentic regional culinary delights along the journey. Succulent tandoori, curries, highway dhabas, local seafood/chicken specialties, and desserts.",
            "inclusions": [
                "Breakfast: Masala Omelettes/Keema Parathas or South Indian Delights",
                "Highway Lunch: Regional Signature Non-Veg Curry / Biryani with Salads & Raita",
                "Evening Refreshment: Highway Kebabs or Pakoras with beverages",
                "Dinner: Mughlai / Coastal Non-Veg specialties with Breads, Rice & Dessert"
            ],
            "is_active": True
        },
        {
            "id": "meal-3",
            "name": "Flexible Combo & Regional Tasting Plan",
            "type": "Mix (Veg + Non-Veg Choice)",
            "dietary": "Customizable per traveler",
            "price_per_person_per_day": 1050,
            "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
            "description": "The best of both worlds. Choose vegetarian for light road transit lunches and treat yourself to gourmet non-veg or local delicacies at dinner.",
            "inclusions": [
                "Nutritious morning energy breakfast & fresh juices",
                "Light digestive lunch for smooth scenic drives",
                "Chilled in-car refreshments (tender coconut, sparkling water, fruit baskets)",
                "Full customized dinner buffet at resort or premium restaurant"
            ],
            "is_active": True
        },
        {
            "id": "meal-4",
            "name": "Highway Snack Box & Refreshment Kit (Add-On)",
            "type": "Snack Kit",
            "dietary": "Veg / Vegan / Low Sugar Options",
            "price_per_person_per_day": 350,
            "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
            "description": "Continuous in-car artisanal snack hamper: roasted dry fruits, organic energy bars, digestive candies, mineral water, and diabetic-friendly snacks.",
            "inclusions": [
                "Almonds, Cashews & Roasted Makhana pouch",
                "Fresh seasonal whole fruits (Apples, Bananas, Oranges)",
                "Glucose and electrolyte drink packs",
                "Artisan cookies and herbal tea sachets"
            ],
            "is_active": True
        }
    ],
    "trips": [
        {
            "id": "trip-1",
            "title": "Royal Rajasthan & Desert Forts Odyssey",
            "route": "Delhi → Jaipur → Pushkar → Udaipur",
            "duration": "5 Days / 4 Nights",
            "distance_km": 1250,
            "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
            "highlights": ["Amer Fort Sunset Drive", "Pushkar Holy Lake Oasis", "Udaipur Lake Pichola Boat Cruise", "Chauffeur Heritage Storytelling"],
            "suggested_car": "car-2",
            "suggested_stay": "stay-3",
            "starting_price": 28500
        },
        {
            "id": "trip-2",
            "title": "Himalayan Serenity & Pine Valley Circuit",
            "route": "Chandigarh → Shimla → Kullu → Manali",
            "duration": "6 Days / 5 Nights",
            "distance_km": 980,
            "image": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
            "highlights": ["Atal Tunnel Snow Excursion", "Solang Valley Cable Car", "Old Manali Wooden Cafes", "Senior-Safe Gentle Mountain Paths"],
            "suggested_car": "car-3",
            "suggested_stay": "stay-2",
            "starting_price": 32000
        },
        {
            "id": "trip-3",
            "title": "Konkan Coastal Highway & Goa Sunsets",
            "route": "Mumbai / Pune → Alibaug → Ganpatipule → Goa",
            "duration": "4 Days / 3 Nights",
            "distance_km": 720,
            "image": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
            "highlights": ["Scenic Coastal Sea Link Bridges", "Secluded Pet-Friendly White Sand Beaches", "Fresh Catch & Konkani Cuisine", "Fort Aguada Sunset View"],
            "suggested_car": "car-2",
            "suggested_stay": "stay-2",
            "starting_price": 24000
        },
        {
            "id": "trip-4",
            "title": "Western Ghats & Coffee Plantation Trail",
            "route": "Bengaluru → Mysore → Coorg → Wayanad",
            "duration": "4 Days / 3 Nights",
            "distance_km": 680,
            "image": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
            "highlights": ["Mysore Palace Illumination", "Coorg Private Coffee Estate Walks", "Abbey Waterfalls", "Pet-Friendly Open Plantation Lawns"],
            "suggested_car": "car-1",
            "suggested_stay": "stay-1",
            "starting_price": 19500
        }
    ],
    "bookings": [
        {
            "id": "DT-8942",
            "created_at": "2026-08-26 14:30",
            "user_name": "Col. Sanjeev Mehra",
            "user_phone": "+91 98110 54321",
            "user_email": "sanjeev.mehra@gmail.com",
            "source": "Delhi NCR",
            "destination": "Jaipur & Udaipur Heritage Circuit",
            "start_date": "2026-09-05",
            "end_date": "2026-09-09",
            "days": 5,
            "passengers": 3,
            "senior_citizens_count": 2,
            "pets_count": 1,
            "car_id": "car-2",
            "car_name": "Toyota Innova Crysta / Hycross",
            "stay_id": "stay-3",
            "stay_name": "The Royal Palace & Luxury Heritage Resort",
            "meal_id": "meal-1",
            "meal_name": "Pure Vegetarian & Satvik Culinary Package",
            "total_price": 54200,
            "status": "Confirmed",
            "payment_status": "Paid",
            "captain_assigned": "Vikramaditya Singh",
            "special_notes": "Wheelchair ramp needed for grandmother at stops. Golden retriever traveling along."
        },
        {
            "id": "DT-8943",
            "created_at": "2026-08-27 10:15",
            "user_name": "Pooja & Rohan Varma",
            "user_phone": "+91 98200 99881",
            "user_email": "rohan.varma@techcorp.in",
            "source": "Mumbai",
            "destination": "Goa Coastal Highway Odyssey",
            "start_date": "2026-09-12",
            "end_date": "2026-09-15",
            "days": 4,
            "passengers": 2,
            "senior_citizens_count": 0,
            "pets_count": 0,
            "car_id": "car-4",
            "car_name": "BMW 5 Series / Mercedes-Benz E-Class",
            "stay_id": "stay-2",
            "stay_name": "Valley View Boutique Hotel & Spa",
            "meal_id": "meal-2",
            "meal_name": "Royal Feast & Non-Veg Gourmet Package",
            "total_price": 45200,
            "status": "On Road",
            "payment_status": "Paid",
            "captain_assigned": "Arjun Malhotra",
            "special_notes": "Anniversary trip. Sunset champagne roadside setup requested."
        },
        {
            "id": "DT-8944",
            "created_at": "2026-08-27 16:45",
            "user_name": "Dr. Sunita Kulkarni",
            "user_phone": "+91 94220 12345",
            "user_email": "sunita.kulkarni@apollo.org",
            "source": "Bengaluru",
            "destination": "Coorg & Wayanad Plantation Trail",
            "start_date": "2026-09-18",
            "end_date": "2026-09-21",
            "days": 4,
            "passengers": 4,
            "senior_citizens_count": 2,
            "pets_count": 1,
            "car_id": "car-1",
            "car_name": "Honda City Elegance / Dzire Prime",
            "stay_id": "stay-1",
            "stay_name": "Heritage Orchard Homestay & Farmhouse",
            "meal_id": "meal-3",
            "meal_name": "Flexible Combo & Regional Tasting Plan",
            "total_price": 28400,
            "status": "Pending",
            "payment_status": "Deposit Paid",
            "captain_assigned": "Rajesh Sharma",
            "special_notes": "Low sodium meals requested for elderly parents."
        }
    ]
}


def load_db():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        save_db(DEFAULT_DATA)
        return DEFAULT_DATA
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading DB, reverting to default: {e}")
        return DEFAULT_DATA


def save_db(data):
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


class DeepTripHTTPHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _send_json(self, status_code, payload):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        db = load_db()

        # REST API Routes
        if path == "/api/cars":
            return self._send_json(200, {"success": True, "data": db.get("cars", [])})

        elif path == "/api/stays":
            return self._send_json(200, {"success": True, "data": db.get("stays", [])})

        elif path == "/api/meals":
            return self._send_json(200, {"success": True, "data": db.get("meals", [])})

        elif path == "/api/trips":
            return self._send_json(200, {"success": True, "data": db.get("trips", [])})

        elif path == "/api/bookings":
            return self._send_json(200, {"success": True, "data": db.get("bookings", [])})

        elif path == "/api/analytics":
            bookings = db.get("bookings", [])
            cars = db.get("cars", [])
            stays = db.get("stays", [])
            meals = db.get("meals", [])
            
            total_revenue = sum(b.get("total_price", 0) for b in bookings if b.get("status") != "Cancelled")
            total_bookings = len(bookings)
            active_trips = sum(1 for b in bookings if b.get("status") in ["On Road", "Confirmed"])
            senior_trips = sum(1 for b in bookings if b.get("senior_citizens_count", 0) > 0)
            pet_trips = sum(1 for b in bookings if b.get("pets_count", 0) > 0)

            # Category breakdowns
            car_cat_counts = {}
            for b in bookings:
                c_name = b.get("car_name", "Unknown")
                car_cat_counts[c_name] = car_cat_counts.get(c_name, 0) + 1

            meal_counts = {}
            for b in bookings:
                m_name = b.get("meal_name", "None")
                meal_counts[m_name] = meal_counts.get(m_name, 0) + 1

            analytics = {
                "total_revenue": total_revenue,
                "total_bookings": total_bookings,
                "active_trips": active_trips,
                "senior_trips_count": senior_trips,
                "pet_trips_count": pet_trips,
                "fleet_size": len(cars),
                "active_fleet": sum(1 for c in cars if c.get("is_active", True)),
                "stays_count": len(stays),
                "meals_count": len(meals),
                "car_distribution": car_cat_counts,
                "meal_distribution": meal_counts,
                "monthly_trend": [
                    {"month": "May", "revenue": 142000, "trips": 6},
                    {"month": "Jun", "revenue": 210000, "trips": 9},
                    {"month": "Jul", "revenue": 285000, "trips": 12},
                    {"month": "Aug", "revenue": 390000, "trips": 18}
                ]
            }
            return self._send_json(200, {"success": True, "data": analytics})

        # Static File Serving
        return self._serve_static_file(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        db = load_db()

        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            return self._send_json(400, {"success": False, "error": "Invalid JSON format"})

        if path == "/api/admin/login":
            username = payload.get("username", "").strip()
            password = payload.get("password", "").strip()
            if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
                token = f"dt_sec_{uuid.uuid4().hex}"
                return self._send_json(200, {
                    "success": True,
                    "token": token,
                    "username": username,
                    "message": "Admin authenticated successfully"
                })
            return self._send_json(401, {
                "success": False,
                "error": "Invalid admin username or password"
            })

        if path == "/api/cars":
            item = payload
            item["id"] = item.get("id") or f"car-{uuid.uuid4().hex[:6]}"
            if "is_active" not in item:
                item["is_active"] = True
            db.setdefault("cars", []).append(item)
            save_db(db)
            return self._send_json(201, {"success": True, "data": item, "message": "Car added successfully"})

        elif path == "/api/stays":
            item = payload
            item["id"] = item.get("id") or f"stay-{uuid.uuid4().hex[:6]}"
            if "is_active" not in item:
                item["is_active"] = True
            db.setdefault("stays", []).append(item)
            save_db(db)
            return self._send_json(201, {"success": True, "data": item, "message": "Stay added successfully"})

        elif path == "/api/meals":
            item = payload
            item["id"] = item.get("id") or f"meal-{uuid.uuid4().hex[:6]}"
            if "is_active" not in item:
                item["is_active"] = True
            db.setdefault("meals", []).append(item)
            save_db(db)
            return self._send_json(201, {"success": True, "data": item, "message": "Meal package added successfully"})

        elif path == "/api/trips":
            item = payload
            item["id"] = item.get("id") or f"trip-{uuid.uuid4().hex[:6]}"
            db.setdefault("trips", []).append(item)
            save_db(db)
            return self._send_json(201, {"success": True, "data": item, "message": "Trip package added successfully"})

        elif path == "/api/bookings":
            booking = payload
            booking["id"] = booking.get("id") or f"DT-{uuid.uuid4().hex[:4].upper()}"
            booking["created_at"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            if "status" not in booking:
                booking["status"] = "Confirmed"
            if "payment_status" not in booking:
                booking["payment_status"] = "Paid"
            db.setdefault("bookings", []).insert(0, booking)
            save_db(db)
            return self._send_json(201, {"success": True, "data": booking, "message": "Road trip booked successfully!"})

        elif path == "/api/reset-seed":
            save_db(DEFAULT_DATA)
            return self._send_json(200, {"success": True, "message": "Database reset to rich seed data"})

        return self._send_json(404, {"success": False, "error": "Endpoint not found"})

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        db = load_db()

        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            return self._send_json(400, {"success": False, "error": "Invalid JSON format"})

        parts = path.strip("/").split("/")
        if len(parts) >= 3 and parts[0] == "api":
            collection = parts[1]  # cars, stays, meals, trips, bookings
            item_id = parts[2]

            if collection in db:
                found = False
                for i, item in enumerate(db[collection]):
                    if item.get("id") == item_id:
                        db[collection][i].update(payload)
                        save_db(db)
                        return self._send_json(200, {"success": True, "data": db[collection][i], "message": f"{collection.capitalize()[:-1]} updated successfully"})
                return self._send_json(404, {"success": False, "error": f"Item {item_id} not found in {collection}"})

        return self._send_json(404, {"success": False, "error": "Endpoint not found"})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        db = load_db()

        parts = path.strip("/").split("/")
        if len(parts) >= 3 and parts[0] == "api":
            collection = parts[1]
            item_id = parts[2]

            if collection in db:
                original_len = len(db[collection])
                db[collection] = [item for item in db[collection] if item.get("id") != item_id]
                if len(db[collection]) < original_len:
                    save_db(db)
                    return self._send_json(200, {"success": True, "message": f"Item {item_id} deleted successfully from {collection}"})
                return self._send_json(404, {"success": False, "error": f"Item {item_id} not found"})

        return self._send_json(404, {"success": False, "error": "Endpoint not found"})

    def _serve_static_file(self, req_path):
        if req_path in ["", "/", "/user", "/user/", "/mobile", "/mobile/", "/planner", "/planner/"]:
            req_path = "/mobile/index.html"
        elif req_path in ["/admin", "/admin/"]:
            req_path = "/admin/index.html"
        elif req_path in ["/design-system", "/design-system/"]:
            req_path = "/design-system/index.html"

        # Sanitize path
        clean_path = os.path.normpath(req_path.lstrip("/"))
        file_path = os.path.join(PUBLIC_DIR, clean_path)

        if not os.path.isfile(file_path):
            # Fallback to index if subpath
            if req_path.startswith("/admin"):
                file_path = os.path.join(PUBLIC_DIR, "admin", "index.html")
            elif req_path.startswith("/planner"):
                file_path = os.path.join(PUBLIC_DIR, "planner", "index.html")
            elif req_path.startswith("/design-system"):
                file_path = os.path.join(PUBLIC_DIR, "design-system", "index.html")
            else:
                file_path = os.path.join(PUBLIC_DIR, "mobile", "index.html")

        if not os.path.isfile(file_path):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return

        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type is None:
            mime_type = "application/octet-stream"

        try:
            with open(file_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", f"{mime_type}; charset=utf-8" if "text" in mime_type or "javascript" in mime_type or "json" in mime_type else mime_type)
            self.send_header("Content-Length", str(len(content)))
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode("utf-8"))


def run():
    # Force UTF-8 output if possible
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    load_db()
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, DeepTripHTTPHandler)
    print("============================================================")
    print(" [DeepTrip] Server is live!")
    print(f" -> Mobile App (Android/iOS View): http://localhost:{PORT}/mobile")
    print(f" -> Admin Control Panel:         http://localhost:{PORT}/admin")
    print(f" -> REST API Base:               http://localhost:{PORT}/api")
    print("============================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping DeepTrip server...")
        httpd.server_close()


if __name__ == "__main__":
    run()
