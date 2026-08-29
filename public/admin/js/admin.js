/**
 * DeepTrip Admin Control Panel Logic
 * Real-Time Fleet, Accommodations, Meals & Bookings Operations
 */

const API_BASE = window.location.origin + '/api';

const adminState = {
  activeTab: 'overview',
  analytics: {},
  cars: [],
  stays: [],
  meals: [],
  bookings: []
};

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
  await refreshAdminData();
});

// Refresh all data from server
async function refreshAdminData() {
  try {
    const [analyticsRes, carsRes, staysRes, mealsRes, bookingsRes] = await Promise.all([
      fetch(`${API_BASE}/analytics`).then(r => r.json()),
      fetch(`${API_BASE}/cars`).then(r => r.json()),
      fetch(`${API_BASE}/stays`).then(r => r.json()),
      fetch(`${API_BASE}/meals`).then(r => r.json()),
      fetch(`${API_BASE}/bookings`).then(r => r.json())
    ]);

    adminState.analytics = analyticsRes.data || {};
    adminState.cars = carsRes.data || [];
    adminState.stays = staysRes.data || [];
    adminState.meals = mealsRes.data || [];
    adminState.bookings = bookingsRes.data || [];

    updateDashboardKPIs();
    renderOverviewBookings();
    renderOverviewFleetHealth();
    renderCarsGrid();
    renderStaysGrid();
    renderMealsGrid();
    renderBookingsTable();

    // Badges in sidebar
    const bCars = document.getElementById('badgeCarsCount');
    const bStays = document.getElementById('badgeStaysCount');
    const bMeals = document.getElementById('badgeMealsCount');
    const bBookings = document.getElementById('badgeTotalBookings');

    if (bCars) bCars.textContent = adminState.cars.length;
    if (bStays) bStays.textContent = adminState.stays.length;
    if (bMeals) bMeals.textContent = adminState.meals.length;
    if (bBookings) bBookings.textContent = adminState.bookings.length;

  } catch (err) {
    console.error('Error refreshing admin data:', err);
    showAdminToast('Error connecting to backend API', true);
  }
}

// Switch Sidebar Tabs
function switchAdminTab(tabName) {
  adminState.activeTab = tabName;

  document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
  const targetSection = document.getElementById(`section-${tabName}`);
  if (targetSection) targetSection.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
  const targetBtn = document.getElementById(`tab-btn-${tabName}`);
  if (targetBtn) targetBtn.classList.add('active');
}

// Update KPI Metrics in Overview
function updateDashboardKPIs() {
  const an = adminState.analytics;

  const revEl = document.getElementById('kpiTotalRevenue');
  const bookEl = document.getElementById('kpiTotalBookings');
  const actEl = document.getElementById('kpiActiveTrips');
  const careEl = document.getElementById('kpiSpecialCareTrips');

  if (revEl) revEl.textContent = `₹${(an.total_revenue || 0).toLocaleString()}`;
  if (bookEl) bookEl.textContent = an.total_bookings || adminState.bookings.length;
  if (actEl) actEl.textContent = an.active_trips || 0;
  if (careEl) careEl.textContent = (an.senior_trips_count || 0) + (an.pet_trips_count || 0);
}

// Render Overview Recent Bookings Table
function renderOverviewBookings() {
  const tbody = document.getElementById('overviewRecentBookingsBody');
  if (!tbody) return;

  const recent = adminState.bookings.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No bookings yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(b => {
    const statusClass = (b.status || 'Confirmed').toLowerCase().replace(' ', '-');
    return `
      <tr>
        <td><strong>#${b.id}</strong></td>
        <td>
          <strong>${b.user_name}</strong>
          <span style="display:block; font-size:11px; color:var(--text-muted);">${b.user_phone}</span>
        </td>
        <td>${b.destination}</td>
        <td>${b.car_name}</td>
        <td><strong>₹${(b.total_price || 0).toLocaleString()}</strong></td>
        <td><span class="status-badge ${statusClass}">${b.status}</span></td>
      </tr>
    `;
  }).join('');
}

// Render Fleet Health in Overview
function renderOverviewFleetHealth() {
  const container = document.getElementById('overviewFleetHealth');
  if (!container) return;

  container.innerHTML = adminState.cars.map(c => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
      <div>
        <strong style="font-size:13px; color:#fff;">${c.name}</strong>
        <span style="display:block; font-size:11px; color:var(--text-muted);">${c.category} • ${c.captain}</span>
      </div>
      <div>
        <span class="status-badge ${c.is_active !== false ? 'confirmed' : 'cancelled'}">
          ${c.is_active !== false ? '● Ready for Dispatch' : '● In Maintenance'}
        </span>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// Cars Fleet Management
// ==========================================================================
function renderCarsGrid() {
  const container = document.getElementById('adminCarsGrid');
  if (!container) return;

  if (adminState.cars.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); padding:20px;">No fleet vehicles added yet.</p>`;
    return;
  }

  container.innerHTML = adminState.cars.map(car => `
    <div class="admin-item-card" id="car-card-${car.id}">
      <div class="admin-card-img-wrap">
        <img src="${car.image}" alt="${car.name}" class="admin-card-img" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'">
        <span class="admin-card-badge">${car.category}</span>
        
        <div class="admin-card-toggle">
          <label class="toggle-switch" title="Toggle Fleet Availability">
            <input type="checkbox" ${car.is_active !== false ? 'checked' : ''} onchange="toggleCarActive('${car.id}', this.checked)">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="admin-card-body">
        <div class="admin-card-header">
          <h4 class="admin-card-title">${car.name}</h4>
          <div class="admin-card-price">
            ₹${car.base_fare_per_day}
            <span style="font-size:10px; color:var(--text-muted); display:block;">/day + ₹${car.rate_per_km}/km</span>
          </div>
        </div>

        <p class="admin-card-desc">${car.description || 'Verified Chauffeur-driven fleet car.'}</p>
        <p class="admin-card-meta">👨‍✈️ <strong>Captain:</strong> ${car.captain || 'Assigned on demand'} | 🧳 <strong>Boot:</strong> ${car.luggage || '4 Bags'}</p>

        <div class="admin-card-tags">
          ${(car.amenities || []).map(a => `<span class="meta-chip">✓ ${a}</span>`).join('')}
          ${car.pet_friendly ? `<span class="meta-chip" style="color:#10b981;">🐕 Pet Ready</span>` : ''}
          ${car.senior_accessible ? `<span class="meta-chip" style="color:#f59e0b;">🧓 Senior Step</span>` : ''}
        </div>

        <div class="admin-card-actions">
          <button class="btn-card-action" onclick="openEditCarModal('${car.id}')">✏️ Edit</button>
          <button class="btn-card-action delete" onclick="deleteCar('${car.id}')">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterCarsList() {
  const query = (document.getElementById('searchCarInput').value || '').toLowerCase();
  const cat = document.getElementById('filterCarCategorySelect').value;

  const filtered = adminState.cars.filter(c => {
    const matchQuery = c.name.toLowerCase().includes(query) || (c.captain && c.captain.toLowerCase().includes(query));
    let matchCat = true;
    if (cat === '4-seater') matchCat = c.capacity <= 4;
    else if (cat === '7-seater') matchCat = c.capacity > 4 && !c.category.toLowerCase().includes('luxury');
    else if (cat === 'luxury') matchCat = c.category.toLowerCase().includes('luxury');
    return matchQuery && matchCat;
  });

  const container = document.getElementById('adminCarsGrid');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); padding:20px;">No matching vehicles found.</p>`;
    return;
  }

  // Reuse card rendering
  const prevCars = adminState.cars;
  adminState.cars = filtered;
  renderCarsGrid();
  adminState.cars = prevCars;
}

function openAddCarModal() {
  document.getElementById('carModalTitle').textContent = 'Add New Fleet Vehicle';
  document.getElementById('carForm').reset();
  document.getElementById('carIdInput').value = '';
  document.getElementById('carModal').classList.add('open');
}

function openEditCarModal(carId) {
  const car = adminState.cars.find(c => c.id === carId);
  if (!car) return;

  document.getElementById('carModalTitle').textContent = `Edit Vehicle: ${car.name}`;
  document.getElementById('carIdInput').value = car.id;
  document.getElementById('carNameInput').value = car.name;
  document.getElementById('carCategoryInput').value = car.category;
  document.getElementById('carCapacityInput').value = car.capacity || 7;
  document.getElementById('carBaseFareInput').value = car.base_fare_per_day;
  document.getElementById('carRateKmInput').value = car.rate_per_km;
  document.getElementById('carCaptainInput').value = car.captain || '';
  document.getElementById('carLuggageInput').value = car.luggage || '';
  document.getElementById('carImageInput').value = car.image || '';
  document.getElementById('carDescInput').value = car.description || '';
  document.getElementById('carAmenitiesInput').value = (car.amenities || []).join(', ');
  document.getElementById('carPetInput').checked = !!car.pet_friendly;
  document.getElementById('carSeniorInput').checked = !!car.senior_accessible;

  document.getElementById('carModal').classList.add('open');
}

async function handleCarFormSubmit(event) {
  event.preventDefault();

  const carId = document.getElementById('carIdInput').value;
  const amenitiesStr = document.getElementById('carAmenitiesInput').value;
  const amenities = amenitiesStr.split(',').map(s => s.trim()).filter(Boolean);

  const payload = {
    name: document.getElementById('carNameInput').value.trim(),
    category: document.getElementById('carCategoryInput').value,
    capacity: parseInt(document.getElementById('carCapacityInput').value) || 4,
    base_fare_per_day: parseInt(document.getElementById('carBaseFareInput').value) || 2500,
    rate_per_km: parseInt(document.getElementById('carRateKmInput').value) || 15,
    captain: document.getElementById('carCaptainInput').value.trim() || 'Assigned on demand',
    luggage: document.getElementById('carLuggageInput').value.trim() || '4 Bags',
    image: document.getElementById('carImageInput').value.trim() || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    description: document.getElementById('carDescInput').value.trim(),
    amenities: amenities,
    pet_friendly: document.getElementById('carPetInput').checked,
    senior_accessible: document.getElementById('carSeniorInput').checked,
    is_active: true
  };

  try {
    let url = `${API_BASE}/cars`;
    let method = 'POST';

    if (carId) {
      url = `${API_BASE}/cars/${carId}`;
      method = 'PUT';
    }

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast(carId ? 'Vehicle updated successfully!' : 'New vehicle added to fleet!');
      closeModal('carModal');
      await refreshAdminData();
    } else {
      alert('Error saving car: ' + data.error);
    }
  } catch (err) {
    console.error('Error saving car:', err);
    showAdminToast('Error saving car', true);
  }
}

async function toggleCarActive(carId, isActive) {
  try {
    const res = await fetch(`${API_BASE}/cars/${carId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(`Vehicle status updated: ${isActive ? 'Available' : 'Maintenance'}`);
      await refreshAdminData();
    }
  } catch (e) {
    console.error(e);
  }
}

async function deleteCar(carId) {
  if (confirm('Are you sure you want to remove this car from the fleet?')) {
    try {
      const res = await fetch(`${API_BASE}/cars/${carId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showAdminToast('Car deleted successfully');
        await refreshAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// ==========================================================================
// Accommodations (Stays) Management
// ==========================================================================
function renderStaysGrid() {
  const container = document.getElementById('adminStaysGrid');
  if (!container) return;

  container.innerHTML = adminState.stays.map(stay => `
    <div class="admin-item-card" id="stay-card-${stay.id}">
      <div class="admin-card-img-wrap">
        <img src="${stay.image}" alt="${stay.name}" class="admin-card-img" onerror="this.src='https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80'">
        <span class="admin-card-badge">${stay.type}</span>
      </div>

      <div class="admin-card-body">
        <div class="admin-card-header">
          <h4 class="admin-card-title">${stay.name}</h4>
          <div class="admin-card-price">
            ₹${stay.price_per_night}
            <span style="font-size:10px; color:var(--text-muted); display:block;">/night</span>
          </div>
        </div>

        <p class="admin-card-desc">${stay.description}</p>
        <p class="admin-card-meta">📍 <strong>Location:</strong> ${stay.location || 'India Circuit'} | ⭐ <strong>Rating:</strong> ${stay.rating || 4.8}</p>

        <div class="admin-card-tags">
          ${(stay.amenities || []).map(a => `<span class="meta-chip">✓ ${a}</span>`).join('')}
          ${stay.pet_friendly ? `<span class="meta-chip" style="color:#10b981;">🐕 Pet Lawns</span>` : ''}
          ${stay.senior_accessible ? `<span class="meta-chip" style="color:#f59e0b;">🧓 Ground Floor / Lift</span>` : ''}
        </div>

        <div class="admin-card-actions">
          <button class="btn-card-action" onclick="openEditStayModal('${stay.id}')">✏️ Edit</button>
          <button class="btn-card-action delete" onclick="deleteStay('${stay.id}')">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openAddStayModal() {
  document.getElementById('stayModalTitle').textContent = 'Add Accommodation';
  document.getElementById('stayForm').reset();
  document.getElementById('stayIdInput').value = '';
  document.getElementById('stayModal').classList.add('open');
}

function openEditStayModal(stayId) {
  const stay = adminState.stays.find(s => s.id === stayId);
  if (!stay) return;

  document.getElementById('stayModalTitle').textContent = `Edit Stay: ${stay.name}`;
  document.getElementById('stayIdInput').value = stay.id;
  document.getElementById('stayNameInput').value = stay.name;
  document.getElementById('stayTypeInput').value = stay.type;
  document.getElementById('stayPriceInput').value = stay.price_per_night;
  document.getElementById('stayRatingInput').value = stay.rating || 4.8;
  document.getElementById('stayLocationInput').value = stay.location || '';
  document.getElementById('stayImageInput').value = stay.image || '';
  document.getElementById('stayDescInput').value = stay.description || '';
  document.getElementById('stayAmenitiesInput').value = (stay.amenities || []).join(', ');
  document.getElementById('stayPetInput').checked = !!stay.pet_friendly;
  document.getElementById('staySeniorInput').checked = !!stay.senior_accessible;

  document.getElementById('stayModal').classList.add('open');
}

async function handleStayFormSubmit(event) {
  event.preventDefault();
  const stayId = document.getElementById('stayIdInput').value;
  const amenitiesStr = document.getElementById('stayAmenitiesInput').value;
  const amenities = amenitiesStr.split(',').map(s => s.trim()).filter(Boolean);

  const payload = {
    name: document.getElementById('stayNameInput').value.trim(),
    type: document.getElementById('stayTypeInput').value,
    price_per_night: parseInt(document.getElementById('stayPriceInput').value) || 2500,
    rating: parseFloat(document.getElementById('stayRatingInput').value) || 4.8,
    location: document.getElementById('stayLocationInput').value.trim() || 'Scenic Highway Circuit',
    image: document.getElementById('stayImageInput').value.trim() || 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
    description: document.getElementById('stayDescInput').value.trim(),
    amenities: amenities,
    pet_friendly: document.getElementById('stayPetInput').checked,
    senior_accessible: document.getElementById('staySeniorInput').checked,
    is_active: true
  };

  try {
    let url = `${API_BASE}/stays`;
    let method = 'POST';
    if (stayId) {
      url = `${API_BASE}/stays/${stayId}`;
      method = 'PUT';
    }
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(stayId ? 'Accommodation updated!' : 'New accommodation added!');
      closeModal('stayModal');
      await refreshAdminData();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteStay(stayId) {
  if (confirm('Are you sure you want to remove this accommodation?')) {
    try {
      const res = await fetch(`${API_BASE}/stays/${stayId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showAdminToast('Stay deleted');
        await refreshAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// ==========================================================================
// Meals & Culinary Packages Management
// ==========================================================================
function renderMealsGrid() {
  const container = document.getElementById('adminMealsGrid');
  if (!container) return;

  container.innerHTML = adminState.meals.map(meal => `
    <div class="admin-item-card" id="meal-card-${meal.id}">
      <div class="admin-card-img-wrap">
        <img src="${meal.image}" alt="${meal.name}" class="admin-card-img" onerror="this.src='https://images.unsplash.com/photo-1613292443284-c774643c7b65?auto=format&fit=crop&w=800&q=80'">
        <span class="admin-card-badge">${meal.type}</span>
      </div>

      <div class="admin-card-body">
        <div class="admin-card-header">
          <h4 class="admin-card-title">${meal.name}</h4>
          <div class="admin-card-price">
            ₹${meal.price_per_person_per_day}
            <span style="font-size:10px; color:var(--text-muted); display:block;">/person/day</span>
          </div>
        </div>

        <p class="admin-card-desc">${meal.description}</p>
        <p class="admin-card-meta">🥗 <strong>Dietary:</strong> ${meal.dietary || 'Standard'}</p>

        <div class="admin-card-tags">
          ${(meal.inclusions || []).map(inc => `<span class="meta-chip">🍲 ${inc}</span>`).join('')}
        </div>

        <div class="admin-card-actions">
          <button class="btn-card-action" onclick="openEditMealModal('${meal.id}')">✏️ Edit</button>
          <button class="btn-card-action delete" onclick="deleteMeal('${meal.id}')">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openAddMealModal() {
  document.getElementById('mealModalTitle').textContent = 'Add Meal Package';
  document.getElementById('mealForm').reset();
  document.getElementById('mealIdInput').value = '';
  document.getElementById('mealModal').classList.add('open');
}

function openEditMealModal(mealId) {
  const meal = adminState.meals.find(m => m.id === mealId);
  if (!meal) return;

  document.getElementById('mealModalTitle').textContent = `Edit Meal: ${meal.name}`;
  document.getElementById('mealIdInput').value = meal.id;
  document.getElementById('mealNameInput').value = meal.name;
  document.getElementById('mealTypeInput').value = meal.type;
  document.getElementById('mealPriceInput').value = meal.price_per_person_per_day;
  document.getElementById('mealDietaryInput').value = meal.dietary || '';
  document.getElementById('mealImageInput').value = meal.image || '';
  document.getElementById('mealDescInput').value = meal.description || '';
  document.getElementById('mealInclusionsInput').value = (meal.inclusions || []).join('\n');

  document.getElementById('mealModal').classList.add('open');
}

async function handleMealFormSubmit(event) {
  event.preventDefault();
  const mealId = document.getElementById('mealIdInput').value;
  const incStr = document.getElementById('mealInclusionsInput').value;
  const inclusions = incStr.split('\n').map(s => s.trim()).filter(Boolean);

  const payload = {
    name: document.getElementById('mealNameInput').value.trim(),
    type: document.getElementById('mealTypeInput').value,
    price_per_person_per_day: parseInt(document.getElementById('mealPriceInput').value) || 850,
    dietary: document.getElementById('mealDietaryInput').value.trim() || 'Hygienic Highway Dining',
    image: document.getElementById('mealImageInput').value.trim() || 'https://images.unsplash.com/photo-1613292443284-c774643c7b65?auto=format&fit=crop&w=800&q=80',
    description: document.getElementById('mealDescInput').value.trim(),
    inclusions: inclusions,
    is_active: true
  };

  try {
    let url = `${API_BASE}/meals`;
    let method = 'POST';
    if (mealId) {
      url = `${API_BASE}/meals/${mealId}`;
      method = 'PUT';
    }
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(mealId ? 'Meal package updated!' : 'New meal package added!');
      closeModal('mealModal');
      await refreshAdminData();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteMeal(mealId) {
  if (confirm('Are you sure you want to remove this meal package?')) {
    try {
      const res = await fetch(`${API_BASE}/meals/${mealId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showAdminToast('Meal plan deleted');
        await refreshAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// ==========================================================================
// Bookings & Dispatch Management
// ==========================================================================
function renderBookingsTable() {
  const tbody = document.getElementById('adminBookingsTableBody');
  if (!tbody) return;

  if (adminState.bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">No bookings recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminState.bookings.map(b => {
    const statusClass = (b.status || 'Confirmed').toLowerCase().replace(' ', '-');
    return `
      <tr>
        <td><strong>#${b.id}</strong><span style="display:block; font-size:10.5px; color:var(--text-muted);">${b.created_at || 'Recent'}</span></td>
        <td>
          <strong>${b.user_name}</strong>
          <span style="display:block; font-size:11px; color:var(--text-muted);">${b.user_phone}</span>
          ${b.senior_citizens_count > 0 ? `<span class="meta-chip" style="color:#f59e0b;">🧓 ${b.senior_citizens_count} Senior</span>` : ''}
          ${b.pets_count > 0 ? `<span class="meta-chip" style="color:#10b981;">🐕 ${b.pets_count} Pet</span>` : ''}
        </td>
        <td>
          <strong>${b.destination}</strong>
          <span style="display:block; font-size:11px; color:var(--text-muted);">From: ${b.source} (${b.days || 4} Days, ${b.start_date})</span>
        </td>
        <td>
          <div>🚘 ${b.car_name}</div>
          <div style="font-size:11px; color:var(--text-muted);">🏡 ${b.stay_name}</div>
        </td>
        <td>
          <span>🍲 ${b.meal_name}</span>
        </td>
        <td>
          <strong style="color:#10b981; font-size:14px;">₹${(b.total_price || 0).toLocaleString()}</strong>
          <span style="display:block; font-size:10.5px; color:var(--text-muted);">${b.payment_status || 'Paid'}</span>
        </td>
        <td>
          <select onchange="updateBookingStatus('${b.id}', this.value)" style="background:rgba(255,255,255,0.06); border:1px solid var(--card-border); color:#fff; border-radius:6px; padding:4px 6px; font-size:11.5px; font-weight:700;">
            <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="On Road" ${b.status === 'On Road' ? 'selected' : ''}>On Road</option>
            <option value="Pending" ${b.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Completed" ${b.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="btn-card-action" onclick="alert('Special Care Notes for #${b.id}:\\n\\n${b.special_notes || 'No special notes provided.'}')" style="padding:4px 8px; font-size:11px;">
            📝 Notes
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateBookingStatus(bookingId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(`Booking #${bookingId} marked as ${newStatus}`);
      await refreshAdminData();
    }
  } catch (e) {
    console.error(e);
  }
}

// Reset Seed Data
async function triggerResetSeedData() {
  if (confirm('Reset entire inventory and bookings to default seed data?')) {
    try {
      const res = await fetch(`${API_BASE}/reset-seed`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showAdminToast('Demo seed data restored successfully!');
        await refreshAdminData();
      }
    } catch (e) {
      alert('Error resetting data');
    }
  }
}

// Modal Helper Functions
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

function showAdminToast(msg, isError = false) {
  const container = document.getElementById('adminToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  if (isError) toast.style.borderColor = '#f43f5e';
  toast.textContent = msg;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 2500);
}
