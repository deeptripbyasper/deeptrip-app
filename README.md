# DeepTrip - India's Ultimate Road Trip Partner 🚗

> **Journey Stewardship Platform by Asperand**  
> Native App for Android & iOS with Dynamic Admin Control Panel

---

## 🌟 Overview & Features

DeepTrip is an end-to-end road mobility service solving comfort, hygiene, and accessibility for families, senior citizens, and pet owners.

### Key Functionalities:
1. **Custom Road Trip Booking Wizard**:
   - Source & Destination selection across iconic routes (e.g. Rajasthan Circuit, Manali Hills, Goa Konkan Drive, Coorg Plantations).
   - Date picker, duration selector, senior citizen and pet traveler accommodation.
2. **Dynamic Fleet Selection (Cars)**:
   - **4-Seater Sedans**: Honda City Elegance / Dzire Prime (₹2,400/day + ₹14/km).
   - **7-Seater Premium SUVs/MUVs**: Toyota Innova Crysta / Hycross (₹3,800/day + ₹19/km).
   - **7-Seater Adventure SUVs**: Mahindra Scorpio-N / XUV700 (₹3,400/day + ₹17/km).
   - **Luxury Flagships**: BMW 5 Series / Mercedes-Benz E-Class / Fortuner Legender (₹6,200 - ₹7,500/day).
   - Background-verified Chauffeur-Guides (Captains), luggage capacity, Android backseat screens, and pet/senior setup.
3. **Accommodation Selection (Stays)**:
   - Budget Homestays with home-cooked meals and pet lawns.
   - Verified 3/4-Star Hotels with elevators and spas.
   - 5-Star Premium Luxury Resorts & Heritage Villas.
4. **Curated Culinary Packages (Meals)**:
   - 100% Pure Vegetarian & Satvik Package.
   - Royal Non-Veg & Regional Gourmet Package.
   - Flexible Mix & Artisanal Highway Snack Boxes.
5. **Real-time Admin Control Panel**:
   - Manage Cars, Stays, and Meals with instant real-time synchronization to mobile users.
   - Bookings Dispatcher: Track live journeys, change status (*Pending*, *Confirmed*, *On Road*, *Completed*, *Cancelled*), and view traveler care notes.
   - Financial Analytics & Fleet Utilization KPIs.
6. **Native Android & iOS Simulator**:
   - One-click toggle between iPhone 16 Pro (iOS) and Google Pixel 9 (Material 3) frames.
   - Digital Boarding Passes with live captain status and 24/7 SOS helpline.

---

## 🚀 How to Run Locally

1. Open your terminal in `d:\Data\deeptrip_app`:
   ```bash
   python server.py
   ```
2. Open your browser:
   - **Mobile App (Android / iOS)**: [http://localhost:8000/mobile](http://localhost:8000/mobile)
   - **Admin Control Panel**: [http://localhost:8000/admin](http://localhost:8000/admin)
   - **REST API Endpoints**: [http://localhost:8000/api](http://localhost:8000/api)

---

## 📱 Building Native Android & iOS Apps

DeepTrip is pre-configured with Capacitor for native binary packaging:

### Android (.apk / .aab)
```bash
# Add Android platform
npx cap add android

# Copy web assets and sync
npx cap copy android
npx cap sync android

# Open in Android Studio
npx cap open android
```
*Build -> Build Bundle(s) / APK(s) -> Build APK.*

### iOS (.ipa / Xcode)
```bash
# Add iOS platform (on macOS)
npx cap add ios
npx cap sync ios
npx cap open ios
```
*Archive and export in Xcode.*

---

## 🛠️ REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cars` | Retrieve all fleet vehicles |
| `POST` | `/api/cars` | Add a new car to the fleet |
| `PUT` | `/api/cars/:id` | Update car details or toggle active status |
| `DELETE` | `/api/cars/:id` | Delete car from fleet |
| `GET` | `/api/stays` | Retrieve all verified accommodations |
| `POST` | `/api/stays` | Add a new homestay / hotel |
| `GET` | `/api/meals` | Retrieve all culinary meal packages |
| `POST` | `/api/meals` | Add a new meal package |
| `GET` | `/api/bookings` | List all road trip bookings |
| `POST` | `/api/bookings` | Book a road trip |
| `PUT` | `/api/bookings/:id` | Update booking status & dispatcher |
| `GET` | `/api/analytics` | Retrieve revenue and KPI metrics |
| `POST` | `/api/reset-seed` | Restore default demo seed data |
