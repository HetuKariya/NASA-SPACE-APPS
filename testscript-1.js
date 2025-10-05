const https = require("https");

// Configuration
const config = {
  baseUrl: "https://power.larc.nasa.gov/api/temporal/daily/regional",
  community: "RE",
  longitudeMin: 72,
  longitudeMax: 74,
  latitudeMin: 20,
  latitudeMax: 22,
  startDate: "20230101",
  endDate: "20231231",
  format: "JSON",
};

// Parameters to fetch
const parameters = [
  { name: "T2M", description: "Temperature Mean" },
  { name: "T2M_MAX", description: "Temperature Max" },
  { name: "T2M_MIN", description: "Temperature Min" },
  { name: "PRECTOTCORR", description: "Precipitation" },
  { name: "WS2M", description: "Wind Speed" },
  { name: "CLOUD_AMT", description: "Cloud Cover" },
];

// Function to make HTTP GET request
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// Build URL for a parameter
function buildUrl(parameter) {
  const params = new URLSearchParams({
    parameters: parameter,
    community: config.community,
    "longitude-min": config.longitudeMin,
    "longitude-max": config.longitudeMax,
    "latitude-min": config.latitudeMin,
    "latitude-max": config.latitudeMax,
    start: config.startDate,
    end: config.endDate,
    format: config.format,
  });

  return `${config.baseUrl}?${params.toString()}`;
}

// Main function to fetch all parameters
async function fetchAllWeatherData() {
  console.log("Starting NASA POWER API data fetch...\n");
  console.log("Bounding Box:", {
    longitude: `${config.longitudeMin}° to ${config.longitudeMax}°`,
    latitude: `${config.latitudeMin}° to ${config.latitudeMax}°`,
    dateRange: `${config.startDate} to ${config.endDate}`,
  });
  console.log("\n" + "=".repeat(60) + "\n");

  const results = {};

  for (const param of parameters) {
    try {
      console.log(`Fetching ${param.description} (${param.name})...`);
      const url = buildUrl(param.name);
      const data = await fetchData(url);

      results[param.name] = data;

      // Display summary - check multiple possible data structures
      let paramData = null;
      let dates = [];

      if (
        data.properties &&
        data.properties.parameter &&
        data.properties.parameter[param.name]
      ) {
        paramData = data.properties.parameter[param.name];
      } else if (data.parameters && data.parameters[param.name]) {
        paramData = data.parameters[param.name];
      } else if (data[param.name]) {
        paramData = data[param.name];
      }

      if (paramData) {
        // Filter out metadata keys (units, longname) to get only date entries
        const allKeys = Object.keys(paramData);
        dates = allKeys.filter((key) => key.match(/^\d{8}$/)); // Only YYYYMMDD format
        const metadata = allKeys.filter((key) => !key.match(/^\d{8}$/));

        console.log(`✓ Success! Retrieved ${dates.length} daily records`);

        // Show metadata
        if (metadata.length > 0) {
          console.log("  Metadata:");
          metadata.forEach((key) => {
            console.log(`    ${key}: ${paramData[key]}`);
          });
        }

        // Show first few values as sample
        const sampleDates = dates.slice(0, 5);
        if (sampleDates.length > 0) {
          console.log("  Sample daily data:");
          sampleDates.forEach((date) => {
            console.log(`    ${date}: ${paramData[date]}`);
          });
        }
      } else {
        console.log("✓ Data received, checking structure...");
        console.log("  Response keys:", Object.keys(data));
        // Log a sample of the actual structure
        console.log(
          "  Sample response:",
          JSON.stringify(data).substring(0, 200) + "..."
        );
      }

      console.log("");
    } catch (error) {
      console.error(`✗ Error fetching ${param.description}:`, error.message);
      console.log("");
    }
  }

  console.log("=".repeat(60));
  console.log("\nData fetch complete!");
  console.log(
    `Successfully fetched ${Object.keys(results).length} out of ${
      parameters.length
    } parameters\n`
  );

  return results;
}

// Run the script
fetchAllWeatherData()
  .then((results) => {
    // Optionally save to file
    const fs = require("fs");
    fs.writeFileSync("weather_data.json", JSON.stringify(results, null, 2));
    console.log("Data saved to weather_data.json");
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
