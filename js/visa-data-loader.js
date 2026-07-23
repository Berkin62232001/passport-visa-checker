// =====================================================
// Visa Data Loader — loads validated local data
//
// Security model:
//   PRIMARY:  Load from data/passport-index-validated.json (your repo)
//             — validated & committed by GitHub Actions pipeline
//             — SHA-256 integrity checked against data/data-meta.json
//   FAIL CLOSED: If local validated data or metadata is missing/corrupt,
//                stop instead of trusting unreviewed runtime data.
// =====================================================

// Local validated data paths (served from your own repo/origin)
const LOCAL_DATA_PATH = "data/passport-index-validated.json";
const LOCAL_META_PATH = "data/data-meta.json";

function isLocalFileMode() {
    return typeof window !== "undefined" && window.location?.protocol === "file:";
}

// Cached parsed data (loaded once per session)
let _passportData = null;
let _dataMeta = null;
// In-flight load promise — concurrent callers share one fetch instead of racing.
let _passportDataPromise = null;

// Network timeout for local data fetches.
// Named distinctly from app.js's FETCH_TIMEOUT_MS because classic scripts
// share the global lexical scope — duplicate const at top-level throws.
const LOADER_FETCH_TIMEOUT_MS = 15000;

function loaderFetchWithTimeout(url, opts = {}, timeoutMs = LOADER_FETCH_TIMEOUT_MS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    return fetch(url, { ...opts, signal: ctrl.signal })
        .finally(() => clearTimeout(t));
}

// NOTE on caching: we used to mirror the JSON payload into localStorage with a
// SHA-256 stored alongside, but both the payload and its hash live in the same
// untrusted bucket — an attacker with XSS write access could poison both and the
// integrity check would pass. The data file gzips to ~48 KB and is HTTP-cached
// by the browser on first load, so the session-level _passportData cache plus
// HTTP caching gives us the speed without the foot-gun.

// ISO 3166-1 alpha-2 → alpha-3 mapping (199 countries)
const ISO2_TO_ISO3 = {
    AD:"AND",AE:"ARE",AF:"AFG",AG:"ATG",AL:"ALB",AM:"ARM",AO:"AGO",
    AR:"ARG",AT:"AUT",AU:"AUS",AZ:"AZE",BA:"BIH",BB:"BRB",BD:"BGD",
    BE:"BEL",BF:"BFA",BG:"BGR",BH:"BHR",BI:"BDI",BJ:"BEN",BN:"BRN",
    BO:"BOL",BR:"BRA",BS:"BHS",BT:"BTN",BW:"BWA",BY:"BLR",BZ:"BLZ",
    CA:"CAN",CD:"COD",CF:"CAF",CG:"COG",CH:"CHE",CI:"CIV",CL:"CHL",
    CM:"CMR",CN:"CHN",CO:"COL",CR:"CRI",CU:"CUB",CV:"CPV",CY:"CYP",
    CZ:"CZE",DE:"DEU",DJ:"DJI",DK:"DNK",DM:"DMA",DO:"DOM",DZ:"DZA",
    EC:"ECU",EE:"EST",EG:"EGY",ER:"ERI",ES:"ESP",ET:"ETH",FI:"FIN",
    FJ:"FJI",FM:"FSM",FR:"FRA",GA:"GAB",GB:"GBR",GD:"GRD",GE:"GEO",
    GH:"GHA",GM:"GMB",GN:"GIN",GQ:"GNQ",GR:"GRC",GT:"GTM",GW:"GNB",
    GY:"GUY",HK:"HKG",HN:"HND",HR:"HRV",HT:"HTI",HU:"HUN",ID:"IDN",
    IE:"IRL",IL:"ISR",IN:"IND",IQ:"IRQ",IR:"IRN",IS:"ISL",IT:"ITA",
    JM:"JAM",JO:"JOR",JP:"JPN",KE:"KEN",KG:"KGZ",KH:"KHM",KI:"KIR",
    KM:"COM",KN:"KNA",KP:"PRK",KR:"KOR",KW:"KWT",KZ:"KAZ",LA:"LAO",
    LB:"LBN",LC:"LCA",LI:"LIE",LK:"LKA",LR:"LBR",LS:"LSO",LT:"LTU",
    LU:"LUX",LV:"LVA",LY:"LBY",MA:"MAR",MC:"MCO",MD:"MDA",ME:"MNE",
    MG:"MDG",MH:"MHL",MK:"MKD",ML:"MLI",MM:"MMR",MN:"MNG",MO:"MAC",
    MR:"MRT",MT:"MLT",MU:"MUS",MV:"MDV",MW:"MWI",MX:"MEX",MY:"MYS",
    MZ:"MOZ",NA:"NAM",NE:"NER",NG:"NGA",NI:"NIC",NL:"NLD",NO:"NOR",
    NP:"NPL",NR:"NRU",NZ:"NZL",OM:"OMN",PA:"PAN",PE:"PER",PG:"PNG",
    PH:"PHL",PK:"PAK",PL:"POL",PS:"PSE",PT:"PRT",PW:"PLW",PY:"PRY",
    QA:"QAT",RO:"ROU",RS:"SRB",RU:"RUS",RW:"RWA",SA:"SAU",SB:"SLB",
    SC:"SYC",SD:"SDN",SE:"SWE",SG:"SGP",SI:"SVN",SK:"SVK",SL:"SLE",
    SM:"SMR",SN:"SEN",SO:"SOM",SR:"SUR",SS:"SSD",ST:"STP",SV:"SLV",
    SY:"SYR",SZ:"SWZ",TD:"TCD",TG:"TGO",TH:"THA",TJ:"TJK",TL:"TLS",
    TM:"TKM",TN:"TUN",TO:"TON",TR:"TUR",TT:"TTO",TV:"TUV",TW:"TWN",
    TZ:"TZA",UA:"UKR",UG:"UGA",US:"USA",UY:"URY",UZ:"UZB",VA:"VAT",
    VC:"VCT",VE:"VEN",VN:"VNM",VU:"VUT",WS:"WSM",XK:"XKX",YE:"YEM",
    ZA:"ZAF",ZM:"ZMB",ZW:"ZWE"
};

// Reverse mapping ISO-3 → ISO-2
const ISO3_TO_ISO2 = {};
for (const [iso2, iso3] of Object.entries(ISO2_TO_ISO3)) {
    ISO3_TO_ISO2[iso3] = iso2;
}

// ── Status mapping ──────────────────────────────────
function mapStatus(rawStatus) {
    switch (rawStatus) {
        case "visa free":        return "visa_free";
        case "visa on arrival":
        case "e-visa":
        case "eta":              return "e_visa";
        case "visa required":
        case "no admission":
        case "covid ban":        return "visa_required";
        default:                 return "visa_required";
    }
}

function statusInfo(rawStatus) {
    switch (rawStatus) {
        case "visa free":        return "Visa-free access for short-term visits.";
        case "visa on arrival":  return "Visa on arrival available at port of entry.";
        case "e-visa":           return "Electronic visa required. Apply online before travel.";
        case "eta":              return "Electronic Travel Authorization (ETA) required before boarding.";
        case "visa required":    return "A visa must be obtained from the embassy or consulate before travel.";
        case "no admission":     return "Entry not permitted or heavily restricted.";
        case "covid ban":        return "Entry restricted or suspended due to travel ban.";
        default:                 return "Visa requirements unknown. Check with the embassy.";
    }
}

function defaultTips(mappedStatus) {
    switch (mappedStatus) {
        case "visa_free":     return "Ensure your passport is valid for at least 6 months beyond your planned stay.";
        case "e_visa":        return "Apply online before departure or obtain on arrival at the airport. Check official websites for current processing times.";
        case "visa_required": return "Apply well in advance at the embassy. Check for current processing times and requirements.";
        default:              return "Check the embassy website for latest information.";
    }
}

// ── Data loading with integrity check ───────────────
/**
 * SHA-256 hash of a string using Web Crypto API.
 * Used to verify data integrity against the hash in data-meta.json.
 */
async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate the basic structure of passport data.
 * Returns true if valid, false if suspect.
 */
function validateData(data) {
    if (typeof data !== "object" || data === null || Array.isArray(data)) return false;
    const keys = Object.keys(data);
    if (keys.length < 100) return false; // Expect 150+ countries
    // Spot-check a few entries
    for (const key of keys.slice(0, 5)) {
        if (!/^[A-Z]{2}$/.test(key)) return false;
        if (typeof data[key] !== "object") return false;
    }
    return true;
}

/**
 * Load passport data from local validated file, with integrity check.
 * If local data is unavailable, fail closed; the GitHub Actions validator is
 * the only path that should ingest upstream data.
 *
 * Session-level cache: the parsed object is held in `_passportData` for the
 * lifetime of the tab. Cross-session caching is handled by the browser's HTTP
 * cache on the served files — no localStorage shadow copy.
 */
async function fetchPassportData() {
    if (_passportData) return _passportData;

    if (isLocalFileMode()) {
        throw new Error("Local file mode cannot load visa data. Run npm run dev and open the localhost URL shown in Terminal.");
    }

    // Deduplicate concurrent calls: share the in-flight promise, and clear it on
    // failure so the Retry button can attempt a fresh fetch.
    if (!_passportDataPromise) {
        _passportDataPromise = loadAndVerifyLocalData().catch(err => {
            _passportDataPromise = null;
            throw err;
        });
    }
    return _passportDataPromise;
}

async function loadAndVerifyLocalData() {
    // Try local validated data first (from your own repo)
    try {
        const [dataResp, metaResp] = await Promise.all([
            loaderFetchWithTimeout(LOCAL_DATA_PATH),
            loaderFetchWithTimeout(LOCAL_META_PATH)
        ]);

        if (!dataResp.ok || !metaResp.ok) {
            throw new Error(`Local data fetch failed (data ${dataResp.status}, meta ${metaResp.status})`);
        }

        const rawText = await dataResp.text();
        const meta = await metaResp.json();
        const data = JSON.parse(rawText);

        // Integrity check: hash the CANONICAL JSON (re-serialized), not the raw file
        // bytes, so a harmless reformat or EOL change can't trip the check. Detects
        // accidental corruption, not tampering — data and hash are same-origin, so HTTPS
        // is the real trust boundary.
        if (meta.sha256) {
            const computedHash = await sha256(JSON.stringify(data));
            if (computedHash !== meta.sha256) {
                console.error(
                    "DATA INTEGRITY FAILURE: SHA-256 mismatch.\n" +
                    `Expected: ${meta.sha256}\n` +
                    `Got:      ${computedHash}\n` +
                    "The data file appears corrupted. Failing closed."
                );
                throw new Error("Integrity check failed");
            }
        }

        if (!validateData(data)) {
            throw new Error("Local data failed structure validation");
        }

        _passportData = data;
        _dataMeta = meta;
        console.log(`Loaded validated local data (${meta.countryCount} countries, updated ${meta.lastUpdated})`);
        return _passportData;
    } catch (err) {
        console.error("Local validated data unavailable:", err.message);
        throw new Error("Validated visa data is unavailable. Run npm run validate:data before deployment.");
    }
}

/**
 * Get metadata about the loaded data (for staleness warnings).
 */
function getDataMeta() {
    return _dataMeta;
}

// ── Public API ──────────────────────────────────────
/**
 * Load visa data for a given passport (ISO-3 code).
 * Returns an object keyed by destination ISO-3 code.
 */
async function loadVisaData(passportIso3) {
    const rawData = await fetchPassportData();

    const passportIso2 = ISO3_TO_ISO2[passportIso3];
    if (!passportIso2 || !rawData[passportIso2]) {
        console.warn(`No passport data found for ${passportIso3} (${passportIso2})`);
        return null;
    }

    const passportRow = rawData[passportIso2];
    const result = {};

    // Get enrichment data if available
    const enrichment = (typeof ENRICHMENT_DATA !== "undefined")
        ? ENRICHMENT_DATA[passportIso3] || {}
        : {};

    for (const [destIso2, entry] of Object.entries(passportRow)) {
        const destIso3 = ISO2_TO_ISO3[destIso2];
        if (!destIso3) continue;

        // Validate entry structure
        if (typeof entry !== "object" || entry === null) continue;

        const rawStatus = typeof entry.status === "string" ? entry.status : "";
        const mapped = mapStatus(rawStatus);

        // Sanitize days
        const days = (typeof entry.days === "number" || /^\d+$/.test(entry.days))
            ? Number(entry.days) : null;
        const durationStr = days ? `${days} days` : "-";

        const enrich = enrichment[destIso3] || {};

        result[destIso3] = {
            status: mapped,
            duration: enrich.duration || durationStr,
            info: enrich.info || statusInfo(rawStatus) + (days ? ` Up to ${days} days.` : ""),
            changes: enrich.changes || "No major recent changes reported.",
            tips: enrich.tips || defaultTips(mapped)
        };
    }

    // Dataset rows carry no self-entry, so set the home country explicitly —
    // otherwise it renders unstyled and the panel claims "No Data".
    result[passportIso3] = {
        status: "home", duration: "-",
        info: "This is your home country!",
        changes: "-", tips: "-"
    };

    return result;
}

/**
 * Get all available passport ISO-3 codes.
 */
function getAllPassportCodes() {
    return Object.values(ISO2_TO_ISO3).sort();
}
