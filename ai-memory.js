// ==========================================
// RAJ AI MEMORY ENGINE
// ai-memory.js
// ==========================================

// Global Memory
window.RAJ_MEMORY = {
    records: [],
    farmers: {},
    lastSync: null
};

// Memory Sync
async function syncRajMemory() {

    let allRecords = [];

    // Table Data
    const rows = document.querySelectorAll("table tbody tr");

    rows.forEach(row => {

        const text = row.innerText.trim();

        if (
            text &&
            !text.includes("No records") &&
            !text.includes("कोई रिकॉर्ड नहीं")
        ) {

            allRecords.push({
                source: "table",
                text: text
            });

        }

    });

    // Firebase Data
    try {

        if (typeof db !== "undefined") {

            const collections = [
                "entries",
                "farmers",
                "records",
                "data"
            ];

            for (const col of collections) {

                const snapshot = await db.collection(col).get();

                snapshot.forEach(doc => {

                    const d = doc.data();

                    allRecords.push({

                        source: "firebase",

                        name:
                            d.name ||
                            d.farmer_name ||
                            d.farmer ||
                            "",

                        work:
                            d.work ||
                            d.work_type ||
                            "",

                        bigha:
                            d.bigha ||
                            d.hours ||
                            d.quantity ||
                            0,

                        total:
                            d.total || 0,

                        paid:
                            d.paid || 0,

                        date:
                            d.date || ""

                    });

                });

            }

        }

    } catch (e) {

        console.log("Memory Sync Error", e);

    }

    // Save
    window.RAJ_MEMORY.records = allRecords;

    // Farmer Index
    let farmerIndex = {};

    allRecords.forEach(r => {

        let name = (
            r.name ||
            r.text ||
            ""
        ).toLowerCase();

        if (!farmerIndex[name]) {

            farmerIndex[name] = [];

        }

        farmerIndex[name].push(r);

    });

    window.RAJ_MEMORY.farmers = farmerIndex;

    window.RAJ_MEMORY.lastSync = new Date();

    console.log(
        "Raj Memory Updated",
        allRecords.length
    );

  }
