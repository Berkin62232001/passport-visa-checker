#!/usr/bin/env node
/**
 * Passport Data Validator & Updater
 *
 * Security-focused pipeline that:
 *  1. Fetches latest data from upstream (passport-index-data)
 *  2. Validates schema, structure, and size
 *  3. Detects anomalies (sudden large changes = possible compromise)
 *  4. Writes validated data locally with metadata
 *
 * Run by GitHub Actions on a schedule, or manually before deploy.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ── Config ──────────────────────────────────────────
const UPSTREAM_URL =
    "https://raw.githubusercontent.com/imorte/passport-index-data/main/passport-index.json";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "passport-index-validated.json");
const META_PATH = path.join(__dirname, "..", "data", "data-meta.json");

// Security thresholds
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;  // 10 MB max (data is ~2 MB)
const MIN_COUNTRIES = 150;                      // Expect at least 150 passport countries
const MAX_COUNTRIES = 250;                      // Sanity upper bound
const MIN_DESTINATIONS_PER_COUNTRY = 50;        // Each passport should have 50+ destinations
const MAX_CHANGE_PERCENT = 25;                  // Flag if >25% of entries change at once
const VALID_STATUSES = new Set([
    "visa free", "visa required", "visa on arrival",
    "e-visa", "eta", "no admission", "covid ban",
    "-1"  // Some entries use -1 for no data
]);

// ── Helpers ─────────────────────────────────────────
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 30000 }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} from ${url}`));
                res.resume();
                return;
            }

            // Enforce max size to prevent memory exhaustion attacks
            let totalBytes = 0;
            const chunks = [];

            res.on("data", (chunk) => {
                totalBytes += chunk.length;
                if (totalBytes > MAX_RESPONSE_BYTES) {
                    req.destroy();
                    reject(new Error(`Response exceeds ${MAX_RESPONSE_BYTES} bytes — possible data injection`));
                    return;
                }
                chunks.push(chunk);
            });

            res.on("end", () => {
                try {
                    const raw = Buffer.concat(chunks).toString("utf8");
                    const data = JSON.parse(raw);
                    resolve(data);
                } catch (err) {
                    reject(new Error(`Invalid JSON from upstream: ${err.message}`));
                }
            });
        });

        req.on("error", reject);
        req.on("timeout", () => {
            req.destroy();
            reject(new Error("Request timed out"));
        });
    });
}

function sha256(input) {
    return crypto.createHash("sha256").update(input).digest("hex");
}

// ── Validators ──────────────────────────────────────
function validateStructure(data) {
    const errors = [];

    if (typeof data !== "object" || data === null || Array.isArray(data)) {
        errors.push("Root must be a non-null object");
        return errors; // Fatal — can't continue
    }

    const countries = Object.keys(data);

    // Check country count bounds
    if (countries.length < MIN_COUNTRIES) {
        errors.push(`Only ${countries.length} countries found (expected >= ${MIN_COUNTRIES}). Possible data truncation.`);
    }
    if (countries.length > MAX_COUNTRIES) {
        errors.push(`${countries.length} countries found (expected <= ${MAX_COUNTRIES}). Possible data pollution.`);
    }

    // Check each country code is 2 letters
    for (const code of countries) {
        if (!/^[A-Z]{2}$/.test(code)) {
            errors.push(`Invalid country code: "${code}" (expected 2 uppercase letters)`);
        }
    }

    // Validate each passport entry
    for (const [passport, destinations] of Object.entries(data)) {
        if (typeof destinations !== "object" || destinations === null) {
            errors.push(`${passport}: destinations must be an object`);
            continue;
        }

        const destCount = Object.keys(destinations).length;
        if (destCount < MIN_DESTINATIONS_PER_COUNTRY) {
            errors.push(`${passport}: only ${destCount} destinations (expected >= ${MIN_DESTINATIONS_PER_COUNTRY})`);
        }

        // Spot-check entries in this passport
        for (const [dest, entry] of Object.entries(destinations)) {
            if (!/^[A-Z]{2}$/.test(dest)) {
                errors.push(`${passport}->${dest}: invalid destination code`);
                continue;
            }

            if (typeof entry !== "object" || entry === null) {
                errors.push(`${passport}->${dest}: entry must be an object`);
                continue;
            }

            // Validate status field
            const status = entry.status;
            if (typeof status !== "string") {
                errors.push(`${passport}->${dest}: status must be a string, got ${typeof status}`);
            } else if (!VALID_STATUSES.has(status.toLowerCase())) {
                errors.push(`${passport}->${dest}: unknown status "${status}"`);
            }

            // Validate days field (optional but must be numeric if present)
            if (entry.days !== undefined && entry.days !== null && entry.days !== "") {
                const days = Number(entry.days);
                if (isNaN(days) || days < 0 || days > 3650) {
                    errors.push(`${passport}->${dest}: invalid days value "${entry.days}"`);
                }
            }

            // Check for unexpected fields (data injection via extra keys)
            const allowedKeys = new Set(["status", "days"]);
            for (const key of Object.keys(entry)) {
                if (!allowedKeys.has(key)) {
                    errors.push(`${passport}->${dest}: unexpected field "${key}" (possible injection)`);
                }
            }
        }
    }

    return errors;
}

function detectAnomalies(newData, oldData) {
    const warnings = [];

    if (!oldData) {
        warnings.push("No previous data to compare — skipping anomaly detection (first run).");
        return warnings;
    }

    const oldCountries = Object.keys(oldData);
    const newCountries = Object.keys(newData);

    // Check for sudden country count change
    const countDiff = Math.abs(newCountries.length - oldCountries.length);
    if (countDiff > 10) {
        warnings.push(`Country count changed by ${countDiff} (${oldCountries.length} → ${newCountries.length}). Investigate.`);
    }

    // Check for mass status changes (possible data corruption)
    let totalEntries = 0;
    let changedEntries = 0;

    for (const passport of oldCountries) {
        if (!newData[passport]) continue;
        const oldDests = oldData[passport];
        const newDests = newData[passport];

        for (const dest of Object.keys(oldDests)) {
            totalEntries++;
            if (!newDests[dest]) {
                changedEntries++;
            } else if (oldDests[dest].status !== newDests[dest].status) {
                changedEntries++;
            }
        }
    }

    if (totalEntries > 0) {
        const changePercent = (changedEntries / totalEntries) * 100;
        if (changePercent > MAX_CHANGE_PERCENT) {
            warnings.push(
                `⚠️  ${changePercent.toFixed(1)}% of entries changed (${changedEntries}/${totalEntries}). ` +
                `This exceeds the ${MAX_CHANGE_PERCENT}% threshold — possible data compromise or major upstream restructuring. ` +
                `Manual review recommended.`
            );
        } else {
            warnings.push(`${changedEntries}/${totalEntries} entries changed (${changePercent.toFixed(1)}%) — within normal range.`);
        }
    }

    return warnings;
}

// ── Main ────────────────────────────────────────────
async function main() {
    console.log("═══════════════════════════════════════════");
    console.log("  Passport Data Validator & Updater");
    console.log("═══════════════════════════════════════════\n");

    // 1. Fetch upstream data
    console.log("1. Fetching upstream data...");
    let newData;
    try {
        newData = await fetchJSON(UPSTREAM_URL);
        console.log(`   ✓ Fetched ${Object.keys(newData).length} passport countries\n`);
    } catch (err) {
        console.error(`   ✗ FETCH FAILED: ${err.message}`);
        process.exit(1);
    }

    // 2. Validate structure
    console.log("2. Validating data structure...");
    const errors = validateStructure(newData);
    if (errors.length > 0) {
        console.error(`   ✗ VALIDATION FAILED (${errors.length} errors):`);
        errors.forEach(e => console.error(`     - ${e}`));
        process.exit(1);
    }
    console.log("   ✓ Structure is valid\n");

    // 3. Load previous data and detect anomalies
    console.log("3. Checking for anomalies...");
    let oldData = null;
    try {
        if (fs.existsSync(OUTPUT_PATH)) {
            oldData = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
        }
    } catch {
        // First run or corrupted file — that's fine
    }

    const warnings = detectAnomalies(newData, oldData);
    warnings.forEach(w => console.log(`   ${w}`));

    // If anomaly detection found a critical warning (>25% change), exit with error
    const hasCritical = warnings.some(w => w.includes("⚠️"));
    if (hasCritical) {
        console.error("\n   ✗ ANOMALY DETECTED — aborting update. Manual review required.");
        console.error("   Set FORCE_UPDATE=1 to override.");
        if (!process.env.FORCE_UPDATE) {
            process.exit(1);
        }
        console.log("   ⚠ FORCE_UPDATE is set — proceeding despite anomaly.\n");
    } else {
        console.log("   ✓ No critical anomalies\n");
    }

    // 4. Serialize once, write those exact bytes, and hash the canonical form.
    //    The browser re-canonicalizes the fetched file and hashes it the same way,
    //    so a later reformat or EOL change on disk can't break the integrity check.
    console.log("4. Writing validated data...");
    const serialized = JSON.stringify(newData);
    const hash = sha256(serialized);
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, serialized, "utf8");

    const meta = {
        lastUpdated: new Date().toISOString(),
        sha256: hash,
        countryCount: Object.keys(newData).length,
        source: UPSTREAM_URL,
        validationPassed: true
    };
    fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), "utf8");

    console.log(`   ✓ Data written to ${OUTPUT_PATH}`);
    console.log(`   ✓ SHA-256: ${hash}`);
    console.log(`   ✓ Metadata written to ${META_PATH}\n`);

    console.log("═══════════════════════════════════════════");
    console.log("  ✓ UPDATE COMPLETE");
    console.log("═══════════════════════════════════════════");
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
