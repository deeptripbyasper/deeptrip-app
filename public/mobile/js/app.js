/**
 * DeepTrip Mobile App Client Logic
 * India's Ultimate Road Trip Partner / Journey Stewardship Platform
 */

const API_BASE = window.location.origin + '/api';

// Global App State
const state = {
  cars: [],
  stays: [],
  meals: [],
  trips: [],
  bookings: [],
  currentStep: 1,
  
  // Active Customizer Selections
  wizard: {
    source: 'Delhi NCR',
    destination: 'Jaipur & Udaipur Heritage Circuit',
    days: 4,
    startDate: '2026-09-10',
    passengers: 3,
    seniors: 1,
    pets: 1,
    selectedCarId: null,
    selectedStayId: null,
    selectedMealId: null,
    filterCarCat: 'all',
    filterStayCat: 'all',
    custName: 'Aarav Singhania',
    custPhone: '+91 98101 23456',
    custEmail: 'aarav.singhania@gmail.com',
    custNotes: 'Elderly parents traveling. Request ground floor room and slow scenic driving pace.'
  }
};

// Initialization on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  updateLiveClock();
  setInterval(updateLiveClock, 30000);
  
  await fetchAllAppData();
  renderCuratedTrips();
  renderFleetPreview();
  renderWizardCars();
  renderWizardStays();
  renderWizardMeals();
  renderMyBookings();
  updateLiveEstimate();
});

// Update the native phone status bar clock
function updateLiveClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeEl = document.getElementById('statusTime');
  if (timeEl) timeEl.textContent = `${hours}:${minutes}`;
}

// Fetch all collections from REST API
async function fetchAllAppData() {
  try {
    const [carsRes, staysRes, mealsRes, tripsRes, bookingsRes] = await Promise.all([
      fetch(`${API_BASE}/cars`).then(r => r.json()),
      fetch(`${API_BASE}/stays`).then(r => r.json()),
      fetch(`${API_BASE}/meals`).then(r => r.json()),
      fetch(`${API_BASE}/trips`).then(r => r.json()),
      fetch(`${API_BASE}/bookings`).then(r => r.json())
    ]);

    state.cars = carsRes.data || [];
    state.stays = staysRes.data || [];
    state.meals = mealsRes.data || [];
    state.trips = tripsRes.data || [];
    state.bookings = bookingsRes.data || [];

    // Set default selections if not already chosen
    if (!state.wizard.selectedCarId && state.cars.length > 0) {
      state.wizard.selectedCarId = state.cars[1] ? state.cars[1].id : state.cars[0].id; // default 7-seater Innova
    }
    if (!state.wizard.selectedStayId && state.stays.length > 0) {
      state.wizard.selectedStayId = state.stays[0].id;
    }
    if (!state.wizard.selectedMealId && state.meals.length > 0) {
      state.wizard.selectedMealId = state.meals[0].id;
    }

    const badge = document.getElementById('bookingsCountBadge');
    if (badge) badge.textContent = state.bookings.length;

  } catch (err) {
    console.error('Error fetching DeepTrip data:', err);
    showToast('Offline or connecting to local server...');
  }
}

// Switch between Mobile Tabs
function switchTab(tabId) {
  const screens = document.querySelectorAll('.tab-screen');
  screens.forEach(s => s.classList.remove('active'));
  
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(n => n.classList.remove('active'));
  
  const targetNav = document.getElementById(`nav-${tabId}`);
  if (targetNav) targetNav.classList.add('active');

  // Scroll to top of app container
  const container = document.getElementById('appContainer');
  if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
}

// Switch Device Shell Mode (iPhone 16 Pro / Pixel 9 / Responsive)
function switchDeviceMode(mode) {
  document.body.className = '';
  document.body.classList.add(`theme-${mode}`);

  const btns = document.querySelectorAll('.device-btn');
  btns.forEach(b => b.classList.remove('active'));
  
  const activeBtn = document.getElementById(`btn-mode-${mode}`);
  if (activeBtn) activeBtn.classList.add('active');

  showToast(`Switched to ${mode.toUpperCase()} device preview`);
}

// Start custom trip from hero or quick action
function startCustomTrip(suggestedTrip = null) {
  if (suggestedTrip) {
    state.wizard.destination = suggestedTrip.route || suggestedTrip.title;
    state.wizard.selectedCarId = suggestedTrip.suggested_car || state.wizard.selectedCarId;
    state.wizard.selectedStayId = suggestedTrip.suggested_stay || state.wizard.selectedStayId;
  }
  switchTab('customizer');
  goToStep(1);
}

// Render Curated Scenic Trips on Explore Tab
function renderCuratedTrips() {
  const container = document.getElementById('curatedTripsContainer');
  if (!container) return;

  if (!state.trips || state.trips.length === 0) {
    container.innerHTML = `<p class="text-muted">No road trip packages available.</p>`;
    return;
  }

  container.innerHTML = state.trips.map(trip => `
    <div class="trip-card">
      <div class="trip-card-img-wrap">
        <img src="${trip.image}" alt="${trip.title}" class="trip-card-img" loading="lazy">
        <span class="trip-card-badge">${trip.duration}</span>
        <span class="trip-card-dist">📍 ${trip.distance_km} KM</span>
      </div>
      <div class="trip-card-body">
        <div class="trip-card-route">${trip.route}</div>
        <h4 class="trip-card-title">${trip.title}</h4>
        <div class="trip-card-highlights">
          ${trip.highlights.map(h => `<span class="highlight-pill">✓ ${h}</span>`).join('')}
        </div>
        <div class="trip-card-footer">
          <div class="trip-card-price">
            <span class="price-sub">Starting from</span>
            <span class="price-val">₹${trip.starting_price.toLocaleString()}</span>
          </div>
          <button class="btn-book-sm" onclick='startCustomTrip(${JSON.stringify(trip)})'>
            Customize Trip ›
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Render Fleet Preview on Explore Tab
function renderFleetPreview() {
  const container = document.getElementById('exploreFleetContainer');
  if (!container) return;

  const activeCars = state.cars.filter(c => c.is_active !== false).slice(0, 3);
  container.innerHTML = activeCars.map(car => `
    <div class="car-preview-card" onclick="selectCarAndGoToWizard('${car.id}')">
      <img src="${car.image}" alt="${car.name}" class="car-preview-img">
      <div class="car-preview-info">
        <span class="car-preview-cat">${car.category} • ${car.capacity} Seater</span>
        <h4 class="car-preview-name">${car.name}</h4>
        <p class="car-preview-meta">₹${car.base_fare_per_day}/day (₹${car.rate_per_km}/km) • ${car.captain}</p>
      </div>
    </div>
  `).join('');
}

function selectCarAndGoToWizard(carId) {
  state.wizard.selectedCarId = carId;
  switchTab('customizer');
  goToStep(2);
}

// Stepper Adjuster (Passengers, Seniors, Pets)
function adjustCount(type, delta) {
  if (type === 'passengers') {
    state.wizard.passengers = Math.max(1, Math.min(10, state.wizard.passengers + delta));
    document.getElementById('val-passengers').textContent = state.wizard.passengers;
  } else if (type === 'seniors') {
    state.wizard.seniors = Math.max(0, Math.min(state.wizard.passengers, state.wizard.seniors + delta));
    document.getElementById('val-seniors').textContent = state.wizard.seniors;
  } else if (type === 'pets') {
    state.wizard.pets = Math.max(0, Math.min(4, state.wizard.pets + delta));
    document.getElementById('val-pets').textContent = state.wizard.pets;
  }
  updateLiveEstimate();
}

// Wizard Step Navigation
function goToStep(stepNum) {
  state.currentStep = stepNum;

  for (let i = 1; i <= 5; i++) {
    const stepEl = document.getElementById(`step-${i}`);
    const dotEl = document.getElementById(`dot-${i}`);
    if (stepEl) {
      stepEl.style.display = (i === stepNum) ? 'block' : 'none';
    }
    if (dotEl) {
      dotEl.className = 'step-indicator';
      if (i === stepNum) dotEl.classList.add('active');
      else if (i < stepNum) dotEl.classList.add('done');
    }
  }

  // Update header step title
  const titles = [
    'Route & Travelers',
    'Choose Vehicle Fleet',
    'Choose Stays & Homestays',
    'Choose Meals & Packages',
    'Review & Dispatch Trip'
  ];
  const titleEl = document.getElementById('wizardStepTitle');
  if (titleEl) titleEl.textContent = titles[stepNum - 1] || 'Trip Builder';

  if (stepNum === 5) {
    updateSummaryScreen();
  }

  const container = document.getElementById('appContainer');
  if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Cars in Wizard Step 2
function renderWizardCars() {
  const container = document.getElementById('carsSelectionContainer');
  if (!container) return;

  const activeCars = state.cars.filter(c => c.is_active !== false);
  const filter = state.wizard.filterCarCat;

  const filtered = activeCars.filter(c => {
    if (filter === 'all') return true;
    if (filter === '4-seater') return c.capacity <= 4;
    if (filter === '7-seater') return c.capacity > 4 && !c.category.toLowerCase().includes('luxury');
    if (filter === 'luxury') return c.category.toLowerCase().includes('luxury');
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 20px;">No vehicles found in this category.</p>`;
    return;
  }

  container.innerHTML = filtered.map(car => {
    const isSelected = state.wizard.selectedCarId === car.id;
    return `
      <div class="select-card ${isSelected ? 'selected' : ''}" onclick="selectCar('${car.id}')">
        <div class="select-card-img-wrap">
          <img src="${car.image}" alt="${car.name}" class="select-card-img" loading="lazy">
          <span class="select-card-badge">${car.category} • ${car.capacity} Seats</span>
        </div>
        <div class="select-card-body">
          <div class="select-card-header">
            <h4 class="select-card-title">${car.name}</h4>
            <div class="select-card-price">
              ₹${car.base_fare_per_day}
              <span class="select-card-price-sub">/day + ₹${car.rate_per_km}/km</span>
            </div>
          </div>
          <p class="select-card-desc">${car.description}</p>
          <div class="select-card-tags">
            ${car.amenities.map(a => `<span class="card-tag">✓ ${a}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function selectCar(carId) {
  state.wizard.selectedCarId = carId;
  renderWizardCars();
  updateLiveEstimate();
  showToast('Vehicle selected! 🚘');
}

function filterCarCategory(cat) {
  state.wizard.filterCarCat = cat;
  const pills = document.querySelectorAll('#step-2 .pill-filter');
  pills.forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  renderWizardCars();
}

// Render Stays in Wizard Step 3
function renderWizardStays() {
  const container = document.getElementById('staysSelectionContainer');
  if (!container) return;

  const activeStays = state.stays.filter(s => s.is_active !== false);
  const filter = state.wizard.filterStayCat;

  const filtered = activeStays.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'homestay') return s.type.toLowerCase().includes('homestay') || s.type.toLowerCase().includes('budget');
    if (filter === 'hotel') return s.type.toLowerCase().includes('hotel') || s.type.toLowerCase().includes('standard');
    if (filter === 'luxury') return s.type.toLowerCase().includes('luxury') || s.type.toLowerCase().includes('resort') || s.type.toLowerCase().includes('5-star');
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 20px;">No stays found in this category.</p>`;
    return;
  }

  container.innerHTML = filtered.map(stay => {
    const isSelected = state.wizard.selectedStayId === stay.id;
    return `
      <div class="select-card ${isSelected ? 'selected' : ''}" onclick="selectStay('${stay.id}')">
        <div class="select-card-img-wrap">
          <img src="${stay.image}" alt="${stay.name}" class="select-card-img" loading="lazy">
          <span class="select-card-badge">${stay.type} • ⭐ ${stay.rating}</span>
        </div>
        <div class="select-card-body">
          <div class="select-card-header">
            <h4 class="select-card-title">${stay.name}</h4>
            <div class="select-card-price">
              ₹${stay.price_per_night}
              <span class="select-card-price-sub">/night</span>
            </div>
          </div>
          <p class="select-card-desc">${stay.description}</p>
          <div class="select-card-tags">
            ${stay.amenities.map(a => `<span class="card-tag">✓ ${a}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function selectStay(stayId) {
  state.wizard.selectedStayId = stayId;
  renderWizardStays();
  updateLiveEstimate();
  showToast('Stay selected! 🏡');
}

function filterStayCategory(cat) {
  state.wizard.filterStayCat = cat;
  const pills = document.querySelectorAll('#step-3 .pill-filter');
  pills.forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  renderWizardStays();
}

// Render Meals in Wizard Step 4
function renderWizardMeals() {
  const container = document.getElementById('mealsSelectionContainer');
  if (!container) return;

  const activeMeals = state.meals.filter(m => m.is_active !== false);

  container.innerHTML = activeMeals.map(meal => {
    const isSelected = state.wizard.selectedMealId === meal.id;
    return `
      <div class="select-card ${isSelected ? 'selected' : ''}" onclick="selectMeal('${meal.id}')">
        <div class="select-card-img-wrap">
          <img src="${meal.image}" alt="${meal.name}" class="select-card-img" loading="lazy">
          <span class="select-card-badge">${meal.type} Package</span>
        </div>
        <div class="select-card-body">
          <div class="select-card-header">
            <h4 class="select-card-title">${meal.name}</h4>
            <div class="select-card-price">
              ₹${meal.price_per_person_per_day}
              <span class="select-card-price-sub">/person/day</span>
            </div>
          </div>
          <p class="select-card-desc">${meal.description}</p>
          <div class="select-card-tags">
            ${meal.inclusions.map(inc => `<span class="card-tag">🍲 ${inc}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function selectMeal(mealId) {
  state.wizard.selectedMealId = mealId;
  renderWizardMeals();
  updateLiveEstimate();
  showToast('Meal plan chosen! 🍲');
}

// Update Live Estimate Values
function updateLiveEstimate() {
  const sourceEl = document.getElementById('input-source');
  const destEl = document.getElementById('input-destination');
  const daysEl = document.getElementById('input-days');
  const dateEl = document.getElementById('input-date');

  if (sourceEl) state.wizard.source = sourceEl.value;
  if (destEl) state.wizard.destination = destEl.value;
  if (daysEl) state.wizard.days = parseInt(daysEl.value) || 4;
  if (dateEl) state.wizard.startDate = dateEl.value;
}

// Update Summary Screen (Step 5)
function updateSummaryScreen() {
  updateLiveEstimate();

  const selectedCar = state.cars.find(c => c.id === state.wizard.selectedCarId) || state.cars[0] || {};
  const selectedStay = state.stays.find(s => s.id === state.wizard.selectedStayId) || state.stays[0] || {};
  const selectedMeal = state.meals.find(m => m.id === state.wizard.selectedMealId) || state.meals[0] || {};

  const days = state.wizard.days;
  const nights = Math.max(1, days - 1);
  const passengers = state.wizard.passengers;
  const seniors = state.wizard.seniors;
  const pets = state.wizard.pets;

  // Pricing calculations
  const carFare = (selectedCar.base_fare_per_day || 3500) * days;
  const stayFare = (selectedStay.price_per_night || 3000) * nights;
  const mealFare = (selectedMeal.price_per_person_per_day || 850) * passengers * days;
  const chauffeurAllowance = 600 * days;
  const careSubsidy = (seniors > 0 || pets > 0) ? 1500 : 0;

  const subtotal = carFare + stayFare + mealFare + chauffeurAllowance - careSubsidy;
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + tax;

  // DOM Updates
  document.getElementById('summary-route').textContent = `${state.wizard.source} → ${state.wizard.destination}`;
  document.getElementById('summary-days-label').textContent = `${days} Days / ${nights} Nights Road Trip (${state.wizard.startDate})`;
  
  document.getElementById('summary-car-name').textContent = selectedCar.name || 'Selected Vehicle';
  document.getElementById('summary-car-desc').textContent = `${selectedCar.category} • Captain: ${selectedCar.captain || 'Assigned'}`;

  document.getElementById('summary-stay-name').textContent = selectedStay.name || 'Selected Stay';
  document.getElementById('summary-stay-desc').textContent = `${selectedStay.type} • ₹${selectedStay.price_per_night}/night`;

  document.getElementById('summary-meal-name').textContent = selectedMeal.name || 'Selected Meal';
  document.getElementById('summary-meal-desc').textContent = `${selectedMeal.type} • ₹${selectedMeal.price_per_person_per_day}/person/day`;

  document.getElementById('summary-travelers-count').textContent = `${passengers} Adults • ${seniors} Senior Citizens • ${pets} Pets`;

  document.getElementById('calc-days-1').textContent = days;
  document.getElementById('calc-nights').textContent = nights;
  document.getElementById('calc-travelers-meals').textContent = `${passengers} x ${days} days`;

  document.getElementById('calc-car-fare').textContent = `₹${carFare.toLocaleString()}`;
  document.getElementById('calc-stay-fare').textContent = `₹${stayFare.toLocaleString()}`;
  document.getElementById('calc-meal-fare').textContent = `₹${mealFare.toLocaleString()}`;
  document.getElementById('calc-tax').textContent = `₹${tax.toLocaleString()}`;
  document.getElementById('calc-grand-total').textContent = `₹${grandTotal.toLocaleString()}`;

  // Store computed total in state
  state.wizard.computedGrandTotal = grandTotal;
}

// Submit Booking Order to Backend
async function submitBookingOrder() {
  const custName = document.getElementById('cust-name').value.trim() || 'Aarav Singhania';
  const custPhone = document.getElementById('cust-phone').value.trim() || '+91 98101 23456';
  const custEmail = document.getElementById('cust-email').value.trim() || 'traveler@deeptrip.com';
  const custNotes = document.getElementById('cust-notes').value.trim();

  const selectedCar = state.cars.find(c => c.id === state.wizard.selectedCarId) || state.cars[0] || {};
  const selectedStay = state.stays.find(s => s.id === state.wizard.selectedStayId) || state.stays[0] || {};
  const selectedMeal = state.meals.find(m => m.id === state.wizard.selectedMealId) || state.meals[0] || {};

  const bookingPayload = {
    user_name: custName,
    user_phone: custPhone,
    user_email: custEmail,
    source: state.wizard.source,
    destination: state.wizard.destination,
    start_date: state.wizard.startDate,
    days: state.wizard.days,
    passengers: state.wizard.passengers,
    senior_citizens_count: state.wizard.seniors,
    pets_count: state.wizard.pets,
    car_id: selectedCar.id,
    car_name: selectedCar.name,
    stay_id: selectedStay.id,
    stay_name: selectedStay.name,
    meal_id: selectedMeal.id,
    meal_name: selectedMeal.name,
    total_price: state.wizard.computedGrandTotal || 38500,
    status: 'Confirmed',
    payment_status: 'Paid',
    captain_assigned: selectedCar.captain ? selectedCar.captain.split('(')[0].trim() : 'Vikramaditya Singh',
    special_notes: custNotes
  };

  try {
    showToast('Locking in your road trip booking...');
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    });
    const data = await res.json();

    if (data.success) {
      // Add to local state
      state.bookings.unshift(data.data);
      
      const badge = document.getElementById('bookingsCountBadge');
      if (badge) badge.textContent = state.bookings.length;

      // Show celebratory modal
      showBookingSuccessModal(data.data);
      renderMyBookings();
    } else {
      alert('Could not complete booking: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Booking submission error:', err);
    alert('Booking submitted in local offline mode!');
  }
}

// Show Confirmation Modal
function showBookingSuccessModal(booking) {
  const modal = document.getElementById('bookingSuccessModal');
  const detailsEl = document.getElementById('successBookingDetails');
  const ticketPreview = document.getElementById('successTicketPreview');

  if (detailsEl) {
    detailsEl.textContent = `Booking ID: ${booking.id} • ${booking.source} to ${booking.destination} for ${booking.user_name}`;
  }

  if (ticketPreview) {
    ticketPreview.innerHTML = `
      <p><strong>Booking ID:</strong> ${booking.id}</p>
      <p><strong>Vehicle:</strong> ${booking.car_name}</p>
      <p><strong>Captain Guide:</strong> ${booking.captain_assigned}</p>
      <p><strong>Stay:</strong> ${booking.stay_name}</p>
      <p><strong>Total Fare:</strong> ₹${booking.total_price.toLocaleString()} (Paid)</p>
    `;
  }

  if (modal) modal.classList.add('open');
}

function closeSuccessModalAndGoToBookings() {
  const modal = document.getElementById('bookingSuccessModal');
  if (modal) modal.classList.remove('open');
  switchTab('bookings');
}

// Render "My Bookings" Tab
function renderMyBookings() {
  const container = document.getElementById('myBookingsContainer');
  if (!container) return;

  if (!state.bookings || state.bookings.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px 20px;">
        <span style="font-size:40px;">🚗</span>
        <h4 style="margin: 10px 0; color:#fff;">No Bookings Yet</h4>
        <p style="color:var(--text-muted); font-size:12px; margin-bottom:16px;">Customize your first chauffeur-guided road journey today.</p>
        <button class="btn-primary-glow" onclick="startCustomTrip()">Plan Road Trip</button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.bookings.map(b => {
    const statusClass = (b.status || 'Confirmed').toLowerCase().replace(' ', '-');
    return `
      <div class="booking-pass-card">
        <div class="booking-pass-header">
          <span class="pass-id">TICKET #${b.id}</span>
          <span class="pass-status-badge ${statusClass}">${b.status || 'Confirmed'}</span>
        </div>
        <div class="booking-pass-body">
          <h3 class="pass-destination">${b.destination}</h3>
          <p class="pass-dates">📅 Start: ${b.start_date} (${b.days || 4} Days) • From: ${b.source}</p>

          <div class="pass-captain-card">
            <div class="captain-left">
              <div class="captain-avatar">👨‍✈️</div>
              <div>
                <h5 class="captain-name">${b.captain_assigned || 'Vikramaditya Singh'}</h5>
                <span class="captain-tag">DeepTrip Certified Captain-Guide</span>
              </div>
            </div>
            <button class="btn-call-captain" onclick="simulateCall('${b.captain_assigned || 'Captain'}')">
              📞 Call Captain
            </button>
          </div>

          <div class="pass-meta-grid">
            <div><strong>🚘 Car:</strong> ${b.car_name}</div>
            <div><strong>🏡 Stay:</strong> ${b.stay_name}</div>
            <div><strong>🍲 Meal:</strong> ${b.meal_name}</div>
            <div><strong>💵 Total:</strong> ₹${(b.total_price || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Emergency SOS Trigger
function triggerEmergencySOS() {
  alert('🚨 EMERGENCY SOS TRIGGERED!\n\nDeepTrip 24/7 Operations Hub has received your alert.\n• Closest highway rapid assistance vehicle dispatched.\n• Emergency medical coordinator alerted.\n• Location verified.');
  showToast('SOS Alert Sent to Ops Hub!');
}

// Simulate Phone Calls
function simulateCall(name) {
  alert(`Connecting call to: ${name}\nDeepTrip Secure Chauffeur Hotline...`);
}

// Reset Database Seed
async function resetSeedData() {
  if (confirm('Reset database to initial seed cars, stays and meal packages?')) {
    try {
      const res = await fetch(`${API_BASE}/reset-seed`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Database reset successfully!');
        await fetchAllAppData();
        renderCuratedTrips();
        renderFleetPreview();
        renderWizardCars();
        renderWizardStays();
        renderWizardMeals();
        renderMyBookings();
      }
    } catch (e) {
      alert('Error resetting data');
    }
  }
}

// Open Admin Portal
function openAdminLink() {
  window.open('/admin', '_blank');
}

// Simple Toast Notification
function showToast(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
