/* ============================================================
   PLAN YOUR TRIP INDIA — Complete JavaScript
   AI Chatbot · Clickable India Map · Light/Dark Theme
   ============================================================ */

// ─── STATE ──────────────────────────────────────────────────────
let travelerCount = 2;
let currentCityKey = '';
let currentStateClicked = '';
let indiaMapInstance = null;
let stateLayer = null;
let deferredInstallPrompt = null;

// chatHistory holds only live conversation turns.
// System prompt is handled by the backend proxy.
let chatHistory = [];

// ─── CURRENT LOCATION ────────────────────────────────────────────
function useCurrentLocation() {
    const btn = document.getElementById('useLocationBtn');
    const btnText = document.getElementById('locationBtnText');
    const fromInput = document.getElementById('wizFromInput');

    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser.', 'error');
        return;
    }

    btn.classList.add('loading');
    btnText.textContent = 'Detecting...';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`
                );
                const data = await res.json();
                const addr = data.address || {};
                const city = addr.city
                    || addr.town
                    || addr.municipality
                    || addr.village
                    || addr.suburb
                    || addr.county
                    || '';

                if (city) {
                    fromInput.value = city;
                    showToast(`📍 From set to: ${city}`, 'success');
                } else {
                    fromInput.value = '';
                    showToast('📍 Could not detect city. Please type it manually.', 'error');
                }
            } catch (e) {
                fromInput.value = '';
                showToast('📍 Location error. Please type your city.', 'error');
            }
            btn.classList.remove('loading');
            btnText.textContent = '✓ City Detected';
            setTimeout(() => { btnText.textContent = '📍 Detect My City (sets From)'; }, 3000);
        },
        (err) => {
            btn.classList.remove('loading');
            btnText.textContent = '📍 Detect My City (sets From)';
            const msgs = {
                1: 'Location access denied. Please allow location in your browser.',
                2: 'Unable to detect location. Check GPS/network.',
                3: 'Location request timed out. Please try again.'
            };
            showToast(msgs[err.code] || 'Could not get location.', 'error');
        },
        { timeout: 10000, enableHighAccuracy: false }
    );
}


const CITY_DATA = {
    jaipur: {
        name: 'Jaipur', badge: 'Rajasthan', tagline: 'The Pink City – Palaces, Forts & Royal Heritage',
        img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&q=80',
        famous: ['Amber Fort', 'City Palace', 'Hawa Mahal', 'Jantar Mantar', 'Nahargarh Fort'],
        food: [{ name: 'Pyaaz Kachori', price: '₹20' }, { name: 'Dal Baati Churma', price: '₹80' }, { name: 'Laal Maas', price: '₹200' }, { name: 'Ghewar', price: '₹60' }, { name: 'Mawa Kachori', price: '₹30' }],
        hidden: ['Panna Meena ka Kund', 'Sisodia Rani Garden', 'Khole ke Hanuman Ji', 'Sanganer Village', 'Galtaji Temple'],
        hotels: ['Rambagh Palace (Luxury)', 'Hotel Pearl Palace (Budget)', 'Jai Mahal Palace (Heritage)', 'Zostel Jaipur (Backpacker)'],
        tips: 'Visit forts early morning to avoid crowds. Hire a local guide for ₹500.',
        per_day: { budget: 1100, normal: 2900, luxury: 8700 }
    },
    goa: {
        name: 'Goa', badge: 'Beach', tagline: 'Sun, Sand & Portuguese Charm on India\'s Coast',
        img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=80',
        famous: ['Baga Beach', 'Basilica of Bom Jesus', 'Fort Aguada', 'Anjuna Beach', 'Calangute Beach'],
        food: [{ name: 'Prawn Balchão', price: '₹150' }, { name: 'Bebinca Dessert', price: '₹60' }, { name: 'Goan Fish Curry', price: '₹200' }, { name: 'Cafreal Chicken', price: '₹180' }],
        hidden: ['Butterfly Beach', 'Arambol Sweet Lake', 'Divar Island', 'Cabo de Rama Fort', 'Chorla Ghats'],
        hotels: ['Taj Exotica (Luxury)', 'Zostel Goa (Budget)', 'La Maison Fontaine (Boutique)', 'Backpacker Panda Calangute'],
        tips: 'North Goa for parties, South Goa for peace. Rent a scooter for ₹300/day.',
        per_day: { budget: 1550, normal: 4200, luxury: 10500 }
    },
    manali: {
        name: 'Manali', badge: 'Mountains', tagline: 'Snow-Capped Peaks, Rivers & Adventure Awaits',
        img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&q=80',
        famous: ['Rohtang Pass', 'Solang Valley', 'Hadimba Temple', 'Beas River', 'Mall Road'],
        food: [{ name: 'Siddu (Local Bread)', price: '₹50' }, { name: 'Trout Fish Fry', price: '₹250' }, { name: 'Aktori Pancake', price: '₹40' }, { name: 'Dham Feast', price: '₹120' }],
        hidden: ['Naggar Castle', 'Great Himalayan National Park', 'Chandrakhani Pass', 'Bijli Mahadev', 'Malana Village'],
        hotels: ['Span Resort (Luxury)', 'Zostel Manali (Budget)', 'Johnson Lodge (Mid-range)', 'Snow Valley Resorts'],
        tips: 'Carry warm clothes even in summer. Book Rohtang Pass permits online 24hrs in advance.',
        per_day: { budget: 1400, normal: 3500, luxury: 8800 }
    },
    varanasi: {
        name: 'Varanasi', badge: 'Spiritual', tagline: 'The Oldest Living City – Ghats, Temples & Ganga',
        img: 'https://images.unsplash.com/photo-1561361058-c24e01238a46?w=1200&q=80',
        famous: ['Dashashwamedh Ghat', 'Kashi Vishwanath Temple', 'Sarnath', 'Manikarnika Ghat', 'Assi Ghat'],
        food: [{ name: 'Kachori Sabzi', price: '₹30' }, { name: 'Banarasi Paan', price: '₹20' }, { name: 'Thandai', price: '₹50' }, { name: 'Tamatar Chaat', price: '₹40' }, { name: 'Malaiyo', price: '₹30' }],
        hidden: ['Lalita Ghat', 'Scindia Ghat', 'Tulsi Manas Temple', 'Ramnagar Fort', 'Banaras Ghats at Dawn'],
        hotels: ['BrijRama Palace (Heritage)', 'Stops Hostel (Budget)', 'Hotel Surya (Mid-range)', 'Ganges View Hotel'],
        tips: 'Wake up for sunrise boat ride on Ganga (₹200). Ganga Aarti at 7pm is unmissable.',
        per_day: { budget: 950, normal: 2550, luxury: 6500 }
    },
    kerala: {
        name: 'Kerala', badge: 'Nature', tagline: 'God\'s Own Country – Backwaters, Spice & Serenity',
        img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80',
        famous: ['Alleppey Backwaters', 'Munnar Tea Gardens', 'Kovalam Beach', 'Periyar Wildlife Sanctuary', 'Varkala Cliff'],
        food: [{ name: 'Appam & Stew', price: '₹80' }, { name: 'Kerala Sadya', price: '₹150' }, { name: 'Karimeen Pollichathu', price: '₹300' }, { name: 'Puttu & Kadala', price: '₹60' }, { name: 'Pazham Pori', price: '₹20' }],
        hidden: ['Gavi Eco Forest', 'Bekal Fort', 'Thenmala Eco Tourism', 'Athirapally Waterfalls', 'Wayanad Hills'],
        hotels: ['Kumarakom Lake Resort (Luxury)', 'Zostel Varkala (Budget)', 'Philipkutty Farm (Boutique)', 'EarthHome Stays'],
        tips: 'Houseboat stay in Alleppey is a must-do (from ₹6000/night). Oct–Feb is peak season.',
        per_day: { budget: 1400, normal: 3850, luxury: 10000 }
    },
    ladakh: {
        name: 'Ladakh', badge: 'High Altitude', tagline: 'Moonscapes, Monasteries & Cosmic Landscapes',
        img: 'https://images.unsplash.com/photo-1604537529428-15bcbeecfe4d?w=1200&q=80',
        famous: ['Pangong Lake', 'Nubra Valley', 'Leh Palace', 'Magnetic Hill', 'Hemis Monastery'],
        food: [{ name: 'Thukpa Noodle Soup', price: '₹80' }, { name: 'Skyu Pasta', price: '₹70' }, { name: 'Butter Tea', price: '₹30' }, { name: 'Tsampa Porridge', price: '₹50' }, { name: 'Steamed Momos', price: '₹60' }],
        hidden: ['Tso Moriri Lake', 'Zanskar Valley', 'Dah Hanu Village', 'Phugtal Monastery', 'Hanle Dark Sky Reserve'],
        hotels: ['Grand Dragon Ladakh (Luxury)', 'Zostel Leh (Budget)', 'Stok Palace Heritage (Heritage)', 'The Indus Valley'],
        tips: 'Acclimatize 2 days in Leh before excursions. Carry cash — ATMs are unreliable above 3500m.',
        per_day: { budget: 1900, normal: 4700, luxury: 12000 }
    }
};

// ─── STATE FLAGS / EMOJIS ───────────────────────────────────────
const STATE_FLAGS = {
    'Rajasthan': '🏜️', 'Maharashtra': '🌆', 'Tamil Nadu': '🏛️',
    'Kerala': '🌴', 'Goa': '🏖️', 'Himachal Pradesh': '🏔️',
    'Uttarakhand': '⛰️', 'Jammu & Kashmir': '❄️', 'Ladakh': '🌌',
    'Punjab': '🌾', 'Haryana': '🌾', 'Delhi': '🕌',
    'Uttar Pradesh': '🛕', 'Bihar': '🪷', 'West Bengal': '🐯',
    'Odisha': '🌊', 'Andhra Pradesh': '🌶️', 'Telangana': '💎',
    'Karnataka': '🌳', 'Gujarat': '🦁', 'Madhya Pradesh': '🐆',
    'Chhattisgarh': '🌿', 'Jharkhand': '⛏️', 'Assam': '🍵',
    'Meghalaya': '🌧️', 'Sikkim': '🏔️', 'Arunachal Pradesh': '🦅',
    'Manipur': '💃', 'Mizoram': '🌸', 'Nagaland': '🎭',
    'Tripura': '🏯', 'Andaman and Nicobar': '🐢', 'Lakshadweep': '🪸',
    'Chandigarh': '🏙️', 'Puducherry': '⛵'
};

// ─── WELCOME OVERLAY ────────────────────────────────────────────
const WELCOME_GREETINGS = [
    { word: 'Namaste', lang: 'Hindi · नमस्ते' },
    { word: 'Kem Cho', lang: 'Gujarati · કેમ છો' },
    { word: 'Vanakkam', lang: 'Tamil · வணக்கம்' },
    { word: 'Namaskar', lang: 'Marathi · नमस्कार' },
    { word: 'Sat Sri Akal', lang: 'Punjabi · ਸਤ ਸ੍ਰੀ ਅਕਾਲ' },
    { word: 'Nomoshkar', lang: 'Bengali · নমস্কার' },
    { word: 'Marhaba', lang: 'Urdu · مرحبا' },
];

function initWelcomeOverlay() {
    const overlay = document.getElementById('welcomeOverlay');
    const wordEl = document.getElementById('welcomeWord');
    const langEl = document.getElementById('welcomeLang');
    const dotsEl = document.getElementById('welcomeDots');
    if (!overlay) return;

    WELCOME_GREETINGS.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'welcome-dot' + (i === 0 ? ' active' : '');
        dotsEl.appendChild(dot);
    });

    let idx = 0;
    const dots = dotsEl.querySelectorAll('.welcome-dot');

    function showGreeting(i) {
        const g = WELCOME_GREETINGS[i];
        wordEl.textContent = g.word;
        langEl.textContent = g.lang;
        wordEl.style.animation = 'none';
        langEl.style.animation = 'none';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                wordEl.style.animation = 'welcomeFadeSlide 1.3s ease forwards';
                langEl.style.animation = 'welcomeFadeSlide 1.3s ease forwards';
            });
        });
        dots.forEach((d, di) => d.classList.toggle('active', di === i));
    }

    showGreeting(0);

    const interval = setInterval(() => {
        idx++;
        if (idx >= WELCOME_GREETINGS.length) {
            clearInterval(interval);
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.pointerEvents = 'none';
                const loader = document.getElementById('loader');
                if (loader) {
                    loader.classList.add('active');
                    setTimeout(() => {
                        loader.classList.remove('active');
                        loader.classList.add('hidden');
                        loader.style.pointerEvents = 'none';
                        loader.style.display = 'none';
                        initScrollReveal();
                        initGreeting();
                        initIndiaMap();
                    }, 1800);
                }
            }, 400);
            return;
        }
        showGreeting(idx);
    }, 1400);
}

// ─── LOADER ─────────────────────────────────────────────────────
window.addEventListener('load', () => {
    initWelcomeOverlay();
});

function initGreeting() {
    const hour = new Date().getHours();
    let g = 'Namaste 🙏';
    if (hour < 12) g = 'Good Morning 🌅';
    else if (hour < 17) g = 'Good Afternoon ☀️';
    else if (hour < 20) g = 'Good Evening 🌇';
    const el = document.getElementById('greetingText');
    if (el) el.textContent = g;
}

// ─── THEME TOGGLE ─────────────────────────────────────────────
function getThemeIcon(theme) {
    return theme === 'dark' ? '🌙' : '🌊';
}

function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('pyti_theme', next);
}

(function initTheme() {
    const saved = localStorage.getItem('pyti_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
})();

// ─── NAVBAR ─────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveNav();
});

function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-link');
    let current = '';
    sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
}

// ─── MOBILE NAV OVERLAY ─────────────────────────────────────────
(function setupMobileNav() {
    const hamburger = document.getElementById('hamburger');
    if (!hamburger) return;

    const overlay = document.createElement('div');
    overlay.className = 'nav-mobile-overlay';
    overlay.id = 'navMobileOverlay';
    overlay.innerHTML = `
    <a href="#home"      class="nav-link" data-close>Home</a>
    <a href="#india-map" class="nav-link" data-close>India Map</a>
    <a href="#places"    class="nav-link" data-close>Places</a>
    <a href="#all-cities" class="nav-link" data-close>All Cities</a>
    <a href="#planner"   class="nav-link" data-close>AI Planner</a>
    <a href="#about"     class="nav-link" data-close>About</a>
    <a href="#contact"   class="nav-link" data-close>Contact</a>
    <div class="nav-mobile-divider"></div>
    <div class="nav-mobile-auth" id="mobileAuthBtns">
      <button class="btn-nav-login" id="mobLoginBtn">Login</button>
      <button class="btn-nav-signup" id="mobSignupBtn">Sign Up ✦</button>
    </div>
  `;
    document.body.appendChild(overlay);

    function openNav() {
        hamburger.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (window.updateMobileAuthUI) window.updateMobileAuthUI();
    }
    function closeNav() {
        hamburger.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
        overlay.classList.contains('open') ? closeNav() : openNav();
    });

    overlay.querySelectorAll('[data-close]').forEach(el => {
        el.addEventListener('click', closeNav);
    });

    overlay.addEventListener('click', e => {
        const t = e.target;
        if (t.id === 'mobLoginBtn') { closeNav(); openModal('loginModal'); }
        if (t.id === 'mobSignupBtn') { closeNav(); openModal('signupModal'); }
        if (t.dataset.logout !== undefined) { closeNav(); logoutUser(); }
    });

    window.updateMobileAuthUI = function () {
        const area = document.getElementById('mobileAuthBtns');
        if (!area) return;
        if (currentUser) {
            const initials = ((currentUser.first || '?')[0] + (currentUser.last || '?')[0]).toUpperCase();
            area.innerHTML = `
        <div class="nav-user-badge" style="justify-content:center;gap:.6rem">
          <div class="nav-user-avatar">${initials}</div>
          <span>${currentUser.first}</span>
          <button data-logout style="background:none;border:none;color:var(--text-dim);font-size:.82rem;cursor:pointer;margin-left:.3rem">↩ Out</button>
        </div>`;
        } else {
            area.innerHTML = `
        <button class="btn-nav-login" id="mobLoginBtn">Login</button>
        <button class="btn-nav-signup" id="mobSignupBtn">Sign Up ✦</button>`;
        }
    };

    document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', closeNav));

    window.closeMobileNav = closeNav;
    window.openMobileNav = openNav;
})();

// ─── SCROLL REVEAL ──────────────────────────────────────────────
function initScrollReveal() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ─── INDIA MAP ─────────────────────────────────────────────────
function initIndiaMap() {
    // SVG map is initialized inline in index.html
}

async function onStateClick(stateName) {
    if (!stateName) return;
    currentStateClicked = stateName;

    document.getElementById('mapPanelDefault').style.display = 'none';
    document.getElementById('mapPanelResult').style.display = 'flex';
    document.getElementById('mapStateFlag').textContent = STATE_FLAGS[stateName] || '🗺️';
    document.getElementById('mapStateName').textContent = stateName;
    document.getElementById('mapStateTagline').textContent = 'Getting AI recommendations...';
    document.getElementById('mapResultLoading').style.display = 'block';
    document.getElementById('mapResultContent').style.display = 'none';
    document.getElementById('mapResultActions').style.display = 'none';

    const prompt = `Give me a concise travel overview of ${stateName}, India. Format exactly like this:

📍 QUICK FACTS
• Capital: [city]
• Best season: [months]
• Known for: [2-3 things]

🌟 TOP 3 MUST-VISIT PLACES
• [Place 1] — [one line why]
• [Place 2] — [one line why]
• [Place 3] — [one line why]

🍽️ LOCAL FOOD TO TRY
• [Food 1], [Food 2], [Food 3]

💡 TRAVELLER TIP
[One practical tip for visiting ${stateName}]

Keep it under 180 words total.`;

    try {
        const response = await callGroqAI([{ role: 'user', content: prompt }]);
        document.getElementById('mapResultLoading').style.display = 'none';
        document.getElementById('mapResultContent').style.display = 'block';
        document.getElementById('mapResultContent').textContent = response;
        document.getElementById('mapResultActions').style.display = 'flex';
        document.getElementById('mapStateTagline').textContent = `Explore ${stateName}`;
    } catch (err) {
        document.getElementById('mapResultLoading').style.display = 'none';
        document.getElementById('mapResultContent').style.display = 'block';
        document.getElementById('mapResultContent').textContent = `Could not load AI info for ${stateName}. Please check your connection and try again.`;
    }
}

function triggerStateAI(stateName) {
    onStateClick(stateName);
}

function chatAboutState() {
    openChat();
    setTimeout(() => {
        const msg = `Tell me more about travelling in ${currentStateClicked}, India — best hidden gems, visa-free zones, must-try local experiences and a suggested 5-day itinerary.`;
        document.getElementById('chatInput').value = msg;
        sendMessage();
    }, 300);
}

function planThisState() {
    wizSelectDest(currentStateClicked);
    document.getElementById('planner').scrollIntoView({ behavior: 'smooth' });
}

// ─── WIZARD STATE ────────────────────────────────────────────────
let wizCurrentStep = 1;
const WIZ_TOTAL = 6;
const wizState = {
    from: '',
    destination: '',
    dateFrom: '',
    dateTo: '',
    duration: 0,
    styles: [],
    adults: 2,
    children: 0,
    budget: 'normal',
    customBudget: 0,
    accom: ['Resort'],
    food: '',
    diet: []
};

function wizNextStep() {
    if (!wizValidate(wizCurrentStep)) return;
    if (wizCurrentStep === WIZ_TOTAL) { wizGeneratePlan(); return; }

    const curItem = document.getElementById('wizStep' + wizCurrentStep);
    curItem.classList.remove('active');
    curItem.classList.add('completed');
    curItem.querySelector('.wiz-step-circle').innerHTML = '✓';
    document.getElementById('wizPanel' + wizCurrentStep).classList.remove('active');

    wizCurrentStep++;
    document.getElementById('wizStep' + wizCurrentStep).classList.add('active');
    document.getElementById('wizPanel' + wizCurrentStep).classList.add('active');

    document.getElementById('wizBackBtn').disabled = false;
    document.getElementById('wizStepCount').textContent = `Step ${wizCurrentStep} of ${WIZ_TOTAL}`;
    document.getElementById('wizNextBtnText').textContent = wizCurrentStep === WIZ_TOTAL ? 'Generate Plan ✦' : 'Continue';

    if (wizCurrentStep === WIZ_TOTAL) wizPopulateSummary();
    document.getElementById('wizardCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function wizPrevStep() {
    if (wizCurrentStep === 1) return;
    document.getElementById('wizPanel' + wizCurrentStep).classList.remove('active');
    document.getElementById('wizStep' + wizCurrentStep).classList.remove('active');

    wizCurrentStep--;
    document.getElementById('wizPanel' + wizCurrentStep).classList.add('active');
    const item = document.getElementById('wizStep' + wizCurrentStep);
    item.classList.remove('completed');
    item.classList.add('active');
    item.querySelector('.wiz-step-circle').innerHTML = wizCurrentStep;

    document.getElementById('wizBackBtn').disabled = (wizCurrentStep === 1);
    document.getElementById('wizStepCount').textContent = `Step ${wizCurrentStep} of ${WIZ_TOTAL}`;
    document.getElementById('wizNextBtnText').textContent = 'Continue';
}

function wizValidate(step) {
    if (step === 1) {
        const dest = document.getElementById('wizDestInput')?.value?.trim() || '';
        wizState.destination = dest;
        wizState.from = document.getElementById('wizFromInput')?.value?.trim() || '';
        if (!dest) {
            showToast('📍 Please enter where you want to go!');
            document.getElementById('wizDestInput').focus();
            return false;
        }
    }
    if (step === 2) {
        if (!wizState.dateFrom || !wizState.dateTo) {
            showToast('📅 Please select both departure and return dates');
            return false;
        }
        if (new Date(wizState.dateFrom) >= new Date(wizState.dateTo)) {
            showToast('📅 Return date must be after departure date');
            return false;
        }
    }
    return true;
}

function wizSwapRoutes() {
    const fromEl = document.getElementById('wizFromInput');
    const toEl = document.getElementById('wizDestInput');
    if (!fromEl || !toEl) return;
    const tmp = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = tmp;
    wizState.from = fromEl.value;
    wizState.destination = toEl.value;
}

function wizSelectDest(name) {
    wizState.destination = name;
    const inp = document.getElementById('wizDestInput');
    if (inp) inp.value = name;
    document.querySelectorAll('#wizDestChips .wiz-chip').forEach(c => {
        c.classList.toggle('selected', c.textContent.trim().includes(name));
    });
}

function wizFilterChips(val) {
    wizState.destination = val;
    document.querySelectorAll('#wizDestChips .wiz-chip').forEach(c => {
        const name = c.textContent.replace(/^[\u{1F000}-\u{1FFFF}]|\s*/gu, '').trim();
        c.style.display = (!val || name.toLowerCase().includes(val.toLowerCase())) ? '' : 'none';
    });
}

function wizCalcDuration() {
    const f = document.getElementById('wizDateFrom').value;
    const t = document.getElementById('wizDateTo').value;
    wizState.dateFrom = f; wizState.dateTo = t;
    if (f && t) {
        const days = Math.round((new Date(t) - new Date(f)) / 86400000);
        if (days > 0) {
            wizState.duration = days;
            document.getElementById('wizDurationBadge').textContent =
                `🗺️ ${days} day${days > 1 ? 's' : ''} trip · ${wizFmtDate(f)} → ${wizFmtDate(t)}`;
        } else {
            document.getElementById('wizDurationBadge').textContent = '⚠️ Return date must be after departure';
        }
    }
}

function wizFmtDate(str) {
    return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function wizSetDuration(days) {
    const from = new Date(); from.setDate(from.getDate() + 7);
    const to = new Date(from); to.setDate(from.getDate() + days);
    const fStr = from.toISOString().split('T')[0];
    const tStr = to.toISOString().split('T')[0];
    document.getElementById('wizDateFrom').value = fStr;
    document.getElementById('wizDateTo').value = tStr;
    wizState.dateFrom = fStr; wizState.dateTo = tStr; wizState.duration = days;
    document.getElementById('wizDurationBadge').textContent =
        `🗺️ ${days} day${days > 1 ? 's' : ''} trip · ${wizFmtDate(fStr)} → ${wizFmtDate(tStr)}`;
}

function wizToggleChip(el, group) {
    el.classList.toggle('selected');
    const name = el.textContent.replace(/^\S+\s*/, '').trim();
    if (group === 'style') {
        wizState.styles = el.classList.contains('selected')
            ? [...new Set([...wizState.styles, name])]
            : wizState.styles.filter(s => s !== name);
    } else if (group === 'diet') {
        wizState.diet = el.classList.contains('selected')
            ? [...new Set([...wizState.diet, name])]
            : wizState.diet.filter(s => s !== name);
    } else {
        wizState.accom = el.classList.contains('selected')
            ? [...new Set([...wizState.accom, name])]
            : wizState.accom.filter(s => s !== name);
    }
}

function wizChangeTrav(type, delta) {
    if (type === 'adults') {
        wizState.adults = Math.max(1, wizState.adults + delta);
        document.getElementById('wizAdultsCount').textContent = wizState.adults;
        document.getElementById('wizAdultsDown').disabled = (wizState.adults <= 1);
    } else {
        wizState.children = Math.max(0, wizState.children + delta);
        document.getElementById('wizChildCount').textContent = wizState.children;
        document.getElementById('wizChildDown').disabled = (wizState.children <= 0);
    }
}

function wizSelectBudget(el, val) {
    document.querySelectorAll('.wiz-budget-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    wizState.budget = val;
    wizState.customBudget = 0;
    const inp = document.getElementById('wizCustomBudget');
    if (inp) inp.value = '';
    const note = document.getElementById('wizCustomBudgetNote');
    if (note) note.textContent = '';
}

function wizSetCustomBudget(val) {
    const amount = parseInt(val, 10);
    const note = document.getElementById('wizCustomBudgetNote');
    if (!amount || amount < 500) {
        wizState.customBudget = 0;
        if (note) note.textContent = '';
        return;
    }
    wizState.customBudget = amount;
    document.querySelectorAll('.wiz-budget-card').forEach(c => c.classList.remove('selected'));
    if (amount < 15000) wizState.budget = 'budget';
    else if (amount < 40000) wizState.budget = 'normal';
    else wizState.budget = 'luxury';
    if (note) note.textContent = `✓ Custom budget set: ₹${amount.toLocaleString('en-IN')} per person`;
}

function wizSelectFood(el, val) {
    document.querySelectorAll('.wiz-food-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    wizState.food = val;
}

function wizPopulateSummary() {
    const fromCity = document.getElementById('wizFromInput')?.value?.trim() || wizState.from || '—';
    wizState.from = fromCity;
    const destVal = document.getElementById('wizDestInput')?.value?.trim() || wizState.destination || '—';
    wizState.destination = destVal;

    const routeText = fromCity && fromCity !== '—'
        ? `${fromCity} → ${destVal}`
        : destVal;
    document.getElementById('wizSumDest').textContent = routeText;
    document.getElementById('wizSumDuration').textContent = wizState.duration
        ? `${wizState.duration} days · ${wizFmtDate(wizState.dateFrom)} to ${wizFmtDate(wizState.dateTo)}`
        : '—';
    document.getElementById('wizSumTravelers').textContent =
        `${wizState.adults} adult${wizState.adults > 1 ? 's' : ''}${wizState.children ? ` + ${wizState.children} child${wizState.children > 1 ? 'ren' : ''}` : ''}`;
    const bl = { budget: '🎒 Budget (₹5k–₹15k)', normal: '✈️ Mid-Range (₹15k–₹40k)', luxury: '👑 Luxury (₹40k+)' };
    const budgetText = wizState.customBudget
        ? `✏️ Custom — ₹${wizState.customBudget.toLocaleString('en-IN')} per person`
        : (bl[wizState.budget] || '—');
    document.getElementById('wizSumBudget').textContent = budgetText;
    document.getElementById('wizSumStyle').textContent = wizState.styles.length ? wizState.styles.join(' · ') : 'Not specified';
    const foodLabels = { veg: '🥗 Vegetarian', both: '🍱 Both / No Preference' };
    let foodText = foodLabels[wizState.food] || '—';
    if (wizState.diet && wizState.diet.length) foodText += ' · ' + wizState.diet.join(', ');
    document.getElementById('wizSumFood').textContent = foodText;
}

async function wizGeneratePlan() {
    const btn = document.getElementById('wizNextBtn');
    btn.disabled = true;
    btn.innerHTML = '<span>Crafting</span> <span class="wiz-dot-loader"><span></span><span></span><span></span></span>';
    document.getElementById('wizBackBtn').disabled = true;

    const dest = wizState.destination;
    const from = wizState.from;
    const dur = wizState.duration || 5;
    const people = wizState.adults + wizState.children;
    const style = wizState.styles.join(', ') || 'cultural';
    const foodPref = wizState.food === 'veg' ? 'Vegetarian only' : 'Both veg and non-veg';
    const dietExtra = wizState.diet && wizState.diet.length ? `, special needs: ${wizState.diet.join(', ')}` : '';
    const fromLine = from ? `Traveling from: ${from}. ` : '';
    const budgetPerPerson = wizState.customBudget || { budget: 10000, normal: 27000, luxury: 60000 }[wizState.budget] || 27000;
    const budgetLabel = wizState.customBudget
        ? `Custom ₹${wizState.customBudget.toLocaleString('en-IN')} per person`
        : { budget: 'Budget (₹5k–₹15k)', normal: 'Mid-Range (₹15k–₹40k)', luxury: 'Luxury (₹40k+)' }[wizState.budget];

    const cityKey = Object.keys(CITY_DATA).find(k => dest.toLowerCase().includes(k));
    const cityData = cityKey ? CITY_DATA[cityKey] : null;

    try {
        const prompt = `Create a detailed ${dur}-day travel itinerary for ${dest}, India.
${fromLine}Travelers: ${people} (${wizState.adults} adult${wizState.adults > 1 ? 's' : ''}, ${wizState.children} children).
Budget: ${budgetLabel} — ₹${budgetPerPerson.toLocaleString('en-IN')} per person total.
Style: ${style}. Food: ${foodPref}${dietExtra}. Accommodation preference: ${wizState.accom.join(', ') || 'Resort'}.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "city": "${dest}",
  "tagline": "evocative one-liner",
  "transport": {
    "how_to_reach": "best way to reach from ${from || 'major city'} — train/flight/bus with name, duration, approx cost",
    "train": "specific train name and number if applicable, e.g. Rajdhani Express 12951",
    "local_transport": "best local transport inside ${dest}"
  },
  "hotels": [
    {"name": "Hotel Name", "type": "Budget/Mid-range/Luxury", "area": "area name", "price_per_night": "₹XXXX", "why": "one reason"},
    {"name": "Hotel Name", "type": "Budget/Mid-range/Luxury", "area": "area name", "price_per_night": "₹XXXX", "why": "one reason"},
    {"name": "Hotel Name", "type": "Budget/Mid-range/Luxury", "area": "area name", "price_per_night": "₹XXXX", "why": "one reason"}
  ],
  "famous": ["place1", "place2", "place3", "place4", "place5"],
  "hidden": ["gem1", "gem2", "gem3", "gem4"],
  "food": [{"name": "dish", "price": "₹XX"}, {"name": "dish", "price": "₹XX"}, {"name": "dish", "price": "₹XX"}, {"name": "dish", "price": "₹XX"}],
  "day_plan": [
    {
      "day": 1,
      "title": "Day title",
      "morning": {"time": "7:00 AM – 10:00 AM", "activity": "what to do", "place": "place name", "tip": "quick tip"},
      "afternoon": {"time": "11:00 AM – 3:00 PM", "activity": "what to do", "place": "place name", "tip": "quick tip"},
      "evening": {"time": "4:00 PM – 8:00 PM", "activity": "what to do", "place": "place name", "tip": "quick tip"},
      "food": "recommended meal for the day with restaurant/stall name"
    }
  ],
  "budget_per_person": {
    "accommodation": XXXX,
    "food": XXXX,
    "transport": XXXX,
    "activities": XXXX
  },
  "tips": "one practical insider tip"
}
Generate all ${dur} days. All budget numbers are per person in INR for the full trip.`;

        const response = await callGroqAI([{ role: 'user', content: prompt }]);
        let planData;
        try {
            planData = JSON.parse(response.replace(/```json|```/g, '').trim());
        } catch (e) {
            planData = wizBuildFallback(dest, dur, cityData);
        }
        wizRenderResults(planData, dest, dur);
    } catch (err) {
        wizRenderResults(wizBuildFallback(dest, dur, cityData), dest, dur);
    }
}

function wizBuildFallback(destination, days, cityData) {
    const d = cityData || {
        famous: [`${destination} Heritage Site`, `${destination} City Centre`, `${destination} Museum`, 'Local Market', 'Viewpoint'],
        hidden: ['Old town lanes', 'Local village nearby', 'Scenic route', 'Sunrise point'],
        food: [{ name: 'Local Thali', price: '₹80' }, { name: 'Street Snacks', price: '₹30' }, { name: 'Regional Curry', price: '₹150' }],
        per_day: { budget: 1000, normal: 3000, luxury: 8000 },
        tips: `Hire a local guide for the best experience in ${destination}.`
    };
    const perDay = d.per_day?.[wizState.budget] || 3000;
    const totalDays = Math.min(days, 7);
    const allSpots = [...(d.famous || []), ...(d.hidden || [])];
    return {
        city: destination, tagline: `Discover the wonders of ${destination}`,
        famous: d.famous, hidden: d.hidden, food: d.food,
        day_plan: Array.from({ length: totalDays }, (_, i) => ({
            day: i + 1, title: `Day ${i + 1} in ${destination}`,
            morning: `Visit ${allSpots[i * 2 % allSpots.length]}`,
            afternoon: 'Explore local markets and cafes',
            evening: `Evening at ${allSpots[(i * 2 + 1) % allSpots.length]}`,
            food: (d.food[i % d.food.length]?.name || 'Local cuisine') + ' for dinner'
        })),
        budget: {
            accommodation: Math.round(perDay * 0.4) * totalDays,
            food: Math.round(perDay * 0.25) * totalDays,
            transport: Math.round(perDay * 0.2) * totalDays,
            activities: Math.round(perDay * 0.15) * totalDays
        },
        tips: d.tips || `Enjoy your trip to ${destination}!`
    };
}

function wizRenderResults(plan, destination, duration) {
    document.querySelectorAll('.wiz-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('wizStepBar').style.display = 'none';
    document.getElementById('wizResultPanel').classList.add('active');

    const budgetData = plan.budget_per_person || plan.budget || {};
    const total = Object.values(budgetData).reduce((a, b) => a + b, 0);
    const people = wizState.adults + wizState.children;
    const totalAll = total * people;
    const budgetLabel = wizState.customBudget
        ? `Custom ₹${wizState.customBudget.toLocaleString('en-IN')}/person`
        : { budget: 'Budget 🎒', normal: 'Mid-Range ✈️', luxury: 'Luxury 👑' }[wizState.budget] || '';
    const foodLabel = { veg: '🥗 Veg', both: '🍱 All Food' }[wizState.food] || '';

    document.getElementById('wizResultTitle').textContent = `Your ${plan.city || destination} Plan ✦`;
    document.getElementById('wizResultSubtitle').textContent =
        `${duration} days · ${budgetLabel} · ${people} traveller${people > 1 ? 's' : ''}`;

    const bTotal = total || 1;
    const bPct = (v) => Math.round(((v || 0) / bTotal) * 100);

    const hotelsHtml = (plan.hotels && plan.hotels.length) ? `
    <div class="plan-card plan-card-full">
      <div class="plan-card-header plan-card-header--teal">
        <span class="plan-card-icon">🏨</span>
        <h4>Hotel Suggestions</h4>
      </div>
      <div class="plan-hotels-grid">
        ${plan.hotels.map(h => `
        <div class="plan-hotel-card">
          <div class="plan-hotel-top">
            <div class="plan-hotel-name">${h.name}</div>
            <div class="plan-hotel-badge">${h.type || ''}</div>
          </div>
          <div class="plan-hotel-area">📍 ${h.area || ''}</div>
          <div class="plan-hotel-price">₹ ${h.price_per_night || ''} <span>/night</span></div>
          <div class="plan-hotel-why">✦ ${h.why || ''}</div>
        </div>`).join('')}
      </div>
    </div>` : '';

    const transportHtml = (plan.transport) ? `
    <div class="plan-card plan-card-full plan-transport-card">
      <div class="plan-card-header plan-card-header--blue">
        <span class="plan-card-icon">🚆</span>
        <h4>How to Get There</h4>
      </div>
      <div class="plan-transport-grid">
        ${plan.transport.how_to_reach ? `<div class="plan-transport-item"><span class="plan-transport-icon">✈️🚆</span><div><div class="plan-transport-label">Best Route</div><div class="plan-transport-val">${plan.transport.how_to_reach}</div></div></div>` : ''}
        ${plan.transport.train ? `<div class="plan-transport-item"><span class="plan-transport-icon">🚂</span><div><div class="plan-transport-label">Train</div><div class="plan-transport-val">${plan.transport.train}</div></div></div>` : ''}
        ${plan.transport.local_transport ? `<div class="plan-transport-item"><span class="plan-transport-icon">🛺</span><div><div class="plan-transport-label">Local Transport</div><div class="plan-transport-val">${plan.transport.local_transport}</div></div></div>` : ''}
      </div>
    </div>` : '';

    document.getElementById('wizResultCards').innerHTML = `
    <div class="plan-stats-strip">
      <div class="plan-stat"><div class="plan-stat-val">${duration}</div><div class="plan-stat-lbl">Days</div></div>
      <div class="plan-stat-div"></div>
      <div class="plan-stat"><div class="plan-stat-val">${people}</div><div class="plan-stat-lbl">Traveller${people > 1 ? 's' : ''}</div></div>
      <div class="plan-stat-div"></div>
      <div class="plan-stat"><div class="plan-stat-val">₹${(total / 1000).toFixed(1)}k</div><div class="plan-stat-lbl">Per Person</div></div>
      <div class="plan-stat-div"></div>
      <div class="plan-stat"><div class="plan-stat-val">₹${(totalAll / 1000).toFixed(1)}k</div><div class="plan-stat-lbl">Total (${people})</div></div>
    </div>

    ${transportHtml}

    <div class="plan-grid-2">
      <div class="plan-card">
        <div class="plan-card-header plan-card-header--teal">
          <span class="plan-card-icon">🏛️</span>
          <h4>Famous Places</h4>
        </div>
        <ul class="plan-list">
          ${(plan.famous || []).map((p, i) => `
          <li class="plan-list-item">
            <span class="plan-list-num">${i + 1}</span>
            <span>${p}</span>
          </li>`).join('')}
        </ul>
      </div>

      <div class="plan-card">
        <div class="plan-card-header plan-card-header--gold">
          <span class="plan-card-icon">💎</span>
          <h4>Hidden Gems</h4>
        </div>
        <ul class="plan-list">
          ${(plan.hidden || []).map((p, i) => `
          <li class="plan-list-item">
            <span class="plan-list-gem">✦</span>
            <span>${p}</span>
          </li>`).join('')}
        </ul>
      </div>

      <div class="plan-card">
        <div class="plan-card-header plan-card-header--orange">
          <span class="plan-card-icon">🍜</span>
          <h4>Must-Try Food</h4>
        </div>
        <div class="plan-food-list">
          ${(plan.food || []).map(f => `
          <div class="plan-food-item">
            <span class="plan-food-name">${f.name}</span>
            <span class="plan-food-price">${f.price || ''}</span>
          </div>`).join('')}
        </div>
      </div>

      <div class="plan-card">
        <div class="plan-card-header plan-card-header--purple">
          <span class="plan-card-icon">💰</span>
          <h4>Budget — Per Person</h4>
        </div>
        <div class="plan-budget-list">
          <div class="plan-budget-row">
            <span class="plan-budget-icon">🏨</span>
            <div class="plan-budget-bar-wrap">
              <div class="plan-budget-label-row"><span>Accommodation</span><span class="plan-budget-amt">₹${(budgetData.accommodation || 0).toLocaleString()}</span></div>
              <div class="plan-budget-bar"><div class="plan-budget-fill" style="width:${bPct(budgetData.accommodation)}%;background:var(--lc)"></div></div>
            </div>
          </div>
          <div class="plan-budget-row">
            <span class="plan-budget-icon">🍽️</span>
            <div class="plan-budget-bar-wrap">
              <div class="plan-budget-label-row"><span>Food</span><span class="plan-budget-amt">₹${(budgetData.food || 0).toLocaleString()}</span></div>
              <div class="plan-budget-bar"><div class="plan-budget-fill" style="width:${bPct(budgetData.food)}%;background:#f59e0b"></div></div>
            </div>
          </div>
          <div class="plan-budget-row">
            <span class="plan-budget-icon">🚆</span>
            <div class="plan-budget-bar-wrap">
              <div class="plan-budget-label-row"><span>Transport</span><span class="plan-budget-amt">₹${(budgetData.transport || 0).toLocaleString()}</span></div>
              <div class="plan-budget-bar"><div class="plan-budget-fill" style="width:${bPct(budgetData.transport)}%;background:#8b5cf6"></div></div>
            </div>
          </div>
          <div class="plan-budget-row">
            <span class="plan-budget-icon">🎭</span>
            <div class="plan-budget-bar-wrap">
              <div class="plan-budget-label-row"><span>Activities</span><span class="plan-budget-amt">₹${(budgetData.activities || 0).toLocaleString()}</span></div>
              <div class="plan-budget-bar"><div class="plan-budget-fill" style="width:${bPct(budgetData.activities)}%;background:#ec4899"></div></div>
            </div>
          </div>
          <div class="plan-budget-total">
            <span>Per Person</span><span>₹${total.toLocaleString()}</span>
          </div>
          ${people > 1 ? `<div class="plan-budget-total plan-budget-all" style="border-top:1px dashed var(--border);margin-top:.3rem;padding-top:.5rem;color:var(--uv)">
            <span>Total (${people} people)</span><span>₹${totalAll.toLocaleString()}</span>
          </div>` : ''}
        </div>
      </div>
    </div>

    ${hotelsHtml}

    <div class="plan-card plan-card-full">
      <div class="plan-card-header plan-card-header--blue">
        <span class="plan-card-icon">📅</span>
        <h4>Day-by-Day Itinerary</h4>
      </div>
      <div class="plan-days-grid">
        ${(plan.day_plan || []).map(d => {
        const morning = typeof d.morning === 'object' ? d.morning : { time: '7:00 AM – 11:00 AM', activity: d.morning, place: '', tip: '' };
        const afternoon = typeof d.afternoon === 'object' ? d.afternoon : { time: '11:00 AM – 3:00 PM', activity: d.afternoon, place: '', tip: '' };
        const evening = typeof d.evening === 'object' ? d.evening : { time: '4:00 PM – 8:00 PM', activity: d.evening, place: '', tip: '' };
        return `
        <div class="plan-day-card">
          <div class="plan-day-badge">Day ${d.day}</div>
          <div class="plan-day-title">${d.title || `Day ${d.day} in ${plan.city || destination}`}</div>
          <div class="plan-day-activities">
            <div class="plan-day-act">
              <span class="plan-day-act-dot plan-day-act-dot--morning"></span>
              <div>
                <span class="plan-act-label">🌅 Morning</span>
                <span class="plan-act-time">${morning.time || ''}</span>
                <p>${morning.activity || ''}${morning.place ? ` — <em>${morning.place}</em>` : ''}${morning.tip ? `<br><small class="plan-act-tip">💡 ${morning.tip}</small>` : ''}</p>
              </div>
            </div>
            <div class="plan-day-act">
              <span class="plan-day-act-dot plan-day-act-dot--afternoon"></span>
              <div>
                <span class="plan-act-label">☀️ Afternoon</span>
                <span class="plan-act-time">${afternoon.time || ''}</span>
                <p>${afternoon.activity || ''}${afternoon.place ? ` — <em>${afternoon.place}</em>` : ''}${afternoon.tip ? `<br><small class="plan-act-tip">💡 ${afternoon.tip}</small>` : ''}</p>
              </div>
            </div>
            <div class="plan-day-act">
              <span class="plan-day-act-dot plan-day-act-dot--evening"></span>
              <div>
                <span class="plan-act-label">🌙 Evening</span>
                <span class="plan-act-time">${evening.time || ''}</span>
                <p>${evening.activity || ''}${evening.place ? ` — <em>${evening.place}</em>` : ''}${evening.tip ? `<br><small class="plan-act-tip">💡 ${evening.tip}</small>` : ''}</p>
              </div>
            </div>
            ${d.food ? `<div class="plan-day-act"><span class="plan-day-act-dot plan-day-act-dot--food"></span><div><span class="plan-act-label">🍽️ Food</span><p>${d.food}</p></div></div>` : ''}
          </div>
        </div>`;
    }).join('')}
      </div>
    </div>

    ${plan.tips ? `
    <div class="plan-card plan-card-full plan-tips-card">
      <div class="plan-tips-icon">💡</div>
      <div>
        <div class="plan-tips-label">Local Insider Tip</div>
        <p class="plan-tips-text">${plan.tips}</p>
      </div>
    </div>` : ''}`;

    document.getElementById('wizFooter').innerHTML = `
      <button class="wiz-btn-back" onclick="wizReset()">← Plan Another</button>
      <span class="wiz-step-count">✦ Plan Generated</span>
      <button class="wiz-btn-next wiz-btn-pdf" onclick="wizDownloadPDF()">📄 Download PDF</button>`;

    document.getElementById('wizResultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window._lastPlanData = { plan, destination, duration, wizState: { ...wizState }, total, totalAll, budgetLabel, foodLabel };
}

function wizDownloadPDF() {
    const btn = document.querySelector('.wiz-btn-pdf');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Generating...'; }

    const { plan, destination, duration, total, budgetLabel, foodLabel } = window._lastPlanData || {};
    const people = wizState.adults + wizState.children;
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const isDark = theme === 'dark';

    const bg = isDark ? '#0a1412' : '#ffffff';
    const cardBg = isDark ? '#0f1e1b' : '#f8fffe';
    const cardBorder = isDark ? '#1e3832' : '#d1ede8';
    const text = isDark ? '#e8f5f2' : '#0f2e28';
    const textMuted = isDark ? '#7fb8ac' : '#4a8c7e';
    const accent = '#3a8c7e';
    const gold = '#c9a84c';

    const style = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'DM Sans', sans-serif; background: ${bg}; color: ${text}; padding: 32px; font-size: 13px; line-height: 1.6; }
      .header { text-align: center; margin-bottom: 28px; padding: 28px; background: ${cardBg}; border-radius: 16px; border: 1px solid ${cardBorder}; }
      .header-title { font-size: 28px; font-weight: 700; color: ${accent}; margin-bottom: 6px; }
      .header-sub { color: ${textMuted}; font-size: 13px; }
      .stats-strip { display: flex; gap: 12px; margin-bottom: 20px; }
      .stat-box { flex: 1; background: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 12px; padding: 14px; text-align: center; }
      .stat-val { font-size: 20px; font-weight: 700; color: ${accent}; }
      .stat-lbl { font-size: 10px; color: ${textMuted}; margin-top: 2px; text-transform: uppercase; letter-spacing: .5px; }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
      .card { background: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 14px; overflow: hidden; break-inside: avoid; }
      .card-head { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid ${cardBorder}; }
      .card-head-icon { font-size: 16px; }
      .card-head-title { font-size: 13px; font-weight: 700; color: ${accent}; text-transform: uppercase; letter-spacing: .5px; }
      .card-body { padding: 14px 16px; }
      ul.plist { list-style: none; }
      ul.plist li { padding: 5px 0; border-bottom: 1px solid ${cardBorder}; display: flex; align-items: center; gap: 8px; font-size: 12px; }
      ul.plist li:last-child { border-bottom: none; }
      .num { width: 20px; height: 20px; background: ${accent}; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
      .gem { color: ${gold}; font-size: 11px; flex-shrink: 0; }
      .food-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid ${cardBorder}; font-size: 12px; }
      .food-row:last-child { border-bottom: none; }
      .food-price { color: ${accent}; font-weight: 700; }
      .bud-row { margin-bottom: 10px; }
      .bud-label-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
      .bud-bar { height: 6px; background: ${isDark ? '#1e3832' : '#e0f0ec'}; border-radius: 3px; overflow: hidden; }
      .bud-fill { height: 100%; border-radius: 3px; }
      .bud-total { margin-top: 12px; padding-top: 10px; border-top: 1px solid ${cardBorder}; display: flex; justify-content: space-between; font-weight: 700; color: ${accent}; font-size: 14px; }
      .full-card { grid-column: 1 / -1; }
      .days-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 14px 16px; }
      .day-card { background: ${isDark ? '#0a1412' : '#f0fbf8'}; border: 1px solid ${cardBorder}; border-radius: 10px; padding: 12px; break-inside: avoid; }
      .day-badge { display: inline-block; background: ${accent}; color: #fff; border-radius: 6px; padding: 2px 9px; font-size: 10px; font-weight: 700; margin-bottom: 5px; }
      .day-title { font-size: 12px; font-weight: 700; color: ${text}; margin-bottom: 8px; }
      .day-act { display: flex; gap: 7px; margin-bottom: 5px; align-items: flex-start; }
      .dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
      .dot-m { background: #f59e0b; }
      .dot-a { background: ${accent}; }
      .dot-e { background: #8b5cf6; }
      .dot-f { background: #ec4899; }
      .act-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: ${textMuted}; letter-spacing: .4px; display: block; }
      .act-text { font-size: 11px; color: ${text}; }
      .tips-card { display: flex; gap: 14px; align-items: flex-start; padding: 16px; background: ${cardBg}; border: 1px solid ${cardBorder}; border-left: 4px solid ${gold}; border-radius: 14px; margin-top: 20px; }
      .tips-icon { font-size: 22px; flex-shrink: 0; }
      .tips-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${gold}; letter-spacing: .5px; margin-bottom: 4px; }
      .tips-text { font-size: 12px; color: ${textMuted}; line-height: 1.6; }
      .footer-note { text-align: center; margin-top: 24px; font-size: 10px; color: ${textMuted}; }
      @media print { body { padding: 16px; } }
    `;

    const bPct = (v) => Math.round(((v || 0) / (total || 1)) * 100);
    const city = plan.city || destination;

    const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${city} Trip Plan</title><style>${style}</style></head><body>
    <div class="header">
      <div class="header-title">✦ ${city} Trip Plan</div>
      <div class="header-sub">${plan.tagline || `Discover the wonders of ${city}`}</div>
    </div>
    <div class="stats-strip">
      <div class="stat-box"><div class="stat-val">${duration}</div><div class="stat-lbl">Days</div></div>
      <div class="stat-box"><div class="stat-val">${people}</div><div class="stat-lbl">Travellers</div></div>
      <div class="stat-box"><div class="stat-val">₹${(total / 1000).toFixed(1)}k</div><div class="stat-lbl">Est. Budget</div></div>
      <div class="stat-box"><div class="stat-val">${foodLabel || '🍽️'}</div><div class="stat-lbl">Food Pref</div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><span class="card-head-icon">🏛️</span><span class="card-head-title">Famous Places</span></div>
        <div class="card-body"><ul class="plist">${(plan.famous || []).map((p, i) => `<li><span class="num">${i + 1}</span>${p}</li>`).join('')}</ul></div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-head-icon">💎</span><span class="card-head-title">Hidden Gems</span></div>
        <div class="card-body"><ul class="plist">${(plan.hidden || []).map(p => `<li><span class="gem">✦</span>${p}</li>`).join('')}</ul></div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-head-icon">🍜</span><span class="card-head-title">Must-Try Food</span></div>
        <div class="card-body">${(plan.food || []).map(f => `<div class="food-row"><span>${f.name}</span><span class="food-price">${f.price || ''}</span></div>`).join('')}</div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-head-icon">💰</span><span class="card-head-title">Budget Breakdown</span></div>
        <div class="card-body">
          <div class="bud-row"><div class="bud-label-row"><span>🏨 Accommodation</span><span>₹${(plan.budget?.accommodation || 0).toLocaleString()}</span></div><div class="bud-bar"><div class="bud-fill" style="width:${bPct(plan.budget?.accommodation)}%;background:${accent}"></div></div></div>
          <div class="bud-row"><div class="bud-label-row"><span>🍽️ Food</span><span>₹${(plan.budget?.food || 0).toLocaleString()}</span></div><div class="bud-bar"><div class="bud-fill" style="width:${bPct(plan.budget?.food)}%;background:#f59e0b"></div></div></div>
          <div class="bud-row"><div class="bud-label-row"><span>🚗 Transport</span><span>₹${(plan.budget?.transport || 0).toLocaleString()}</span></div><div class="bud-bar"><div class="bud-fill" style="width:${bPct(plan.budget?.transport)}%;background:#8b5cf6"></div></div></div>
          <div class="bud-row"><div class="bud-label-row"><span>🎭 Activities</span><span>₹${(plan.budget?.activities || 0).toLocaleString()}</span></div><div class="bud-bar"><div class="bud-fill" style="width:${bPct(plan.budget?.activities)}%;background:#ec4899"></div></div></div>
          <div class="bud-total"><span>Total Estimate</span><span>₹${total.toLocaleString()}</span></div>
        </div>
      </div>
    </div>
    <div class="card full-card">
      <div class="card-head"><span class="card-head-icon">📅</span><span class="card-head-title">Day-by-Day Itinerary</span></div>
      <div class="days-grid">
        ${(plan.day_plan || []).map(d => `
        <div class="day-card">
          <div class="day-badge">Day ${d.day}</div>
          <div class="day-title">${d.title || `Day ${d.day} in ${city}`}</div>
          <div class="day-act"><span class="dot dot-m"></span><div><span class="act-label">Morning</span><span class="act-text">${d.morning}</span></div></div>
          <div class="day-act"><span class="dot dot-a"></span><div><span class="act-label">Afternoon</span><span class="act-text">${d.afternoon}</span></div></div>
          <div class="day-act"><span class="dot dot-e"></span><div><span class="act-label">Evening</span><span class="act-text">${d.evening}</span></div></div>
          ${d.food ? `<div class="day-act"><span class="dot dot-f"></span><div><span class="act-label">Food</span><span class="act-text">${d.food}</span></div></div>` : ''}
        </div>`).join('')}
      </div>
    </div>
    ${plan.tips ? `<div class="tips-card"><span class="tips-icon">💡</span><div><div class="tips-label">Local Insider Tip</div><p class="tips-text">${plan.tips}</p></div></div>` : ''}
    <div class="footer-note">Generated by Plan Your Trip India · planyyourtripindia.com</div>
    </body></html>`;

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) {
        showToast('Please allow pop-ups to download PDF', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '📄 Download PDF'; }
        return;
    }
    printWin.document.write(htmlContent);
    printWin.document.close();
    printWin.onload = () => {
        setTimeout(() => {
            printWin.print();
            printWin.close();
            if (btn) { btn.disabled = false; btn.innerHTML = '📄 Download PDF'; }
        }, 500);
    };
}

function wizReset() {
    location.reload();
}

// ─── WIZARD INIT ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const df = document.getElementById('wizDateFrom');
    const dt = document.getElementById('wizDateTo');
    if (df) df.min = today;
    if (dt) dt.min = today;
    const wi = document.getElementById('wizDestInput');
    if (wi) wi.addEventListener('input', function () { wizState.destination = this.value; });
    const cd = document.getElementById('wizChildDown');
    if (cd) cd.disabled = true;
    const ad = document.getElementById('wizAdultsDown');
    if (ad) ad.disabled = true;
});

// ─── CITY PAGE ───────────────────────────────────────────────────
function openCityPage(key) {
    const city = CITY_DATA[key];
    if (!city) return;
    currentCityKey = key;
    document.getElementById('mainContent') && (document.getElementById('mainContent').style.display = 'none');
    const page = document.getElementById('cityPage');
    page.style.display = 'block';
    page.scrollTop = 0;
    window.scrollTo(0, 0);

    const hero = document.getElementById('cityHero');
    hero.style.backgroundImage = `url('${city.img}')`;
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';

    document.getElementById('cityBadge').textContent = city.badge;
    document.getElementById('cityTitle').textContent = city.name;
    document.getElementById('cityTagline').textContent = city.tagline;

    document.getElementById('famousCards').innerHTML = city.famous.map(p => `
    <div class="city-info-card"><div class="card-icon">🏛️</div><h4>${p}</h4><p>Must-visit attraction in ${city.name}</p></div>
  `).join('');

    document.getElementById('foodCards').innerHTML = city.food.map(f => `
    <div class="city-info-card"><div class="card-icon">🍜</div><h4>${f.name}</h4><p>Local street food delicacy</p><span class="price-tag">${f.price}</span></div>
  `).join('');

    document.getElementById('hiddenCards').innerHTML = city.hidden.map(p => `
    <div class="city-info-card"><div class="card-icon">💎</div><h4>${p}</h4><p>Hidden gem locals love</p></div>
  `).join('');

    document.getElementById('hotelCards').innerHTML = city.hotels.map(h => `
    <div class="city-info-card"><div class="card-icon">🏨</div><h4>${h}</h4><p>Recommended stay in ${city.name}</p></div>
  `).join('');

    document.querySelectorAll('.city-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.city-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.city-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        };
    });
}

function closeCityPage() {
    document.getElementById('cityPage').style.display = 'none';
    const mc = document.getElementById('mainContent');
    if (mc) mc.style.display = 'block';
    window.scrollTo(0, 0);
}

function quickPlanCity() {
    const city = CITY_DATA[currentCityKey];
    if (!city) return;
    closeCityPage();
    wizSelectDest(city.name);
    document.getElementById('planner').scrollIntoView({ behavior: 'smooth' });
}

function showMain() { closeCityPage(); }

// ─── AI CHATBOT ──────────────────────────────────────────────────
function toggleChat() {
    const win = document.getElementById('chatWindow');
    win.classList.toggle('open');
    const notif = document.getElementById('chatNotif');
    if (notif) notif.style.display = 'none';
}

function openChat() {
    document.getElementById('chatWindow').classList.add('open');
    const notif = document.getElementById('chatNotif');
    if (notif) notif.style.display = 'none';
}

function sendQuickMsg(msg) {
    openChat();
    document.getElementById('chatInput').value = msg;
    sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    appendChatMsg('user', '🧳', message);
    input.value = '';
    chatHistory.push({ role: 'user', content: message });

    const typingId = showTypingIndicator();

    try {
        const response = await callGroqAI(chatHistory);
        removeTyping(typingId);
        appendChatMsg('bot', '🤖', response);
        chatHistory.push({ role: 'assistant', content: response });
        // FIX 3: Trim without locking old messages
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }
    } catch (err) {
        removeTyping(typingId);
        appendChatMsg('bot', '🤖', `Sorry, I couldn't connect to AI right now. ${err.message}`);
    }
}

function appendChatMsg(type, avatar, text) {
    const msgs = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-content">${formatText(text)}</div>
  `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function formatText(text) {
    return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
    const msgs = document.getElementById('chatMessages');
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'chat-msg bot'; div.id = id;
    div.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-content">
      <div class="ai-typing-dots"><span></span><span></span><span></span></div>
    </div>
  `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return id;
}

function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ═══════════════════════════════════════════════════════════════
//  GROQ AI — calls your secure backend proxy
//  Server repo: https://github.com/yourusername/travel-ai-server
//  ⬇️ Update AI_PROXY_URL to your deployed server URL
// ═══════════════════════════════════════════════════════════════
const AI_PROXY_URL = 'https://travel-ai-server-btgt.onrender.com/api/chat';

// FIX 1: Renamed from callClaudeAI → callGroqAI so all callers work
async function callGroqAI(messages) {
    // Filter to only user/assistant roles
    const apiMessages = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

    // FIX 4: Only check for empty messages, no fragile role check
    if (!apiMessages.length) {
        throw new Error('No messages to send');
    }

    const response = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `Server Error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || '';
}

// ─── CONTACT FORM ───────────────────────────────────────────────
function submitContact(event) {
    event.preventDefault();
    const success = document.getElementById('formSuccess');
    success.style.display = 'block';
    event.target.reset();
    setTimeout(() => success.style.display = 'none', 5000);
}

// ─── TOAST ──────────────────────────────────────────────────────
function showToast(message, duration = 3500) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── KEYBOARD ───────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.getElementById('chatWindow').classList.remove('open');
        if (document.getElementById('cityPage').style.display !== 'none') closeCityPage();
    }
});

// ════════════════════════════════════════════════
//  AUTH — Login / Sign Up System
// ════════════════════════════════════════════════
let currentUser = JSON.parse(localStorage.getItem('pyti_user') || 'null');

window.addEventListener('DOMContentLoaded', () => {
    refreshNavAuth();

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            const navH = document.getElementById('navbar')?.offsetHeight || 70;
            const top = target.getBoundingClientRect().top + window.scrollY - navH;
            window.scrollTo({ top, behavior: 'smooth' });
        }, { passive: false });
    });
});

function refreshNavAuth() {
    const navActions = document.getElementById('navActions');
    if (navActions) {
        if (currentUser) {
            const initials = ((currentUser.first || '?')[0] + (currentUser.last || '?')[0]).toUpperCase();
            navActions.innerHTML = `
        <div class="nav-user-badge">
          <div class="nav-user-avatar">${initials}</div>
          <span>${currentUser.first}</span>
          <button style="background:none;border:none;color:var(--text-dim);font-size:.8rem;cursor:pointer;margin-left:.3rem;" onclick="logoutUser()">↩ Out</button>
        </div>`;
        } else {
            navActions.innerHTML = `
        <button class="btn-nav-login" onclick="openModal('loginModal')">Login</button>
        <button class="btn-nav-signup" onclick="openModal('signupModal')">Sign Up ✦</button>`;
        }
    }
    if (window.updateMobileAuthUI) window.updateMobileAuthUI();
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        const inp = modal.querySelector('.auth-input');
        if (inp) inp.focus();
    }, 350);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    clearAuthErrors(id);
}

function switchModal(fromId, toId) {
    closeModal(fromId);
    setTimeout(() => openModal(toId), 200);
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('auth-modal-backdrop')) {
        closeModal(e.target.id);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const mo = document.getElementById('navMobileOverlay');
        if (mo && mo.classList.contains('open')) {
            document.getElementById('hamburger').classList.remove('open');
            mo.classList.remove('open');
            document.body.style.overflow = '';
        }
        closeModal('loginModal');
        closeModal('signupModal');
        if (document.getElementById('chatWindow').classList.contains('open')) {
            document.getElementById('chatWindow').classList.remove('open');
        }
        if (document.getElementById('cityPage').style.display !== 'none') closeCityPage();
    }
});

function clearAuthErrors(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.querySelectorAll('.auth-error,.auth-success').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
    modal.querySelectorAll('.auth-input').forEach(el => el.value = '');
}

function togglePw(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    if (inp.type === 'password') {
        inp.type = 'text';
        btn.textContent = '🙈';
    } else {
        inp.type = 'password';
        btn.textContent = '👁';
    }
}

function checkPwStrength(pw) {
    const fill = document.getElementById('pwStrengthFill');
    const label = document.getElementById('pwStrengthLabel');
    if (!fill || !label) return;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
        { pct: '0%', color: '#f87171', text: '' },
        { pct: '25%', color: '#f87171', text: 'Weak' },
        { pct: '50%', color: '#fb923c', text: 'Fair' },
        { pct: '75%', color: '#facc15', text: 'Good' },
        { pct: '100%', color: '#4ade80', text: 'Strong ✓' },
    ];
    const lvl = levels[score];
    fill.style.width = lvl.pct;
    fill.style.background = lvl.color;
    label.textContent = lvl.text;
    label.style.color = lvl.color;
}

function showAuthError(modalId, errorId, msg) {
    const el = document.getElementById(errorId);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function showAuthSuccess(successId, msg) {
    const el = document.getElementById(successId);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) btn.classList.add('loading');
    else btn.classList.remove('loading');
    btn.disabled = loading;
}

function handleLogin() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    document.getElementById('loginError').style.display = 'none';

    if (!email || !password) {
        showAuthError('loginModal', 'loginError', '⚠ Please fill in all fields.');
        return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        showAuthError('loginModal', 'loginError', '⚠ Please enter a valid email address.');
        return;
    }

    setLoading('loginSubmitBtn', true);

    setTimeout(() => {
        setLoading('loginSubmitBtn', false);
        const users = JSON.parse(localStorage.getItem('pyti_users') || '[]');
        const user = users.find(u => u.email === email && u.password === btoa(password));
        if (user) {
            currentUser = user;
            localStorage.setItem('pyti_user', JSON.stringify(user));
            closeModal('loginModal');
            refreshNavAuth();
            showToast('🎉 Welcome back, ' + user.first + '! Ready to explore India?');
        } else {
            showAuthError('loginModal', 'loginError', '✕ Invalid email or password. Please try again.');
        }
    }, 1200);
}

function handleSignup() {
    const first = document.getElementById('signupFirst')?.value.trim();
    const last = document.getElementById('signupLast')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;

    document.getElementById('signupError').style.display = 'none';
    document.getElementById('signupSuccess').style.display = 'none';

    if (!first || !last || !email || !password) {
        showAuthError('signupModal', 'signupError', '⚠ Please fill in all fields.');
        return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        showAuthError('signupModal', 'signupError', '⚠ Please enter a valid email address.');
        return;
    }
    if (password.length < 8) {
        showAuthError('signupModal', 'signupError', '⚠ Password must be at least 8 characters.');
        return;
    }

    setLoading('signupSubmitBtn', true);

    setTimeout(() => {
        setLoading('signupSubmitBtn', false);
        const users = JSON.parse(localStorage.getItem('pyti_users') || '[]');
        if (users.find(u => u.email === email)) {
            showAuthError('signupModal', 'signupError', '✕ An account with this email already exists.');
            return;
        }
        const newUser = { first, last, email, password: btoa(password), joined: new Date().toISOString() };
        users.push(newUser);
        localStorage.setItem('pyti_users', JSON.stringify(users));
        currentUser = newUser;
        localStorage.setItem('pyti_user', JSON.stringify(newUser));
        showAuthSuccess('signupSuccess', '🎉 Account created! Welcome to Plan Your Trip India!');
        setTimeout(() => {
            closeModal('signupModal');
            refreshNavAuth();
            showToast('🎉 Welcome aboard, ' + first + '! Start planning your dream trip!');
        }, 1600);
    }, 1400);
}

function handleSocialLogin(provider) {
    showToast('🔗 ' + provider + ' login coming soon!');
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('pyti_user');
    refreshNavAuth();
    showToast('👋 Logged out. Come back soon!');
}
