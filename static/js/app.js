/**
 * GeoAppBuilder - AI-Powered Spatial Intelligence Platform
 * Chat-based GIS interface with MCP backend
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
    MAP_CENTER: [37.7749, -122.4194],
    MAP_ZOOM: 11,
    TILE_URL: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    TILE_DARK_URL: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    TILE_ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    API_BASE: '/api'
};

// ============================================
// State Management
// ============================================
const state = {
    map: null,
    heroMap: null,
    layers: [],
    isAppOpen: false,
    chatHistory: [],
    isProcessing: false
};

// ============================================
// Initialize Application
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initHeroMap();
    bindEvents();
    autoResizeTextarea();
});

// ============================================
// Hero Map (Demo Preview)
// ============================================
function initHeroMap() {
    const heroMapEl = document.getElementById('hero-map');
    if (!heroMapEl) return;
    
    state.heroMap = L.map('hero-map', {
        center: [37.8199, -122.4783],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false
    });
    
    L.tileLayer(CONFIG.TILE_URL, {
        maxZoom: 19
    }).addTo(state.heroMap);
    
    // Add demo danger zone
    setTimeout(() => {
        addDemoZone();
    }, 1000);
}

function addDemoZone() {
    if (!state.heroMap) return;
    
    // Create a circle for the demo
    const center = [37.8199, -122.4783];
    const circle = L.circle(center, {
        color: '#f97316',
        fillColor: '#f97316',
        fillOpacity: 0.2,
        weight: 2,
        radius: 5000
    }).addTo(state.heroMap);
    
    // Add center marker
    const icon = L.divIcon({
        className: 'demo-marker',
        html: `<div style="width: 12px; height: 12px; background: #f97316; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
    
    L.marker(center, { icon }).addTo(state.heroMap);
}

// ============================================
// Main App Map
// ============================================
function initMainMap() {
    if (state.map) return;
    
    state.map = L.map('map', {
        center: CONFIG.MAP_CENTER,
        zoom: CONFIG.MAP_ZOOM,
        zoomControl: true
    });
    
    L.tileLayer(CONFIG.TILE_URL, {
        attribution: CONFIG.TILE_ATTRIBUTION,
        maxZoom: 19
    }).addTo(state.map);
    
    // Mouse move for coordinates
    state.map.on('mousemove', (e) => {
        document.getElementById('cursor-lat').textContent = e.latlng.lat.toFixed(4) + '°';
        document.getElementById('cursor-lon').textContent = e.latlng.lng.toFixed(4) + '°';
    });
}

// ============================================
// App Navigation
// ============================================
function openApp() {
    const appSection = document.getElementById('app-section');
    const heroSection = document.getElementById('hero');
    const featuresSection = document.getElementById('features');
    const footer = document.getElementById('footer');
    const navbar = document.querySelector('.navbar');
    
    appSection.classList.add('active');
    heroSection.style.display = 'none';
    featuresSection.style.display = 'none';
    footer.style.display = 'none';
    navbar.style.display = 'none';
    
    state.isAppOpen = true;
    
    // Initialize map after DOM is visible
    setTimeout(() => {
        initMainMap();
        state.map.invalidateSize();
    }, 100);
}

function closeApp() {
    const appSection = document.getElementById('app-section');
    const heroSection = document.getElementById('hero');
    const featuresSection = document.getElementById('features');
    const footer = document.getElementById('footer');
    const navbar = document.querySelector('.navbar');
    
    appSection.classList.remove('active');
    heroSection.style.display = 'grid';
    featuresSection.style.display = 'block';
    footer.style.display = 'block';
    navbar.style.display = 'block';
    
    state.isAppOpen = false;
}

// ============================================
// Chat Interface
// ============================================
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || state.isProcessing) return;
    
    // Add user message
    addMessageToChat('user', message);
    input.value = '';
    resizeTextarea(input);
    
    // Hide welcome if visible
    const welcome = document.querySelector('.chat-welcome');
    if (welcome) welcome.style.display = 'none';
    
    // Process the message
    processUserMessage(message);
}

function addMessageToChat(role, content, extras = {}) {
    const container = document.getElementById('chat-container');
    
    // Create messages wrapper if needed
    let messagesDiv = container.querySelector('.chat-messages');
    if (!messagesDiv) {
        messagesDiv = document.createElement('div');
        messagesDiv.className = 'chat-messages';
        container.appendChild(messagesDiv);
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    
    const avatar = role === 'assistant' ? '✨' : '👤';
    
    let extrasHTML = '';
    if (extras.code) {
        extrasHTML += `<div class="message-code">${extras.code}</div>`;
    }
    if (extras.result) {
        extrasHTML += `<div class="message-result">${extras.result}</div>`;
    }
    
    messageEl.innerHTML = `
        <div class="message-avatar-wrapper">
            <div class="message-avatar-icon">${avatar}</div>
        </div>
        <div class="message-bubble">
            ${content}
            ${extrasHTML}
        </div>
    `;
    
    messagesDiv.appendChild(messageEl);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
    
    // Store in history
    state.chatHistory.push({ role, content, extras });
}

async function processUserMessage(message) {
    state.isProcessing = true;
    
    // Parse intent from message
    const intent = parseIntent(message);
    
    if (intent.type === 'danger_zone' || intent.type === 'buffer') {
        await handleDangerZoneRequest(intent);
    } else if (intent.type === 'distance') {
        await handleDistanceRequest(intent);
    } else {
        // Default response
        addMessageToChat('assistant', 
            "I can help you with spatial analysis! Try asking me to create a buffer zone around a location, or calculate distances between places. For example: <br><br>• \"Create a 5km danger zone around Times Square\"<br>• \"What's the distance between San Francisco and Los Angeles?\""
        );
    }
    
    state.isProcessing = false;
}

function parseIntent(message) {
    const lowerMsg = message.toLowerCase();
    
    // Check for danger zone / buffer requests
    if (lowerMsg.includes('danger zone') || lowerMsg.includes('buffer') || lowerMsg.includes('radius')) {
        // Extract coordinates if present
        const coordMatch = message.match(/(-?\d+\.?\d*)\s*,?\s*(-?\d+\.?\d*)/);
        // Extract radius
        const radiusMatch = message.match(/(\d+\.?\d*)\s*(km|kilometer|mile|m|meter)/i);
        
        // Known locations
        const locations = {
            'golden gate': { lat: 37.8199, lon: -122.4783 },
            'times square': { lat: 40.7580, lon: -73.9855 },
            'eiffel tower': { lat: 48.8584, lon: 2.2945 },
            'big ben': { lat: 51.5007, lon: -0.1246 },
            'statue of liberty': { lat: 40.6892, lon: -74.0445 },
            'san francisco': { lat: 37.7749, lon: -122.4194 },
            'new york': { lat: 40.7128, lon: -74.0060 },
            'los angeles': { lat: 34.0522, lon: -118.2437 },
            'london': { lat: 51.5074, lon: -0.1278 },
            'paris': { lat: 48.8566, lon: 2.3522 },
            'tokyo': { lat: 35.6762, lon: 139.6503 }
        };
        
        let lat = null, lon = null;
        
        // Check for known locations
        for (const [name, coords] of Object.entries(locations)) {
            if (lowerMsg.includes(name)) {
                lat = coords.lat;
                lon = coords.lon;
                break;
            }
        }
        
        // Override with explicit coordinates
        if (coordMatch) {
            const c1 = parseFloat(coordMatch[1]);
            const c2 = parseFloat(coordMatch[2]);
            if (Math.abs(c1) <= 90) {
                lat = c1;
                lon = c2;
            } else {
                lon = c1;
                lat = c2;
            }
        }
        
        let radius = 5; // default km
        if (radiusMatch) {
            radius = parseFloat(radiusMatch[1]);
            if (radiusMatch[2].toLowerCase().includes('mile')) {
                radius *= 1.60934;
            } else if (radiusMatch[2].toLowerCase() === 'm' || radiusMatch[2].toLowerCase().includes('meter')) {
                radius /= 1000;
            }
        }
        
        return { type: 'danger_zone', lat, lon, radius };
    }
    
    // Check for distance requests
    if (lowerMsg.includes('distance') || lowerMsg.includes('how far')) {
        return { type: 'distance', message };
    }
    
    return { type: 'unknown' };
}

async function handleDangerZoneRequest(intent) {
    if (!intent.lat || !intent.lon) {
        addMessageToChat('assistant', 
            "I need a location to create the danger zone. Please provide coordinates (e.g., 37.7749, -122.4194) or mention a known place like \"Times Square\" or \"Golden Gate Bridge\"."
        );
        return;
    }
    
    // Show thinking message
    addMessageToChat('assistant', 
        `Creating a ${intent.radius}km buffer zone around coordinates (${intent.lat.toFixed(4)}, ${intent.lon.toFixed(4)})...`,
        { code: `calculate_danger_zone(lat=${intent.lat}, lon=${intent.lon}, radius_km=${intent.radius})` }
    );
    
    try {
        const response = await fetch(`${CONFIG.API_BASE}/danger-zone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude: intent.lat,
                longitude: intent.lon,
                radius_km: intent.radius,
                name: 'Analysis Zone'
            })
        });
        
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        
        // Add to map
        addZoneToMap(data);
        
        // Show success
        setTimeout(() => {
            addMessageToChat('assistant', 
                `Done! I've created a ${intent.radius}km danger zone.`,
                { result: `<strong>Area:</strong> ${data.area_sq_km} km² | <strong>Center:</strong> ${intent.lat.toFixed(4)}, ${intent.lon.toFixed(4)}` }
            );
            
            showResults({
                'Zone Type': 'Circular Buffer',
                'Radius': `${intent.radius} km`,
                'Area': `${data.area_sq_km} km²`,
                'Center Lat': intent.lat.toFixed(6),
                'Center Lon': intent.lon.toFixed(6)
            });
        }, 500);
        
    } catch (error) {
        addMessageToChat('assistant', 
            `Sorry, I encountered an error creating the zone: ${error.message}. Please try again.`
        );
    }
}

async function handleDistanceRequest(intent) {
    addMessageToChat('assistant', 
        "Distance calculation is available! Please provide two locations. For example: \"Distance from San Francisco to Los Angeles\" or provide coordinates."
    );
}

function addZoneToMap(data) {
    if (!state.map) return;
    
    const { geojson, center } = data;
    
    // Add GeoJSON layer
    const layer = L.geoJSON(geojson, {
        style: {
            color: '#f97316',
            weight: 2,
            opacity: 0.9,
            fillColor: '#f97316',
            fillOpacity: 0.15,
            dashArray: '6, 4'
        }
    }).addTo(state.map);
    
    // Add center marker
    const icon = L.divIcon({
        className: 'zone-center-marker',
        html: `
            <div style="position: relative;">
                <div style="width: 16px; height: 16px; background: #f97316; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(249,115,22,0.5);"></div>
                <div style="position: absolute; top: -4px; left: -4px; width: 24px; height: 24px; border: 2px solid #f97316; border-radius: 50%; opacity: 0.5; animation: ping 1.5s ease-out infinite;"></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
    
    const marker = L.marker([center.lat, center.lon], { icon }).addTo(state.map);
    
    state.layers.push(layer, marker);
    
    // Fit bounds
    state.map.fitBounds(layer.getBounds().pad(0.2));
    
    // Add ping animation style if not exists
    if (!document.getElementById('ping-style')) {
        const style = document.createElement('style');
        style.id = 'ping-style';
        style.textContent = `
            @keyframes ping {
                0% { transform: scale(1); opacity: 0.5; }
                100% { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function showResults(data) {
    const panel = document.getElementById('results-panel');
    const content = document.getElementById('results-content');
    
    content.innerHTML = Object.entries(data).map(([label, value]) => `
        <div class="result-item">
            <span class="result-label">${label}</span>
            <span class="result-value">${value}</span>
        </div>
    `).join('');
    
    panel.classList.add('active');
}

function clearMap() {
    state.layers.forEach(layer => state.map.removeLayer(layer));
    state.layers = [];
    
    const panel = document.getElementById('results-panel');
    panel.classList.remove('active');
}

function exportGeoJSON() {
    if (state.layers.length === 0) {
        alert('No layers to export');
        return;
    }
    
    // Collect all GeoJSON
    const features = [];
    state.layers.forEach(layer => {
        if (layer.toGeoJSON) {
            const geo = layer.toGeoJSON();
            if (geo.type === 'FeatureCollection') {
                features.push(...geo.features);
            } else {
                features.push(geo);
            }
        }
    });
    
    const collection = {
        type: 'FeatureCollection',
        features
    };
    
    // Download
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geoappbuilder-export.geojson';
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// Textarea Auto-resize
// ============================================
function autoResizeTextarea() {
    const textarea = document.getElementById('chat-input');
    if (!textarea) return;
    
    textarea.addEventListener('input', () => resizeTextarea(textarea));
}

function resizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// ============================================
// Event Bindings
// ============================================
function bindEvents() {
    // Navigation buttons
    document.getElementById('open-app-btn')?.addEventListener('click', openApp);
    document.getElementById('try-demo-btn')?.addEventListener('click', openApp);
    document.getElementById('start-building-btn')?.addEventListener('click', openApp);
    document.getElementById('close-app-btn')?.addEventListener('click', closeApp);
    
    // Chat
    document.getElementById('send-btn')?.addEventListener('click', sendMessage);
    document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.dataset.prompt;
            document.getElementById('chat-input').value = prompt;
            sendMessage();
        });
    });
    
    // Toolbar
    document.getElementById('clear-map-btn')?.addEventListener('click', clearMap);
    document.getElementById('export-btn')?.addEventListener('click', exportGeoJSON);
    document.getElementById('close-results-btn')?.addEventListener('click', () => {
        document.getElementById('results-panel').classList.remove('active');
    });
    
    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}
