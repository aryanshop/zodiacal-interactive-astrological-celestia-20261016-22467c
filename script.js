/**
 * Zodiacal: Interactive Astrological & Celestial Chart Builder
 * Vanilla JavaScript Ephemeris & Celestial Sphere Engine
 */

(function() {
  'use strict';

  // Zodiac Signs definition
  const ZODIAC_SIGNS = [
    { name: 'Aries', symbol: '\u2648', element: 'Fire', color: '#f43f5e', start: 0 },
    { name: 'Taurus', symbol: '\u2649', element: 'Earth', color: '#10b981', start: 30 },
    { name: 'Gemini', symbol: '\u264A', element: 'Air', color: '#38bdf8', start: 60 },
    { name: 'Cancer', symbol: '\u264B', element: 'Water', color: '#818cf8', start: 90 },
    { name: 'Leo', symbol: '\u264C', element: 'Fire', color: '#fbbf24', start: 120 },
    { name: 'Virgo', symbol: '\u264D', element: 'Earth', color: '#34d399', start: 150 },
    { name: 'Libra', symbol: '\u264E', element: 'Air', color: '#60a5fa', start: 180 },
    { name: 'Scorpio', symbol: '\u264F', element: 'Water', color: '#a78bfa', start: 210 },
    { name: 'Sagittarius', symbol: '\u2650', element: 'Fire', color: '#fb7185', start: 240 },
    { name: 'Capricorn', symbol: '\u2651', element: 'Earth', color: '#6ee7b7', start: 270 },
    { name: 'Aquarius', symbol: '\u2652', element: 'Air', color: '#7dd3fc', start: 300 },
    { name: 'Pisces', symbol: '\u2653', element: 'Water', color: '#c084fc', start: 330 }
  ];

  // Celestial Bodies definition
  const PLANETS = [
    { id: 'sun', name: 'Sun', symbol: '\u2609', color: '#fbbf24', period: 365.2422, meanSpeed: 0.9856 },
    { id: 'moon', name: 'Moon', symbol: '\u263D', color: '#e2e8f0', period: 27.3217, meanSpeed: 13.1764 },
    { id: 'mercury', name: 'Mercury', symbol: '\u263F', color: '#a3a3a3', period: 87.97, meanSpeed: 4.0923 },
    { id: 'venus', name: 'Venus', symbol: '\u2640', color: '#f472b6', period: 224.7, meanSpeed: 1.6021 },
    { id: 'mars', name: 'Mars', symbol: '\u2642', color: '#ef4444', period: 686.98, meanSpeed: 0.5240 },
    { id: 'jupiter', name: 'Jupiter', symbol: '\u2643', color: '#f59e0b', period: 4332.59, meanSpeed: 0.0831 },
    { id: 'saturn', name: 'Saturn', symbol: '\u2644', color: '#d97706', period: 10759.22, meanSpeed: 0.0335 },
    { id: 'uranus', name: 'Uranus', symbol: '\u2645', color: '#22d3ee', period: 30685.4, meanSpeed: 0.0117 },
    { id: 'neptune', name: 'Neptune', symbol: '\u2646', color: '#3b82f6', period: 60189.0, meanSpeed: 0.0060 }
  ];

  // Application State
  const state = {
    date: new Date(),
    lat: 40.71,
    lon: -74.01,
    viewMode: 'chart', // 'chart' or 'sphere'
    layers: {
      constellations: true,
      zodiac: true,
      houses: true,
      aspects: true,
      grid: true
    },
    isPlaying: false,
    speedStep: 1, // days per frame
    animId: null
  };

  // DOM Elements cache
  const el = {
    date: document.getElementById('input-date'),
    time: document.getElementById('input-time'),
    lat: document.getElementById('input-lat'),
    lon: document.getElementById('input-lon'),
    latVal: document.getElementById('lat-val'),
    lonVal: document.getElementById('lon-val'),
    speedRange: document.getElementById('range-speed'),
    speedLabel: document.getElementById('speed-label'),
    playBtn: document.getElementById('btn-play'),
    nowBtn: document.getElementById('btn-now'),
    infoBtn: document.getElementById('btn-info'),
    closeModalBtn: document.getElementById('btn-close-modal'),
    modal: document.getElementById('modal-info'),
    canvas: document.getElementById('sky-canvas'),
    tooltip: document.getElementById('hover-tooltip'),
    sumSun: document.getElementById('summary-sun'),
    sumMoon: document.getElementById('summary-moon'),
    sumAsc: document.getElementById('summary-asc'),
    sumAspects: document.getElementById('summary-aspects'),
    ephemerisList: document.getElementById('ephemeris-list'),
    aspectsList: document.getElementById('aspects-list'),
    infoJd: document.getElementById('info-jd'),
    infoLst: document.getElementById('info-lst'),
    infoSeason: document.getElementById('info-season'),
    infoPhase: document.getElementById('info-phase'),
    moonPhaseVisual: document.getElementById('moon-phase-visual'),
    stepBack: document.getElementById('btn-step-back'),
    stepFwd: document.getElementById('btn-step-fwd')
  };

  // Initialize Inputs from State
  function initControls() {
    updateDateTimeInputs();
    el.lat.value = state.lat;
    el.latVal.textContent = state.lat;
    el.lon.value = state.lon;
    el.lonVal.textContent = state.lon;

    // Event Listeners
    el.date.addEventListener('change', onDateInput);
    el.time.addEventListener('change', onDateInput);
    el.lat.addEventListener('input', onLocationInput);
    el.lon.addEventListener('input', onLocationInput);
    el.speedRange.addEventListener('input', onSpeedInput);
    el.playBtn.addEventListener('click', togglePlay);
    el.nowBtn.addEventListener('click', resetToNow);
    el.infoBtn.addEventListener('click', () => el.modal.classList.remove('hidden'));
    el.closeModalBtn.addEventListener('click', () => el.modal.classList.add('hidden'));
    el.stepBack.addEventListener('click', () => stepDays(-1));
    el.stepFwd.addEventListener('click', () => stepDays(1));

    // Preset location buttons
    document.querySelectorAll('.preset-locations .chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        state.lat = parseFloat(e.target.dataset.lat);
        state.lon = parseFloat(e.target.dataset.lon);
        el.lat.value = state.lat;
        el.latVal.textContent = state.lat;
        el.lon.value = state.lon;
        el.lonVal.textContent = state.lon;
        updateApp();
      });
    });

    // Layer toggles
    ['constellations', 'zodiac', 'houses', 'aspects', 'grid'].forEach(layer => {
      const chk = document.getElementById(`chk-${layer}`);
      if (chk) {
        chk.addEventListener('change', (e) => {
          state.layers[layer] = e.target.checked;
          updateApp();
        });
      }
    });

    // View mode tabs
    document.querySelectorAll('.view-mode-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.view-mode-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.viewMode = e.target.dataset.view;
        updateApp();
      });
    });

    // Details sidebar tabs
    document.querySelectorAll('.details-sidebar .detail-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.details-sidebar .detail-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.details-sidebar .tab-content').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.target).classList.add('active');
      });
    });

    // Canvas resize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }

  function updateDateTimeInputs() {
    const year = state.date.getUTCFullYear();
    const month = String(state.date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(state.date.getUTCDate()).padStart(2, '0');
    const hours = String(state.date.getUTCHours()).padStart(2, '0');
    const minutes = String(state.date.getUTCMinutes()).padStart(2, '0');

    el.date.value = `${year}-${month}-${day}`;
    el.time.value = `${hours}:${minutes}`;
  }

  function onDateInput() {
    const [y, m, d] = el.date.value.split('-').map(Number);
    const [hh, mm] = el.time.value.split(':').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      state.date.setUTCFullYear(y, m - 1, d);
      state.date.setUTCHours(hh || 0, mm || 0, 0, 0);
      updateApp();
    }
  }

  function onLocationInput() {
    state.lat = parseFloat(el.lat.value);
    state.lon = parseFloat(el.lon.value);
    el.latVal.textContent = state.lat;
    el.lonVal.textContent = state.lon;
    updateApp();
  }

  function onSpeedInput() {
    state.speedStep = parseInt(el.speedRange.value);
    el.speedLabel.textContent = `${state.speedStep} Day${state.speedStep > 1 ? 's' : ''}`;
  }

  function resetToNow() {
    state.date = new Date();
    updateDateTimeInputs();
    updateApp();
  }

  function stepDays(days) {
    state.date.setUTCDate(state.date.getUTCDate() + days);
    updateDateTimeInputs();
    updateApp();
  }

  function togglePlay() {
    state.isPlaying = !state.isPlaying;
    if (state.isPlaying) {
      el.playBtn.textContent = 'Pause';
      el.playBtn.classList.remove('primary');
      el.playBtn.classList.add('secondary');
      runAnimation();
    } else {
      el.playBtn.textContent = 'Play Motion';
      el.playBtn.classList.add('primary');
      el.playBtn.classList.remove('secondary');
      cancelAnimationFrame(state.animId);
    }
  }

  function runAnimation() {
    if (!state.isPlaying) return;
    stepDays(state.speedStep);
    state.animId = requestAnimationFrame(() => {
      setTimeout(runAnimation, 100);
    });
  }

  function resizeCanvas() {
    const rect = el.canvas.parentElement.getBoundingClientRect();
    el.canvas.width = rect.width * window.devicePixelRatio;
    el.canvas.height = rect.height * window.devicePixelRatio;
    const ctx = el.canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    updateApp();
  }

  // Astronomical Calculations
  function getJulianDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function calculateEphemeris(date) {
    const jd = getJulianDate(date);
    const d = jd - 2451545.0; // days since J2000.0

    const positions = {};

    PLANETS.forEach(planet => {
      // Approximate mean longitude
      let l0;
      if (planet.id === 'sun') {
        l0 = 280.466 + 0.9856474 * d;
      } else if (planet.id === 'moon') {
        l0 = 218.316 + 13.176396 * d;
      } else {
        // generic Keplerian approximation
        l0 = (280.4 + (360 / planet.period) * d) % 360;
      }

      let longitude = (l0 % 360 + 360) % 360;
      let signIndex = Math.floor(longitude / 30);
      let degInSign = longitude % 30;

      positions[planet.id] = {
        ...planet,
        longitude,
        sign: ZODIAC_SIGNS[signIndex],
        degInSign
      };
    });

    // Calculate Ascendant (approximate based on LST and Latitude)
    const gmst = (280.46061837 + 360.98564736629 * d) % 360;
    const lst = (gmst + state.lon + 360) % 360;
    const ascendant = (lst + 90) % 360; // simplified approximation
    const ascSignIndex = Math.floor(ascendant / 30);

    return {
      jd,
      lst,
      positions,
      ascendant: {
        longitude: ascendant,
        sign: ZODIAC_SIGNS[ascSignIndex],
        degInSign: ascendant % 30
      }
    };
  }

  // Aspect Detection
  function calculateAspects(positions) {
    const aspectTypes = [
      { name: 'Conjunction', angle: 0, orb: 8, color: '#fbbf24' },
      { name: 'Opposition', angle: 180, orb: 8, color: '#f43f5e' },
      { name: 'Trine', angle: 120, orb: 6, color: '#34d399' },
      { name: 'Square', angle: 90, orb: 6, color: '#f87171' },
      { name: 'Sextile', angle: 60, orb: 5, color: '#38bdf8' }
    ];

    const keys = Object.keys(positions);
    const detected = [];

    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const p1 = positions[keys[i]];
        const p2 = positions[keys[j]];
        let diff = Math.abs(p1.longitude - p2.longitude);
        if (diff > 180) diff = 360 - diff;

        for (const asp of aspectTypes) {
          const orbVal = Math.abs(diff - asp.angle);
          if (orbVal <= asp.orb) {
            detected.push({
              p1: p1.name,
              p2: p2.name,
              p1Obj: p1,
              p2Obj: p2,
              type: asp.name,
              exactDiff: diff,
              orb: orbVal.toFixed(1),
              color: asp.color
            });
            break;
          }
        }
      }
    }
    return detected;
  }

  // Render Engine
  function updateApp() {
    const eph = calculateEphemeris(state.date);
    const aspects = calculateAspects(eph.positions);

    // Update Summary cards
    el.sumSun.textContent = `${eph.positions.sun.sign.symbol} ${eph.positions.sun.sign.name} ${eph.positions.sun.degInSign.toFixed(1)}\u00b0`;
    el.sumMoon.textContent = `${eph.positions.moon.sign.symbol} ${eph.positions.moon.sign.name} ${eph.positions.moon.degInSign.toFixed(1)}\u00b0`;
    el.sumAsc.textContent = `${eph.ascendant.sign.symbol} ${eph.ascendant.sign.name} ${eph.ascendant.degInSign.toFixed(1)}\u00b0`;
    el.sumAspects.textContent = `${aspects.length} detected`;

    // Update Ephemeris list
    el.ephemerisList.innerHTML = '';
    Object.values(eph.positions).forEach(p => {
      const item = document.createElement('div');
      item.className = 'data-item';
      item.innerHTML = `
        <div>
          <span class="name" style="color: ${p.color}">${p.symbol} ${p.name}</span>
        </div>
        <div class="val">${p.sign.symbol} ${p.sign.name} ${p.degInSign.toFixed(1)}\u00b0</div>
      `;
      el.ephemerisList.appendChild(item);
    });

    // Update Aspects list
    el.aspectsList.innerHTML = '';
    if (aspects.length === 0) {
      el.aspectsList.innerHTML = '<div class="data-item"><span class="val">No active major aspects for this timestamp.</span></div>';
    } else {
      aspects.forEach(a => {
        const item = document.createElement('div');
        item.className = 'data-item';
        item.innerHTML = `
          <div>
            <span class="name">${a.p1} &mdash; ${a.p2}</span>
            <div class="val" style="color: ${a.color}">${a.type}</div>
          </div>
          <div class="val">Orb: ${a.orb}\u00b0</div>
        `;
        el.aspectsList.appendChild(item);
      });
    }

    // Update Almanac
    el.infoJd.textContent = eph.jd.toFixed(4);
    el.infoLst.textContent = `${eph.lst.toFixed(2)}\u00b0`;
    const month = state.date.getUTCMonth();
    const season = (month >= 2 && month <= 4) ? 'Spring (Vernal)' :
                   (month >= 5 && month <= 7) ? 'Summer' :
                   (month >= 8 && month <= 10) ? 'Autumn' : 'Winter';
    el.infoSeason.textContent = season;

    // Moon Phase calculation
    const moonSunDiff = (eph.positions.moon.longitude - eph.positions.sun.longitude + 360) % 360;
    const phasePercent = (1 - Math.cos(moonSunDiff * Math.PI / 180)) / 2;
    const phaseName = moonSunDiff < 15 ? 'New Moon' :
                      moonSunDiff < 90 ? 'Waxing Crescent' :
                      moonSunDiff < 105 ? 'First Quarter' :
                      moonSunDiff < 180 ? 'Waxing Gibbous' :
                      moonSunDiff < 195 ? 'Full Moon' :
                      moonSunDiff < 270 ? 'Waning Gibbous' :
                      moonSunDiff < 285 ? 'Last Quarter' : 'Waning Crescent';
    el.infoPhase.textContent = `${phaseName} (${(phasePercent * 100).toFixed(0)}%)`;

    // Render Moon Phase visual icon
    el.moonPhaseVisual.style.background = `linear-gradient(90deg, #111 ${100 - phasePercent * 100}%, #e2e8f0 100%)`;

    // Render Canvas
    renderCanvas(eph, aspects);
  }

  function renderCanvas(eph, aspects) {
    const canvas = el.canvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 50;

    if (state.viewMode === 'chart') {
      renderNatalChart(ctx, centerX, centerY, radius, eph, aspects);
    } else {
      renderCelestialSphere(ctx, centerX, centerY, radius, eph);
    }
  }

  function renderNatalChart(ctx, cx, cy, r, eph, aspects) {
    // 1. Draw Zodiac Wheel
    if (state.layers.zodiac) {
      const ringWidth = 35;
      const outerR = r;
      const innerR = r - ringWidth;

      ZODIAC_SIGNS.forEach((sign, i) => {
        const startAngle = (sign.start - 90) * Math.PI / 180;
        const endAngle = ((sign.start + 30) - 90) * Math.PI / 180;

        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? '#1a253f' : '#131c2e';
        ctx.fill();
        ctx.strokeStyle = '#2a3b5c';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Sign Symbol
        const midAngle = startAngle + Math.PI / 180 * 15;
        const textR = outerR - ringWidth / 2;
        const tx = cx + Math.cos(midAngle) * textR;
        const ty = cy + Math.sin(midAngle) * textR;

        ctx.save();
        ctx.translate(tx, ty);
        ctx.fillStyle = sign.color;
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sign.symbol, 0, 0);
        ctx.restore();
      });
    }

    // 2. Draw Houses Wheel
    if (state.layers.houses) {
      const houseR = r - 35;
      const innerHouseR = houseR - 100;
      const ascAngle = eph.ascendant.longitude;

      for (let i = 0; i < 12; i++) {
        const houseAngle = (ascAngle + i * 30 - 90) * Math.PI / 180;
        const x = cx + Math.cos(houseAngle) * innerHouseR;
        const y = cy + Math.sin(houseAngle) * innerHouseR;
        const ox = cx + Math.cos(houseAngle) * houseR;
        const oy = cy + Math.sin(houseAngle) * houseR;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ox, oy);
        ctx.strokeStyle = i === 0 ? '#fbbf24' : '#2a3b5c';
        ctx.lineWidth = i === 0 ? 2 : 1;
        ctx.stroke();

        // House number
        const midAngle = houseAngle + Math.PI / 180 * 15;
        const hx = cx + Math.cos(midAngle) * (innerHouseR + 15);
        const hy = cy + Math.sin(midAngle) * (innerHouseR + 15);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i + 1, hx, hy);
      }

      // Inner Chart Border
      ctx.beginPath();
      ctx.arc(cx, cy, innerHouseR, 0, Math.PI * 2);
      ctx.strokeStyle = '#2a3b5c';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 3. Draw Aspect lines
    if (state.layers.aspects && aspects.length > 0) {
      const innerHouseR = r - 135;
      aspects.forEach(asp => {
        const a1 = (asp.p1Obj.longitude - 90) * Math.PI / 180;
        const a2 = (asp.p2Obj.longitude - 90) * Math.PI / 180;

        const x1 = cx + Math.cos(a1) * innerHouseR;
        const y1 = cy + Math.sin(a1) * innerHouseR;
        const x2 = cx + Math.cos(a2) * innerHouseR;
        const y2 = cy + Math.sin(a2) * innerHouseR;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = asp.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });
    }

    // 4. Draw Planets
    const planetR = r - 110;
    Object.values(eph.positions).forEach(p => {
      const angle = (p.longitude - 90) * Math.PI / 180;
      const px = cx + Math.cos(angle) * planetR;
      const py = cy + Math.sin(angle) * planetR;

      // Planet node marker
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#131c2e';
      ctx.fill();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = p.color;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.symbol, px, py);
    });
  }

  function renderCelestialSphere(ctx, cx, cy, r, eph) {
    // Draw Celestial Grid & Horizon background
    if (state.layers.grid) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#2a3b5c';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Meridian and Equator axes
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.strokeStyle = 'rgba(42, 59, 92, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Simulated Constellation background links
    if (state.layers.constellations) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      const keys = Object.keys(eph.positions);
      for (let i = 0; i < keys.length - 1; i++) {
        const p1 = eph.positions[keys[i]];
        const p2 = eph.positions[keys[i + 1]];
        const a1 = (p1.longitude - 90) * Math.PI / 180;
        const a2 = (p2.longitude - 90) * Math.PI / 180;
        const x1 = cx + Math.cos(a1) * (r * 0.7);
        const y1 = cy + Math.sin(a1) * (r * 0.7);
        const x2 = cx + Math.cos(a2) * (r * 0.7);
        const y2 = cy + Math.sin(a2) * (r * 0.7);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Draw Planets on Sphere
    Object.values(eph.positions).forEach(p => {
      const angle = (p.longitude - 90) * Math.PI / 180;
      const dist = r * 0.75;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(` ${p.symbol} ${p.name}`, px + 8, py);
    });
  }

  // Run on load
  document.addEventListener('DOMContentLoaded', () => {
    initControls();
    updateApp();
  });

})();
