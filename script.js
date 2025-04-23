let map;
let marker;
let infoWindow;
let history = JSON.parse(localStorage.getItem('trackingHistory')) || [];

function initMap(lat = 37.7749, lng = -122.4194) {
  const location = { lat, lng };
  map = new google.maps.Map(document.getElementById("map"), {
    center: location,
    zoom: 14
  });
  marker = new google.maps.Marker({
    position: location,
    map: map
  });
  infoWindow = new google.maps.InfoWindow();
  
  // Initialize country code inputs
  $(".country-code").countrySelect({
    defaultCountry: "us",
    responsiveDropdown: true
  });
}

window.onload = () => initMap();

function getRandomCoordinates() {
  return {
    lat: 37.7749 + (Math.random() - 0.5) * 0.02,
    lng: -122.4194 + (Math.random() - 0.5) * 0.02
  };
}

function trackCriminal() {
  const countryCode = document.getElementById("countryCode1").value;
  const phone = document.getElementById("criminalPhone").value;
  
  if (!phone) {
    alert("Enter a phone number.");
    return;
  }
  
  const fullPhone = countryCode ? `${countryCode} ${phone}` : phone;
  const coords = getRandomCoordinates();
  updateMap(coords.lat, coords.lng, "Criminal Location Found", fullPhone);
  logTracking(fullPhone, "Criminal", coords);
}

function trackLostPhone() {
  const countryCode = document.getElementById("countryCode2").value;
  const phone = document.getElementById("lostPhone").value;
  const imei = document.getElementById("imei").value;
  
  if (!phone || !imei) {
    alert("Enter both phone number and IMEI.");
    return;
  }
  
  const fullPhone = countryCode ? `${countryCode} ${phone}` : phone;
  const coords = getRandomCoordinates();
  updateMap(coords.lat, coords.lng, "Lost Phone Found", fullPhone);
  logTracking(fullPhone, "Lost", coords);
}

function updateMap(lat, lng, label, phoneNumber) {
  const location = { lat, lng };
  map.setCenter(location);
  marker.setPosition(location);
  marker.setTitle(label);
  
  // Update phone info display
  const phoneInfo = document.getElementById("phoneInfo");
  phoneInfo.style.display = "block";
  phoneInfo.innerHTML = `
    <strong>Tracking:</strong> ${phoneNumber}<br>
    <strong>Status:</strong> ${label}<br>
    <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
  `;
  
  // Update info window
  infoWindow.setContent(`
    <div style="padding: 10px;">
      <h3 style="margin: 0 0 5px 0;">${label}</h3>
      <p style="margin: 5px 0;"><strong>Phone:</strong> ${phoneNumber}</p>
      <p style="margin: 5px 0;"><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
    </div>
  `);
  infoWindow.open(map, marker);
}

function logTracking(phone, type, coords) {
  // Mark all previous entries of this phone inactive
  history.forEach(entry => {
    if (entry.phone === phone) {
      entry.status = "Inactive";
    }
  });

  const newEntry = {
    id: Date.now(),
    phone,
    type,
    status: "Active",
    coordinates: coords,
    formattedCoords: `(${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
    time: new Date().toLocaleString()
  };

  history.unshift(newEntry);
  if (history.length > 50) history.pop(); // Limit history size
  saveHistory();
  updateHistoryTable();
}

function updateHistoryTable() {
  const tableBody = document.querySelector("#historyTable tbody");
  tableBody.innerHTML = "";
  const searchTerm = document.getElementById("searchHistory").value.toLowerCase();

  history.forEach(entry => {
    if (searchTerm && !entry.phone.toLowerCase().includes(searchTerm)) return;
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.phone}</td>
      <td>${entry.type}</td>
      <td class="${entry.status.toLowerCase()}">${entry.status}</td>
      <td>${entry.formattedCoords}</td>
      <td>${entry.time}</td>
      <td>
        <button class="action-btn recenter-btn" onclick="recenterMap(${entry.id})">Recenter</button>
        <button class="action-btn delete-btn" onclick="deleteEntry(${entry.id})">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function recenterMap(id) {
  const entry = history.find(item => item.id === id);
  if (entry) {
    updateMap(entry.coordinates.lat, entry.coordinates.lng, 
             `${entry.type} Location`, entry.phone);
  }
}

function deleteEntry(id) {
  history = history.filter(item => item.id !== id);
  saveHistory();
  updateHistoryTable();
}

function clearHistory() {
  if (confirm("Are you sure you want to clear all tracking history?")) {
    history = [];
    saveHistory();
    updateHistoryTable();
  }
}

function saveHistory() {
  localStorage.setItem('trackingHistory', JSON.stringify(history));
}

// Search functionality
document.getElementById("searchHistory").addEventListener("input", updateHistoryTable);