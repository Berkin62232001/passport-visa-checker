// =====================================================
// Passport Visa Checker - Main Application
// =====================================================

// TopoJSON country boundaries — vendored locally (world-atlas@2.0.2) so the map
// works without third-party CDNs; pinned jsDelivr mirror kept as fallback.
const GEOJSON_URL = "data/countries-110m.json";
const GEOJSON_FALLBACK = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";

// Default timeout for all network requests — protects against stalled CDNs.
const FETCH_TIMEOUT_MS = 15000;

// localStorage key for remembering the last-selected passport.
const PASSPORT_STORAGE_KEY = "pvc_selected_passport";

// topojson-client is loaded statically from js/vendor/ in index.html — no runtime CDN dependency.

let map;
let geoJsonLayer;
let selectedPassport = null;
let currentVisaData = null;
let previouslyFocusedEl = null;

/**
 * fetch() with an abort-based timeout. Throws if the request exceeds `timeoutMs`.
 * Browser caches still apply on retry.
 */
function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS, options = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    return fetch(url, { ...options, signal: ctrl.signal })
        .finally(() => clearTimeout(t));
}

// Cache DOM references for info panel (queried once)
let panelEls = null;
function getPanelEls() {
    if (!panelEls) {
        panelEls = {
            panel: document.getElementById("info-panel"),
            flag: document.getElementById("panel-flag"),
            country: document.getElementById("panel-country"),
            badge: document.getElementById("panel-status-badge"),
            facts: document.getElementById("panel-facts"),
            stats: document.getElementById("panel-stats"),
            details: document.getElementById("panel-details"),
            documents: document.getElementById("panel-documents"),
            documentsList: document.getElementById("panel-documents-list"),
            changes: document.getElementById("panel-changes-text"),
            tips: document.getElementById("panel-tips-text")
        };
    }
    return panelEls;
}

// =====================================================
// Map Initialization
// =====================================================
function initMap() {
    map = L.map("map", {
        center: [25, 20],
        zoom: 2.5,
        minZoom: 2,
        maxZoom: 7,
        zoomControl: false,
        worldCopyJump: true,
        maxBounds: [[-85, -180], [85, 180]],
        maxBoundsViscosity: 1.0
    });

    // Place zoom controls top-right so they don't collide with the destination search (top-left).
    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19
    }).addTo(map);

    loadGeoJSON();
}

/**
 * Fetch TopoJSON and convert to GeoJSON.
 * topojson-client (loaded statically from js/vendor/) handles antimeridian splitting.
 */
async function loadGeoJSON() {
    try {
        // Fetch TopoJSON (~100KB, much smaller than full GeoJSON)
        const response = await fetchWithTimeout(GEOJSON_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const topoData = await response.json();

        // Convert using topojson-client (handles antimeridian correctly)
        const geoData = topojson.feature(topoData, topoData.objects.countries);

        // Normalize: inject ISO3 codes, names, filter Antarctica, fix antimeridian
        normalizeFeatures(geoData.features, "numeric");

        geoJsonLayer = L.geoJSON(geoData, {
            style: defaultStyle,
            onEachFeature: onEachFeature
        }).addTo(map);

        // Warm the visa-data cache on idle so the first passport selection is instant
        if (typeof requestIdleCallback === "function") {
            requestIdleCallback(() => { fetchPassportData().catch(() => {}); });
        } else {
            setTimeout(() => { fetchPassportData().catch(() => {}); }, 2000);
        }
    } catch (error) {
        console.warn("TopoJSON failed, falling back to pinned mirror:", error);
        try {
            const response = await fetchWithTimeout(GEOJSON_FALLBACK);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const topoData = await response.json();
            const data = topojson.feature(topoData, topoData.objects.countries);

            // Normalize fallback features the same way as primary.
            normalizeFeatures(data.features, "numeric");

            geoJsonLayer = L.geoJSON(data, {
                style: defaultStyle,
                onEachFeature: onEachFeature
            }).addTo(map);
        } catch (err) {
            console.error("Failed to load map data:", err);
            showMapLoadError();
        }
    }
}

/**
 * Normalize GeoJSON features for both primary (TopoJSON) and fallback (raw GeoJSON) paths.
 * Injects ISO3166-1-Alpha-3 codes, country names, filters Antarctica, and fixes antimeridian.
 *
 * @param {Array} features - GeoJSON feature array (mutated in place + filtered)
 * @param {string} mode - "numeric" (world-atlas TopoJSON: feature.id is ISO numeric)
 *                        "property" (geo-countries GeoJSON: ISO_A3 or ADMIN in properties)
 */
function normalizeFeatures(features, mode) {
    // Filter in place (splice to mutate the original array)
    for (let i = features.length - 1; i >= 0; i--) {
        const feature = features[i];
        let isoCode;

        if (mode === "numeric") {
            // world-atlas TopoJSON: feature.id is the ISO 3166-1 numeric code
            isoCode = NUMERIC_TO_ISO[feature.id] || feature.id;
        } else {
            // geo-countries GeoJSON: ISO_A3 in properties, or fall back to ADMIN name lookup
            isoCode = feature.properties["ISO_A3"]
                   || feature.properties["ISO3166-1-Alpha-3"]
                   || feature.id
                   || "";
        }

        if (isoCode === "ATA" || isoCode === "010") {
            features.splice(i, 1); // Remove Antarctica
            continue;
        }

        feature.properties["ISO3166-1-Alpha-3"] = isoCode;
        feature.properties.name = COUNTRY_INFO[isoCode]?.name || feature.properties.name || feature.properties.ADMIN || "Unknown";

        fixAntimeridian(feature.geometry);
    }
}

/** Reuse the existing #error-recovery panel for map-load failures. */
function showMapLoadError() {
    const recovery = document.getElementById("error-recovery");
    if (!recovery) return;
    const msg = recovery.querySelector("p");
    if (msg) msg.textContent = "Failed to load map data. Check your connection and try again.";
    recovery.classList.remove("hidden");
    // Move focus into the alertdialog so keyboard users can act immediately.
    requestAnimationFrame(() => {
        document.getElementById("retry-btn")?.focus();
    });
}

/**
 * Fix antimeridian artifacts in a GeoJSON geometry.
 * When consecutive points jump more than 180° in longitude,
 * the polygon crosses the antimeridian. We unwrap negative
 * longitudes to >180° space so the polygon renders on one
 * side without a cross-screen artifact.
 */
function fixAntimeridian(geometry) {
    if (!geometry) return;

    if (geometry.type === "Polygon") {
        geometry.coordinates = fixPolygonRings(geometry.coordinates);
    } else if (geometry.type === "MultiPolygon") {
        const newPolygons = [];
        for (const polygon of geometry.coordinates) {
            const fixed = fixPolygonRings(polygon);
            newPolygons.push(fixed);
        }
        geometry.coordinates = newPolygons;
    }
}

function fixPolygonRings(rings) {
    return rings.map(ring => {
        // Check if this ring crosses the antimeridian
        let crosses = false;
        for (let i = 1; i < ring.length; i++) {
            if (Math.abs(ring[i][0] - ring[i - 1][0]) > 180) {
                crosses = true;
                break;
            }
        }
        if (!crosses) return ring;

        // Determine majority hemisphere so we shift the minority side.
        // This avoids pushing west-anchored features (e.g. Alaska) to +360°.
        let eastCount = 0;
        for (const [lng] of ring) { if (lng >= 0) eastCount++; }
        const majorityEast = eastCount >= ring.length / 2;

        return ring.map(([lng, lat]) => {
            if (majorityEast && lng < 0) return [lng + 360, lat];
            if (!majorityEast && lng > 0) return [lng - 360, lat];
            return [lng, lat];
        });
    });
}

// ISO 3166-1 numeric to alpha-3 lookup
const NUMERIC_TO_ISO = {
    "004": "AFG", "008": "ALB", "012": "DZA", "020": "AND", "024": "AGO",
    "028": "ATG", "032": "ARG", "051": "ARM", "036": "AUS", "040": "AUT",
    "031": "AZE", "044": "BHS", "048": "BHR", "050": "BGD", "052": "BRB",
    "112": "BLR", "056": "BEL", "084": "BLZ", "204": "BEN", "064": "BTN",
    "068": "BOL", "070": "BIH", "072": "BWA", "076": "BRA", "096": "BRN",
    "100": "BGR", "854": "BFA", "108": "BDI", "116": "KHM", "120": "CMR",
    "124": "CAN", "132": "CPV", "140": "CAF", "148": "TCD", "152": "CHL",
    "156": "CHN", "170": "COL", "174": "COM", "178": "COG", "180": "COD",
    "188": "CRI", "384": "CIV", "191": "HRV", "192": "CUB", "196": "CYP",
    "203": "CZE", "208": "DNK", "262": "DJI", "212": "DMA", "214": "DOM",
    "218": "ECU", "818": "EGY", "222": "SLV", "226": "GNQ", "232": "ERI",
    "233": "EST", "748": "SWZ", "231": "ETH", "242": "FJI", "246": "FIN",
    "250": "FRA", "266": "GAB", "270": "GMB", "268": "GEO", "276": "DEU",
    "288": "GHA", "300": "GRC", "308": "GRD", "320": "GTM", "324": "GIN",
    "624": "GNB", "328": "GUY", "332": "HTI", "340": "HND", "348": "HUN",
    "352": "ISL", "356": "IND", "360": "IDN", "364": "IRN", "368": "IRQ",
    "372": "IRL", "376": "ISR", "380": "ITA", "388": "JAM", "392": "JPN",
    "400": "JOR", "398": "KAZ", "404": "KEN", "408": "PRK", "410": "KOR",
    "-99": "XKX", "414": "KWT", "417": "KGZ", "418": "LAO", "428": "LVA",
    "422": "LBN", "426": "LSO", "430": "LBR", "434": "LBY", "438": "LIE",
    "440": "LTU", "442": "LUX", "450": "MDG", "454": "MWI", "458": "MYS",
    "462": "MDV", "466": "MLI", "470": "MLT", "478": "MRT", "480": "MUS",
    "484": "MEX", "498": "MDA", "492": "MCO", "496": "MNG", "499": "MNE",
    "504": "MAR", "508": "MOZ", "104": "MMR", "516": "NAM", "524": "NPL",
    "528": "NLD", "554": "NZL", "558": "NIC", "562": "NER", "566": "NGA",
    "807": "MKD", "578": "NOR", "512": "OMN", "586": "PAK", "591": "PAN",
    "598": "PNG", "600": "PRY", "604": "PER", "608": "PHL", "616": "POL",
    "620": "PRT", "634": "QAT", "642": "ROU", "643": "RUS", "646": "RWA",
    "659": "KNA", "662": "LCA", "670": "VCT", "882": "WSM", "682": "SAU",
    "686": "SEN", "688": "SRB", "690": "SYC", "694": "SLE", "702": "SGP",
    "703": "SVK", "705": "SVN", "090": "SLB", "706": "SOM", "710": "ZAF",
    "728": "SSD", "724": "ESP", "144": "LKA", "729": "SDN", "740": "SUR",
    "752": "SWE", "756": "CHE", "760": "SYR", "158": "TWN", "762": "TJK",
    "834": "TZA", "764": "THA", "626": "TLS", "768": "TGO", "780": "TTO",
    "788": "TUN", "792": "TUR", "795": "TKM", "800": "UGA", "804": "UKR",
    "784": "ARE", "826": "GBR", "840": "USA", "858": "URY", "860": "UZB",
    "548": "VUT", "862": "VEN", "704": "VNM", "887": "YEM", "894": "ZMB",
    "716": "ZWE", "010": "ATA", "304": "GRL", "175": "MYT", "531": "CUW",
    "534": "SXM", "540": "NCL", "570": "NIU", "580": "MNP", "612": "PCN",
    "630": "PRI", "652": "BLM", "654": "SHN", "663": "MAF", "666": "SPM",
    "796": "TCA", "850": "VIR", "876": "WLF"
};

// =====================================================
// Security: HTML sanitization
// =====================================================
/** Escape HTML special characters to prevent XSS injection */
function escapeHTML(str) {
    if (typeof str !== "string") return "";
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// =====================================================
// Styles
// =====================================================
const DEFAULT_STYLE = {
    fillColor: "#1F1A14",
    weight: 0.6,
    opacity: 0.5,
    color: "#2E2820",
    fillOpacity: 0.7
};

function defaultStyle() {
    return { ...DEFAULT_STYLE };
}

const STATUS_COLORS = {
    visa_free: "#7A9B76",
    e_visa: "#C9874A",
    visa_required: "#A8453A",
    home: "#3F5878"
};

const STATUS_LABELS = {
    visa_free: "Visa Free",
    e_visa: "E-Visa / Visa on Arrival",
    visa_required: "Visa Required",
    home: "Home Country"
};

const STATUS_CLASSES = {
    visa_free: "visa-free",
    e_visa: "e-visa",
    visa_required: "visa-required",
    home: "home"
};

function countryStyle(feature) {
    const isoCode = feature.properties["ISO3166-1-Alpha-3"];
    const visaInfo = currentVisaData?.[isoCode];

    if (!visaInfo) return DEFAULT_STYLE;

    return {
        fillColor: STATUS_COLORS[visaInfo.status] || "#1F1A14",
        weight: 0.7,
        opacity: 0.85,
        color: "#0F0D0A",
        fillOpacity: 0.82
    };
}

// =====================================================
// Feature Interaction
// =====================================================
// Shared tooltip instance — bound once per layer, content updated on hover
function onEachFeature(feature, layer) {
    // Bind tooltip once (empty), update content on hover
    layer.bindTooltip("", {
        className: "country-tooltip",
        sticky: true,
        direction: "top",
        offset: [0, -10]
    });

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: onCountryClick
    });
}

function highlightFeature(e) {
    const layer = e.target;
    const isoCode = layer.feature.properties["ISO3166-1-Alpha-3"];
    const countryName = COUNTRY_INFO[isoCode]?.name || layer.feature.properties.name || "Unknown";
    const visaInfo = currentVisaData?.[isoCode];

    layer.setStyle({
        weight: 1.8,
        color: "#C8A165",
        fillOpacity: 0.95
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    // Update existing tooltip content instead of bind/unbind
    // Sanitize countryName — it comes from external GeoJSON data
    const safeName = escapeHTML(countryName);
    let tooltipContent = `<strong>${safeName}</strong>`;
    if (visaInfo && currentVisaData) {
        // STATUS_LABELS values are hardcoded constants, safe to use directly
        tooltipContent += `<div class="tooltip-status">${STATUS_LABELS[visaInfo.status] || "Unknown"}</div>`;
    }
    layer.setTooltipContent(tooltipContent);
    layer.openTooltip();
}

function resetHighlight(e) {
    const layer = e.target;
    // Apply correct style directly instead of resetStyle + setStyle
    if (currentVisaData) {
        layer.setStyle(countryStyle(layer.feature));
    } else {
        layer.setStyle(DEFAULT_STYLE);
    }
    layer.closeTooltip();
}

function onCountryClick(e) {
    const isoCode = e.target.feature.properties["ISO3166-1-Alpha-3"];
    const countryName = COUNTRY_INFO[isoCode]?.name || e.target.feature.properties.name || "Unknown";
    const flag = COUNTRY_INFO[isoCode]?.flag || "";
    const visaInfo = currentVisaData?.[isoCode];

    if (!currentVisaData) return;

    showInfoPanel(countryName, flag, isoCode, visaInfo);
    map.fitBounds(e.target.getBounds(), { padding: [50, 50], maxZoom: 5 });
}

// =====================================================
// Info Panel (cached DOM refs)
// =====================================================
function showInfoPanel(countryName, flag, isoCode, visaInfo) {
    const els = getPanelEls();

    els.flag.textContent = flag;
    els.country.textContent = countryName;

    if (visaInfo) {
        const status = visaInfo.status || "visa_required";
        els.badge.textContent = STATUS_LABELS[status] || "Unknown";
        els.badge.className = STATUS_CLASSES[status] || "";

        // Country facts strip — shown whenever data is available
        renderCountryFacts(els.facts, isoCode);

        // Practical stats (processing / fee / validity) — from template, with overrides
        renderPracticalStats(els.stats, status, visaInfo);

        // Sanitize values from external data sources
        const safeInfo = escapeHTML(visaInfo.info || "No additional info.");
        els.details.innerHTML = `<p class="details-body">${safeInfo}</p>`;

        // Required documents — only for non-home, non-visa-free statuses where applicable
        renderDocuments(els.documents, els.documentsList, status);

        els.changes.textContent = visaInfo.changes || "No major recent changes reported.";
        els.tips.textContent = visaInfo.tips || "Check the embassy website for latest information.";
    } else {
        els.badge.textContent = "No Data";
        els.badge.className = "visa-required";
        els.facts.classList.add("hidden");
        els.stats.classList.add("hidden");
        els.documents.classList.add("hidden");
        els.details.innerHTML = `<p class="details-body">No visa data available for this country with your selected passport.</p>`;
        els.changes.textContent = "No information available.";
        els.tips.textContent = "Contact the embassy for visa requirements.";
    }

    els.panel.classList.remove("hidden");
    replayPanelStagger(els.panel);

    // Focus management: remember where focus came from, move it into the panel.
    previouslyFocusedEl = document.activeElement;
    requestAnimationFrame(() => {
        document.getElementById("close-panel")?.focus();
    });
}

/**
 * Render the horizontal 5-cell country facts strip.
 * Falls back to hiding the strip if no facts exist for this country.
 */
function renderCountryFacts(container, isoCode) {
    const facts = (typeof COUNTRY_FACTS !== "undefined") ? COUNTRY_FACTS[isoCode] : null;
    if (!facts) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }
    container.classList.remove("hidden");
    const cells = [
        { label: "Capital",  value: facts.capital },
        { label: "Language", value: facts.language },
        { label: "Currency", value: facts.currency },
        { label: "Time",     value: facts.timezone },
        { label: "Region",   value: facts.region }
    ];
    container.innerHTML = cells.map(c => `
        <div class="panel-fact">
            <span class="panel-fact-label">${escapeHTML(c.label)}</span>
            <span class="panel-fact-value">${escapeHTML(c.value || "—")}</span>
        </div>
    `).join("");
}

/**
 * Render the practical stats row: processing / fee / validity.
 * Hidden for visa_free and home statuses (no meaningful values).
 * Per-country overrides via visaInfo.duration fall through to the validity slot.
 */
function renderPracticalStats(container, status, visaInfo) {
    const template = (typeof STATUS_TEMPLATES !== "undefined") ? STATUS_TEMPLATES[status] : null;
    if (!template || (!template.processing && !template.fee && !template.validity)) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    // If per-country data has a real duration string (not "-"), prefer it for validity
    const validity = (visaInfo.duration && visaInfo.duration !== "-")
        ? visaInfo.duration
        : template.validity;

    const cells = [
        { label: "Processing", value: template.processing },
        { label: "Fee",        value: template.fee },
        { label: "Validity",   value: validity }
    ].filter(c => c.value);

    if (cells.length === 0) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    container.classList.remove("hidden");
    container.innerHTML = cells.map(c => `
        <div class="panel-stat">
            <span class="panel-stat-label">${escapeHTML(c.label)}</span>
            <span class="panel-stat-value">${escapeHTML(c.value)}</span>
        </div>
    `).join("");
}

/**
 * Render the required-documents checklist.
 * Hidden for visa_free (no list) and home statuses.
 */
function renderDocuments(container, list, status) {
    const template = (typeof STATUS_TEMPLATES !== "undefined") ? STATUS_TEMPLATES[status] : null;
    if (!template || !template.documents || template.documents.length === 0) {
        container.classList.add("hidden");
        list.innerHTML = "";
        return;
    }
    container.classList.remove("hidden");
    list.innerHTML = template.documents.map(doc => `
        <li><span class="check" aria-hidden="true">✓</span> ${escapeHTML(doc)}</li>
    `).join("");
}

/**
 * Restart the stagger-reveal animation on each panel open.
 * CSS animations only fire on initial render — toggling a class
 * with a forced reflow re-triggers them.
 */
function replayPanelStagger(panel) {
    panel.classList.remove("is-revealing");
    // Force reflow so the browser re-applies the animation
    void panel.offsetWidth;
    panel.classList.add("is-revealing");
}

function closeInfoPanel() {
    const panel = getPanelEls().panel;
    if (panel.classList.contains("hidden")) return;
    panel.classList.add("hidden");
    // Restore focus to where the user came from (search input, country layer, etc.).
    if (previouslyFocusedEl && typeof previouslyFocusedEl.focus === "function") {
        previouslyFocusedEl.focus();
    }
    previouslyFocusedEl = null;
}

/** Trap Tab inside the info-panel while it's open. */
function trapPanelFocus(e) {
    if (e.key !== "Tab") return;
    const panel = document.getElementById("info-panel");
    if (!panel || panel.classList.contains("hidden")) return;
    const focusable = panel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

// =====================================================
// Loading Indicator
// =====================================================
function showLoading() {
    document.getElementById("loading-overlay")?.classList.remove("hidden");
}

function hideLoading() {
    document.getElementById("loading-overlay")?.classList.add("hidden");
}

// =====================================================
// Passport Selection (event delegation, async data load)
// =====================================================
/** Open/close combobox state — keeps aria-expanded in sync with .active. */
function setComboboxOpen(input, dropdown, open) {
    dropdown.classList.toggle("active", open);
    input.setAttribute("aria-expanded", String(open));
    if (!open) input.removeAttribute("aria-activedescendant");
}

function setPassportSearchValues(code) {
    const info = COUNTRY_INFO[code] || {};
    document.querySelectorAll("[data-passport-search]").forEach(input => {
        input.value = `${info.flag || ""} ${info.name || code}`;
        input.dataset.selectedCode = code;
    });
}

function initPassportSelector() {
    const controls = Array.from(document.querySelectorAll("[data-passport-search]"))
        .map(searchInput => {
            const dropdown = searchInput
                .closest(".select-wrapper")
                ?.querySelector("[data-passport-dropdown]");
            return dropdown ? { searchInput, dropdown } : null;
        })
        .filter(Boolean);

    if (!controls.length) return;

    // Build passport list from ALL countries in the dataset
    const allCodes = getAllPassportCodes();
    const passportList = allCodes
        .filter(code => COUNTRY_INFO[code]) // Only include codes we have names for
        .map(code => ({
            code,
            name: COUNTRY_INFO[code]?.name || code,
            flag: COUNTRY_INFO[code]?.flag || ""
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    function closePassportDropdowns(exceptInput = null) {
        controls.forEach(({ searchInput, dropdown }) => {
            if (searchInput !== exceptInput) {
                setComboboxOpen(searchInput, dropdown, false);
            }
        });
    }

    controls.forEach(({ searchInput, dropdown }) => {
        let highlightedIndex = -1;

        // Event delegation — single listener per dropdown instead of per item
        dropdown.addEventListener("click", (e) => {
            const item = e.target.closest(".dropdown-item");
            if (!item) return;
            const code = item.dataset.code;
            selectPassport(code);
            setPassportSearchValues(code);
            closePassportDropdowns();
        });

        function renderDropdown(filter = "") {
            const f = filter.trim().toLowerCase();
            const filtered = f
                ? passportList.filter(p =>
                    p.name.toLowerCase().includes(f) ||
                    p.code.toLowerCase().includes(f)
                )
                : passportList;

            const idPrefix = dropdown.id || "passport-opt";
            dropdown.innerHTML = filtered.map((p, i) => `
                <div class="dropdown-item" role="option" id="${escapeHTML(idPrefix)}-${i}" data-code="${escapeHTML(p.code)}">
                    <span class="flag" aria-hidden="true">${escapeHTML(p.flag)}</span>
                    <span>${escapeHTML(p.name)}</span>
                </div>
            `).join("");
            highlightedIndex = -1;
        }

        searchInput.addEventListener("focus", () => {
            closePassportDropdowns(searchInput);
            // If a passport is already selected, show the full list (not filtered by "🇹🇷 Turkey").
            const hasSelection = !!searchInput.dataset.selectedCode;
            if (hasSelection) {
                searchInput.select();        // pre-select so the user can type a new one
                renderDropdown("");
            } else {
                renderDropdown(searchInput.value);
            }
            setComboboxOpen(searchInput, dropdown, true);
        });

        searchInput.addEventListener("input", () => {
            // The user is typing — any previous selection is no longer relevant.
            delete searchInput.dataset.selectedCode;
            renderDropdown(searchInput.value);
            setComboboxOpen(searchInput, dropdown, true);
        });

        searchInput.addEventListener("keydown", (e) => {
            const items = dropdown.querySelectorAll(".dropdown-item");
            if (!items.length && e.key !== "Escape") return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
                updateHighlight(items);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                highlightedIndex = Math.max(highlightedIndex - 1, 0);
                updateHighlight(items);
            } else if (e.key === "Enter" && highlightedIndex >= 0) {
                e.preventDefault();
                items[highlightedIndex]?.click();
                highlightedIndex = -1;
            } else if (e.key === "Escape") {
                setComboboxOpen(searchInput, dropdown, false);
                searchInput.blur();
            }
        });

        function updateHighlight(items) {
            items.forEach((item, i) => {
                const isHi = i === highlightedIndex;
                item.classList.toggle("highlighted", isHi);
                item.setAttribute("aria-selected", String(isHi));
                if (isHi) {
                    item.scrollIntoView({ block: "nearest" });
                    searchInput.setAttribute("aria-activedescendant", item.id);
                }
            });
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".passport-selector")) {
            closePassportDropdowns();
        }
    });
}

// Monotonic id per selection — async completions from superseded selections are
// discarded so rapid passport switches can't apply out of order (last click wins).
let selectRequestSeq = 0;

async function selectPassport(code) {
    selectedPassport = code;
    const requestId = ++selectRequestSeq;
    showLoading();

    try {
        const data = await loadVisaData(code);
        if (requestId !== selectRequestSeq) return;

        if (!data) {
            console.error("Failed to load visa data for", code);
            currentVisaData = null;
            if (geoJsonLayer) geoJsonLayer.setStyle(defaultStyle);
            return;
        }

        currentVisaData = data;
        try { localStorage.setItem(PASSPORT_STORAGE_KEY, code); } catch (e) { /* private mode — ignore */ }

        document.body.classList.remove("is-initial");
        document.getElementById("welcome-overlay").classList.add("hidden");
        document.getElementById("dest-search-wrapper")?.classList.remove("hidden");

        if (geoJsonLayer) {
            geoJsonLayer.setStyle(countryStyle);
        }

        updateStats();
        document.getElementById("stats-bar").classList.add("visible");
        closeInfoPanel();

        // Show data source info with actual date
        const sourceEl = document.getElementById("data-source");
        if (sourceEl) {
            sourceEl.classList.remove("hidden");
            const meta = typeof getDataMeta === "function" ? getDataMeta() : null;
            if (meta?.lastUpdated) {
                const dateStr = new Date(meta.lastUpdated).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric"
                });
                const infoSpan = sourceEl.querySelector("span:last-child");
                if (infoSpan) {
                    infoSpan.innerHTML =
                        `Data from <a href="https://github.com/imorte/passport-index-data" target="_blank" rel="noopener noreferrer">Passport Index</a> ` +
                        `(updated ${escapeHTML(dateStr)}). For reference only \u2014 always verify with official embassy sources before travel.`;
                }

                // Staleness warning: if data is older than 60 days, show persistent banner
                const dataAge = Date.now() - new Date(meta.lastUpdated).getTime();
                const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;
                if (dataAge > SIXTY_DAYS) {
                    const daysOld = Math.floor(dataAge / (24 * 60 * 60 * 1000));
                    const banner = document.getElementById("staleness-banner");
                    const bannerText = document.getElementById("staleness-text");
                    if (banner && bannerText) {
                        bannerText.textContent = `Visa data is ${daysOld} days old. Requirements may have changed \u2014 verify with official sources.`;
                        banner.classList.remove("hidden");
                    }
                }
            }
        }

    } catch (err) {
        if (requestId !== selectRequestSeq) return;
        console.error("Error loading visa data:", err);
        // Reset state — don't leave stale data styled on the map.
        currentVisaData = null;
        if (geoJsonLayer) geoJsonLayer.setStyle(defaultStyle);
        // Show persistent error recovery UI instead of disappearing toast
        const recovery = document.getElementById("error-recovery");
        if (recovery) {
            const msg = recovery.querySelector("p");
            const userMessage = err?.message?.startsWith("Local file mode")
                ? err.message
                : "Failed to load visa data. Check your connection and try again.";
            if (msg) msg.textContent = userMessage;
            recovery.classList.remove("hidden");
            requestAnimationFrame(() => {
                document.getElementById("retry-btn")?.focus();
            });
        }
    } finally {
        // A superseded request must not hide the overlay the newer request owns.
        if (requestId === selectRequestSeq) hideLoading();
    }
}

function updateStats() {
    if (!currentVisaData) return;

    let free = 0, evisa = 0, required = 0;

    for (const [code, data] of Object.entries(currentVisaData)) {
        if (data.status === "home") continue;
        switch (data.status) {
            case "visa_free": free++; break;
            case "e_visa": evisa++; break;
            case "visa_required": required++; break;
        }
    }

    // Prevent screen-reader flood: mark bar as busy during animation, announce final values once.
    const statsBar = document.getElementById("stats-bar");
    if (statsBar) statsBar.setAttribute("aria-busy", "true");

    const longestDelay = 160;
    const animDuration = 1200;
    const usesReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const clearBusyMs = usesReducedMotion ? 50 : longestDelay + animDuration + 100;

    setTimeout(() => {
        if (statsBar) statsBar.setAttribute("aria-busy", "false");
    }, clearBusyMs);

    // Staggered editorial reveal — left to right, ~80ms apart
    animateCounter("stat-free", free, 0);
    animateCounter("stat-evisa", evisa, 80);
    animateCounter("stat-required", required, longestDelay);
}

function animateCounter(elementId, target, delay = 0) {
    const el = document.querySelector(`#${elementId} .stat-num`);
    if (!el) return;
    // Use stored last value — don't parse rendered text, which can be mid-animation.
    const start = Number(el.dataset.lastValue) || 0;
    if (start === target) return;
    el.dataset.lastValue = String(target);

    // Respect reduced-motion: snap directly.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        el.textContent = String(target);
        return;
    }

    const duration = 1200;
    setTimeout(() => {
        const startTime = performance.now();
        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Expo-out easing for slow, confident settle
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            el.textContent = Math.round(start + (target - start) * eased);
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    }, delay);
}

// =====================================================
// Destination Search
// =====================================================
function initDestSearch() {
    const input = document.getElementById("dest-search");
    const dropdown = document.getElementById("dest-dropdown");
    if (!input || !dropdown) return;

    let highlightedIndex = -1;

    function updateHighlight(items) {
        items.forEach((item, i) => {
            const isHi = i === highlightedIndex;
            item.classList.toggle("highlighted", isHi);
            item.setAttribute("aria-selected", String(isHi));
            if (isHi) {
                item.scrollIntoView({ block: "nearest" });
                input.setAttribute("aria-activedescendant", item.id);
            }
        });
    }

    // Event delegation on dropdown
    dropdown.addEventListener("click", (e) => {
        const item = e.target.closest(".dropdown-item");
        if (!item) return;
        const code = item.dataset.code;
        zoomToCountry(code);
        input.value = "";
        setComboboxOpen(input, dropdown, false);
    });

    input.addEventListener("input", () => {
        const filter = input.value.trim().toLowerCase();
        if (!filter || filter.length < 2) {
            setComboboxOpen(input, dropdown, false);
            return;
        }

        const allCodes = Object.keys(COUNTRY_INFO);
        const matches = allCodes
            .filter(code => {
                const name = COUNTRY_INFO[code]?.name || "";
                return name.toLowerCase().includes(filter) || code.toLowerCase().includes(filter);
            })
            .slice(0, 15);

        if (matches.length === 0) {
            setComboboxOpen(input, dropdown, false);
            return;
        }

        dropdown.innerHTML = matches.map((code, i) => `
            <div class="dropdown-item" role="option" id="dest-opt-${i}" data-code="${escapeHTML(code)}">
                <span class="flag" aria-hidden="true">${escapeHTML(COUNTRY_INFO[code]?.flag || "")}</span>
                <span>${escapeHTML(COUNTRY_INFO[code]?.name || code)}</span>
            </div>
        `).join("");
        highlightedIndex = -1;
        setComboboxOpen(input, dropdown, true);
    });

    input.addEventListener("keydown", (e) => {
        const items = dropdown.querySelectorAll(".dropdown-item");
        if (e.key === "Escape") {
            setComboboxOpen(input, dropdown, false);
            input.blur();
        } else if (!items.length) {
            return;
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
            updateHighlight(items);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, 0);
            updateHighlight(items);
        } else if (e.key === "Enter" && highlightedIndex >= 0) {
            e.preventDefault();
            items[highlightedIndex]?.click();
            highlightedIndex = -1;
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest("#dest-search-wrapper")) {
            setComboboxOpen(input, dropdown, false);
        }
    });
}

function zoomToCountry(isoCode) {
    if (!geoJsonLayer) return;

    geoJsonLayer.eachLayer(layer => {
        if (layer.feature.properties["ISO3166-1-Alpha-3"] === isoCode) {
            map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 5 });
            // Open info panel if visa data is loaded
            if (currentVisaData) {
                const countryName = COUNTRY_INFO[isoCode]?.name || "Unknown";
                const flag = COUNTRY_INFO[isoCode]?.flag || "";
                showInfoPanel(countryName, flag, isoCode, currentVisaData[isoCode]);
            }
        }
    });
}

// =====================================================
// Init
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    initMap();
    initPassportSelector();
    initDestSearch();

    document.getElementById("close-panel")?.addEventListener("click", closeInfoPanel);

    // Retry button for error recovery — re-attempt whichever step failed.
    document.getElementById("retry-btn")?.addEventListener("click", () => {
        document.getElementById("error-recovery")?.classList.add("hidden");
        if (geoJsonLayer) {
            // Map loaded — failure was on visa-data load.
            if (selectedPassport) selectPassport(selectedPassport);
        } else {
            // Map never loaded — retry the GeoJSON fetch.
            loadGeoJSON();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeInfoPanel();
        trapPanelFocus(e);
    });

    // Restore the previously selected passport, if any.
    try {
        const saved = localStorage.getItem(PASSPORT_STORAGE_KEY);
        if (saved && typeof saved === "string" && /^[A-Z]{3}$/.test(saved) && COUNTRY_INFO[saved]) {
            setPassportSearchValues(saved);
            // Bounded poll — a map that never loads must not retry forever (~30s cap, past fetch+fallback).
            let restoreAttempts = 0;
            const MAX_RESTORE_ATTEMPTS = 120;
            const attempt = () => {
                if (geoJsonLayer) {
                    selectPassport(saved);
                } else if (++restoreAttempts < MAX_RESTORE_ATTEMPTS) {
                    setTimeout(attempt, 250);
                } else {
                    showMapLoadError();
                }
            };
            setTimeout(attempt, 250);
        }
    } catch (e) { /* private mode — ignore */ }
});

// =====================================================
// Global error handlers — surface failures instead of swallowing them.
// =====================================================
window.addEventListener("error", (e) => {
    console.error("[global error]", e.message, e.filename + ":" + e.lineno);
});
window.addEventListener("unhandledrejection", (e) => {
    console.error("[unhandled promise rejection]", e.reason);
});
