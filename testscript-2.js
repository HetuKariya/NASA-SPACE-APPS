const https = require('https');
const fs = require('fs');

// Configuration
const config = {
  baseUrl: 'https://power.larc.nasa.gov/api/temporal/daily/regional',
  community: 'RE',
  longitudeMin: 72,
  longitudeMax: 74,
  latitudeMin: 20,
  latitudeMax: 22,
  startDate: '20230101',
  endDate: '20231231',
  format: 'JSON'
};

// Parameters to fetch
const parameters = [
  { name: 'T2M', description: 'Temperature Mean' },
  { name: 'T2M_MAX', description: 'Temperature Max' },
  { name: 'T2M_MIN', description: 'Temperature Min' },
  { name: 'PRECTOTCORR', description: 'Precipitation' },
  { name: 'WS2M', description: 'Wind Speed' },
  { name: 'CLOUD_AMT', description: 'Cloud Cover' }
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Function to make HTTP GET request
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Build URL for a parameter
function buildUrl(parameter) {
  const params = new URLSearchParams({
    parameters: parameter,
    community: config.community,
    'longitude-min': config.longitudeMin,
    'longitude-max': config.longitudeMax,
    'latitude-min': config.latitudeMin,
    'latitude-max': config.latitudeMax,
    start: config.startDate,
    end: config.endDate,
    format: config.format
  });

  return `${config.baseUrl}?${params.toString()}`;
}

// Extract daily values from GeoJSON FeatureCollection
function extractDailyValues(data, paramName) {
  const dailyValues = {};
  
  // Check if data has features array (GeoJSON structure)
  if (!data.features || !Array.isArray(data.features)) {
    console.log('  Warning: No features found in response');
    return dailyValues;
  }
  
  console.log(`  Found ${data.features.length} grid points`);
  
  // Iterate through each feature (grid point)
  data.features.forEach((feature, idx) => {
    if (feature.properties && feature.properties.parameter && feature.properties.parameter[paramName]) {
      const paramData = feature.properties.parameter[paramName];
      
      // Extract date entries (format: YYYYMMDD)
      for (const key in paramData) {
        if (key.match(/^\d{8}$/)) {
          const value = paramData[key];
          
          if (typeof value === 'number' && !isNaN(value)) {
            if (!dailyValues[key]) {
              dailyValues[key] = [];
            }
            dailyValues[key].push(value);
          }
        }
      }
    }
  });
  
  return dailyValues;
}

// Calculate monthly statistics
function calculateMonthlyStats(dailyValues) {
  const monthlyStats = {};
  
  // Group by month
  const monthlyData = {};
  for (let month = 1; month <= 12; month++) {
    monthlyData[month] = [];
  }
  
  // Organize daily values by month
  for (const dateStr in dailyValues) {
    const month = parseInt(dateStr.substring(4, 6));
    const values = dailyValues[dateStr];
    
    // Add all values from this day (across all grid points)
    monthlyData[month].push(...values);
  }
  
  // Calculate statistics for each month
  for (let month = 1; month <= 12; month++) {
    const values = monthlyData[month];
    
    if (values.length > 0) {
      const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
      
      if (validValues.length > 0) {
        const sum = validValues.reduce((a, b) => a + b, 0);
        monthlyStats[MONTHS[month - 1]] = {
          min: parseFloat(Math.min(...validValues).toFixed(2)),
          max: parseFloat(Math.max(...validValues).toFixed(2)),
          mean: parseFloat((sum / validValues.length).toFixed(2))
        };
      } else {
        monthlyStats[MONTHS[month - 1]] = { min: null, max: null, mean: null };
      }
    } else {
      monthlyStats[MONTHS[month - 1]] = { min: null, max: null, mean: null };
    }
  }
  
  return monthlyStats;
}

// Main function to fetch all parameters
async function fetchAllWeatherData() {
  console.log('Starting NASA POWER API data fetch...\n');
  console.log('Bounding Box:', {
    longitude: `${config.longitudeMin}° to ${config.longitudeMax}°`,
    latitude: `${config.latitudeMin}° to ${config.latitudeMax}°`,
    dateRange: `${config.startDate} to ${config.endDate}`
  });
  console.log('\n' + '='.repeat(70) + '\n');

  const monthlyResults = {};

  for (const param of parameters) {
    try {
      console.log(`Fetching ${param.description} (${param.name})...`);
      const url = buildUrl(param.name);
      const data = await fetchData(url);
      
      // Extract daily values from all grid points
      const dailyValues = extractDailyValues(data, param.name);
      const dateCount = Object.keys(dailyValues).length;
      
      if (dateCount === 0) {
        console.log('  ✗ No data extracted\n');
        continue;
      }
      
      // Calculate monthly statistics
      const monthlyStats = calculateMonthlyStats(dailyValues);
      monthlyResults[param.name] = {
        description: param.description,
        unit: data.features[0]?.properties?.parameter?.[param.name]?.units || 'N/A',
        monthly: monthlyStats
      };
      
      console.log(`  ✓ Processed ${dateCount} days from multiple grid points`);
      
      // Display monthly summary
      console.log('  Monthly Statistics:');
      for (const month of MONTHS) {
        const stats = monthlyStats[month];
        if (stats && stats.mean !== null) {
          console.log(`    ${month}: min=${stats.min}, max=${stats.max}, mean=${stats.mean}`);
        }
      }
      
      console.log('');
    } catch (error) {
      console.error(`  ✗ Error fetching ${param.description}:`, error.message);
      console.log('');
    }
  }

  console.log('='.repeat(70));
  console.log('\nData processing complete!');
  console.log(`Successfully processed ${Object.keys(monthlyResults).length} out of ${parameters.length} parameters\n`);

  return monthlyResults;
}

// Run the script
fetchAllWeatherData()
  .then(results => {
    // Save monthly statistics
    fs.writeFileSync('monthly_weather_stats.json', JSON.stringify(results, null, 2));
    console.log('✓ Monthly statistics saved to monthly_weather_stats.json');
    
    // Create a summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log('Each parameter has 12 months × 3 statistics (min/max/mean) = 36 values\n');
    
    for (const paramName in results) {
      const data = results[paramName];
      console.log(`${paramName} (${data.description}):`);
      console.log(`  Unit: ${data.unit}`);
      console.log(`  Values: 36 (12 months with min/max/mean for entire bounding box)`);
    }
    
    console.log('\n' + '='.repeat(70));
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });