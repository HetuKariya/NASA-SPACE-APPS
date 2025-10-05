const express = require('express');
const https = require('https');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // In production, replace with your frontend URL
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// NASA POWER API configuration
const NASA_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/regional';

// Available parameters
const AVAILABLE_PARAMETERS = {
  T2M: { description: 'Temperature Mean', unit: 'C' },
  T2M_MAX: { description: 'Temperature Max', unit: 'C' },
  T2M_MIN: { description: 'Temperature Min', unit: 'C' },
  PRECTOTCORR: { description: 'Precipitation', unit: 'mm/day' },
  WS2M: { description: 'Wind Speed', unit: 'm/s' },
  CLOUD_AMT: { description: 'Cloud Cover', unit: '%' }
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper function to fetch data from NASA POWER API
function fetchNASAData(url) {
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

// Build NASA POWER API URL
function buildNASAUrl(parameter, longitudeMin, longitudeMax, latitudeMin, latitudeMax, startDate, endDate) {
  const params = new URLSearchParams({
    parameters: parameter,
    community: 'RE',
    'longitude-min': longitudeMin,
    'longitude-max': longitudeMax,
    'latitude-min': latitudeMin,
    'latitude-max': latitudeMax,
    start: startDate,
    end: endDate,
    format: 'JSON'
  });

  return `${NASA_BASE_URL}?${params.toString()}`;
}

// Extract daily values from GeoJSON FeatureCollection
function extractDailyValues(data, paramName) {
  const dailyValues = {};
  
  if (!data.features || !Array.isArray(data.features)) {
    return dailyValues;
  }
  
  data.features.forEach((feature) => {
    if (feature.properties && feature.properties.parameter && feature.properties.parameter[paramName]) {
      const paramData = feature.properties.parameter[paramName];
      
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
  const monthlyData = {};
  
  for (let month = 1; month <= 12; month++) {
    monthlyData[month] = [];
  }
  
  for (const dateStr in dailyValues) {
    const month = parseInt(dateStr.substring(4, 6));
    const values = dailyValues[dateStr];
    monthlyData[month].push(...values);
  }
  
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

// API Routes

// GET /api/weather - Fetch weather data for bounding box
app.get('/api/weather', async (req, res) => {
  try {
    const {
      longitudeMin,
      longitudeMax,
      latitudeMin,
      latitudeMax,
      startDate,
      endDate,
      parameters
    } = req.query;

    // Validation
    if (!longitudeMin || !longitudeMax || !latitudeMin || !latitudeMax) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['longitudeMin', 'longitudeMax', 'latitudeMin', 'latitudeMax']
      });
    }

    // Parse and validate numeric values
    const lonMin = parseFloat(longitudeMin);
    const lonMax = parseFloat(longitudeMax);
    const latMin = parseFloat(latitudeMin);
    const latMax = parseFloat(latitudeMax);

    if (isNaN(lonMin) || isNaN(lonMax) || isNaN(latMin) || isNaN(latMax)) {
      return res.status(400).json({
        success: false,
        error: 'All coordinate parameters must be valid numbers'
      });
    }

    // Validate bounding box size (must be at least 2 degrees)
    const lonRange = lonMax - lonMin;
    const latRange = latMax - latMin;

    if (lonRange < 2 || latRange < 2) {
      return res.status(400).json({
        success: false,
        error: 'Bounding box must be at least 2x2 degrees',
        current: { longitude: lonRange, latitude: latRange },
        hint: 'NASA POWER API requires minimum 2-degree range for regional queries'
      });
    }

    // Default dates (current year)
    const year = new Date().getFullYear();
    const start = startDate || `${year}0101`;
    const end = endDate || `${year}1231`;

    // Parameters to fetch (default: all)
    const paramsToFetch = parameters 
      ? parameters.split(',').filter(p => AVAILABLE_PARAMETERS[p])
      : Object.keys(AVAILABLE_PARAMETERS);

    const results = {};

    // Fetch data for each parameter
    for (const param of paramsToFetch) {
      try {
        const url = buildNASAUrl(
          param,
          lonMin,
          lonMax,
          latMin,
          latMax,
          start,
          end
        );

        const data = await fetchNASAData(url);
        const dailyValues = extractDailyValues(data, param);
        
        if (Object.keys(dailyValues).length === 0) {
          continue;
        }

        const monthlyStats = calculateMonthlyStats(dailyValues);
        
        results[param] = {
          description: AVAILABLE_PARAMETERS[param].description,
          unit: AVAILABLE_PARAMETERS[param].unit,
          gridPoints: data.features?.length || 0,
          monthly: monthlyStats
        };
      } catch (error) {
        console.error(`Error fetching ${param}:`, error.message);
        results[param] = {
          error: error.message
        };
      }
    }

    res.json({
      success: true,
      boundingBox: {
        longitude: { min: lonMin, max: lonMax },
        latitude: { min: latMin, max: latMax }
      },
      dateRange: { start, end },
      data: results
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/parameters - Get available parameters
app.get('/api/parameters', (req, res) => {
  res.json({
    success: true,
    parameters: AVAILABLE_PARAMETERS
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Weather API Server running on port ${PORT}`);
  console.log(`\n📍 Endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/api/parameters`);
  console.log(`   GET  http://localhost:${PORT}/api/weather`);
  console.log(`\n📖 Example request:`);
  console.log(`   http://localhost:${PORT}/api/weather?longitudeMin=72&longitudeMax=74&latitudeMin=20&latitudeMax=22&startDate=20230101&endDate=20231231`);
  console.log('');
});

module.exports = app;