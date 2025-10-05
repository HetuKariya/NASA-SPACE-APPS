import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Cloud, Droplets, Wind, ThermometerSun, Calendar, TrendingUp, TrendingDown, Snowflake, Gauge } from 'lucide-react';
import useMapLocation from '../hooks/useMapLocation';

const WeatherVisualization = () => {
  const { location } = useMapLocation();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('temperature');

  // Calculate 4 corner coordinates dynamically
  const boundingBox = useMemo(() => {
    if (!location) return null;
    
    return {
      // Bottom-left: lat-1, lng-1
      southWest: { lat: location.lat - 1, lng: location.lng - 1 },
      // Bottom-right: lat-1, lng+1
      southEast: { lat: location.lat - 1, lng: location.lng + 1 },
      // Top-left: lat+1, lng-1
      northWest: { lat: location.lat + 1, lng: location.lng - 1 },
      // Top-right: lat+1, lng+1
      northEast: { lat: location.lat + 1, lng: location.lng + 1 },
      // For API
      longitudeMin: location.lng - 1,
      longitudeMax: location.lng + 1,
      latitudeMin: location.lat - 1,
      latitudeMax: location.lat + 1
    };
  }, [location]);

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!location || !boundingBox) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          longitudeMin: boundingBox.longitudeMin,
          longitudeMax: boundingBox.longitudeMax,
          latitudeMin: boundingBox.latitudeMin,
          latitudeMax: boundingBox.latitudeMax,
          startDate: '20230101',
          endDate: '20231231'
        });

        const response = await fetch(`http://localhost:3001/api/weather?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setWeatherData(result.data);
        }
      } catch (error) {
        console.error('Error loading weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [location, boundingBox]);

  const processedMonthlyData = useMemo(() => {
    if (!weatherData) return [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      tempMean: weatherData.T2M?.monthly?.[month]?.mean || 0,
      tempMax: weatherData.T2M_MAX?.monthly?.[month]?.mean || 0,
      tempMin: weatherData.T2M_MIN?.monthly?.[month]?.mean || 0,
      tempRangeMax: weatherData.T2M?.monthly?.[month]?.max || 0,
      tempRangeMin: weatherData.T2M?.monthly?.[month]?.min || 0,
      precipitation: weatherData.PRECTOTCORR?.monthly?.[month]?.mean || 0,
      precipMax: weatherData.PRECTOTCORR?.monthly?.[month]?.max || 0,
      windSpeed: weatherData.WS2M?.monthly?.[month]?.mean || 0,
      windMax: weatherData.WS2M?.monthly?.[month]?.max || 0,
      cloudCover: weatherData.CLOUD_AMT?.monthly?.[month]?.mean || 0
    }));
  }, [weatherData]);

  const annualStats = useMemo(() => {
    if (!processedMonthlyData.length) return {};
    const avgTemp = (processedMonthlyData.reduce((sum, m) => sum + m.tempMean, 0) / 12).toFixed(1);
    const maxTemp = Math.max(...processedMonthlyData.map(m => m.tempRangeMax)).toFixed(1);
    const minTemp = Math.min(...processedMonthlyData.map(m => m.tempRangeMin)).toFixed(1);
    const totalPrecip = processedMonthlyData.reduce((sum, m) => sum + m.precipitation, 0).toFixed(1);
    const avgWind = (processedMonthlyData.reduce((sum, m) => sum + m.windSpeed, 0) / 12).toFixed(1);
    const avgCloud = (processedMonthlyData.reduce((sum, m) => sum + m.cloudCover, 0) / 12).toFixed(1);
    const wettestMonth = processedMonthlyData.reduce((max, m) => m.precipitation > max.precipitation ? m : max);
    const driestMonth = processedMonthlyData.reduce((min, m) => m.precipitation < min.precipitation ? m : min);
    const hottestMonth = processedMonthlyData.reduce((max, m) => m.tempMean > max.tempMean ? m : max);
    const coldestMonth = processedMonthlyData.reduce((min, m) => m.tempMean < min.tempMean ? m : min);
    return {
      avgTemp, maxTemp, minTemp, totalPrecip, avgWind, avgCloud,
      wettestMonth: wettestMonth.month, driestMonth: driestMonth.month,
      hottestMonth: hottestMonth.month, coldestMonth: coldestMonth.month
    };
  }, [processedMonthlyData]);

  const radarData = useMemo(() => {
    if (!processedMonthlyData.length) return [];
    return processedMonthlyData.map(m => ({
      month: m.month,
      Temperature: ((m.tempMean - 15) / 20 * 100).toFixed(0),
      Precipitation: Math.min((m.precipitation / 25 * 100), 100).toFixed(0),
      Wind: ((m.windSpeed / 12 * 100)).toFixed(0),
      Cloud: m.cloudCover.toFixed(0)
    }));
  }, [processedMonthlyData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-200/50">
          <p className="font-bold text-gray-800 mb-2 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-xs font-medium">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-xl text-gray-600 font-medium">Loading weather data...</div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-xl text-red-600 font-medium">Error loading weather data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Weather Analytics
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {location?.name || 'Regional Climate Analysis'} • {boundingBox ? `${boundingBox.latitudeMin.toFixed(2)}°N - ${boundingBox.latitudeMax.toFixed(2)}°N, ${boundingBox.longitudeMin.toFixed(2)}°E - ${boundingBox.longitudeMax.toFixed(2)}°E` : ''}
              </p>
              <p className="text-gray-400 text-xs mt-1">Year 2023 Monthly Data</p>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg">
              <Gauge className="w-5 h-5" />
              <span className="font-semibold">Live Data</span>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 text-white transform hover:scale-105 transition-transform">
            <ThermometerSun className="w-7 h-7 sm:w-8 sm:h-8 mb-3 opacity-90" />
            <div className="text-2xl sm:text-3xl font-bold mb-1">{annualStats.avgTemp}°</div>
            <div className="text-xs sm:text-sm opacity-90 font-medium">Avg Temp</div>
            <div className="text-xs opacity-75 mt-1">{annualStats.hottestMonth} peak</div>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 text-white transform hover:scale-105 transition-transform">
            <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 mb-3 opacity-90" />
            <div className="text-2xl sm:text-3xl font-bold mb-1">{annualStats.maxTemp}°</div>
            <div className="text-xs sm:text-sm opacity-90 font-medium">Max Temp</div>
            <div className="text-xs opacity-75 mt-1">Annual high</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 text-white transform hover:scale-105 transition-transform">
            <Snowflake className="w-7 h-7 sm:w-8 sm:h-8 mb-3 opacity-90" />
            <div className="text-2xl sm:text-3xl font-bold mb-1">{annualStats.minTemp}°</div>
            <div className="text-xs sm:text-sm opacity-90 font-medium">Min Temp</div>
            <div className="text-xs opacity-75 mt-1">{annualStats.coldestMonth} low</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 text-white transform hover:scale-105 transition-transform">
            <Droplets className="w-7 h-7 sm:w-8 sm:h-8 mb-3 opacity-90" />
            <div className="text-2xl sm:text-3xl font-bold mb-1">{annualStats.totalPrecip}</div>
            <div className="text-xs sm:text-sm opacity-90 font-medium">Precip (mm)</div>
            <div className="text-xs opacity-75 mt-1">{annualStats.wettestMonth} wettest</div>
          </div>
          
          <div className="bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 text-white transform hover:scale-105 transition-transform">
            <Wind className="w-7 h-7 sm:w-8 sm:h-8 mb-3 opacity-90" />
            <div className="text-2xl sm:text-3xl font-bold mb-1">{annualStats.avgWind}</div>
            <div className="text-xs sm:text-sm opacity-90 font-medium">Wind (m/s)</div>
            <div className="text-xs opacity-75 mt-1">Average</div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 text-white transform hover:scale-105 transition-transform">
            <Cloud className="w-7 h-7 sm:w-8 sm:h-8 mb-3 opacity-90" />
            <div className="text-2xl sm:text-3xl font-bold mb-1">{annualStats.avgCloud}%</div>
            <div className="text-xs sm:text-sm opacity-90 font-medium">Cloud Cover</div>
            <div className="text-xs opacity-75 mt-1">Average</div>
          </div>
        </div>

        {/* View Selector */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[
              { value: 'temperature', label: 'Temperature', icon: ThermometerSun },
              { value: 'precipitation', label: 'Precipitation', icon: Droplets },
              { value: 'wind', label: 'Wind', icon: Wind },
              { value: 'cloud', label: 'Cloud', icon: Cloud },
              { value: 'radar', label: 'Radar', icon: Gauge },
              { value: 'comparison', label: 'Overview', icon: TrendingUp }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSelectedView(value)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all ${
                  selectedView === value
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {selectedView === 'temperature' && (
            <>
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Temperature Trends</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={processedMonthlyData}>
                    <defs>
                      <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMean" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="tempMax" stroke="#ef4444" strokeWidth={3} name="Max" dot={{ fill: '#ef4444', r: 4 }} fill="url(#colorMax)" />
                    <Line type="monotone" dataKey="tempMean" stroke="#f59e0b" strokeWidth={3} name="Mean" dot={{ fill: '#f59e0b', r: 4 }} fill="url(#colorMean)" />
                    <Line type="monotone" dataKey="tempMin" stroke="#3b82f6" strokeWidth={3} name="Min" dot={{ fill: '#3b82f6', r: 4 }} fill="url(#colorMin)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Temperature Range</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={processedMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="tempRangeMax" stackId="1" stroke="#dc2626" fill="#fca5a5" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="tempRangeMin" stackId="2" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Monthly Distribution</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={processedMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="tempMean" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {selectedView === 'precipitation' && (
            <>
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Precipitation Patterns</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processedMonthlyData}>
                    <defs>
                      <linearGradient id="colorPrecip" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="precipitation" fill="url(#colorPrecip)" name="Precipitation" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Mean vs Max</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={processedMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="precipMax" fill="#1e40af" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="precipitation" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Trend Analysis</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={processedMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="precipitation" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.7} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {selectedView === 'wind' && (
            <>
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Wind Speed Analysis</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={processedMonthlyData}>
                    <defs>
                      <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="windSpeed" stroke="#14b8a6" fill="url(#colorWind)" name="Wind Speed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Mean vs Max Comparison</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={processedMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="windMax" stroke="#0f766e" strokeWidth={3} dot={{ fill: '#0f766e', r: 4 }} />
                    <Line type="monotone" dataKey="windSpeed" stroke="#14b8a6" strokeWidth={3} dot={{ fill: '#14b8a6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {selectedView === 'cloud' && (
            <>
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Cloud Coverage</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={processedMonthlyData}>
                    <defs>
                      <linearGradient id="colorCloud" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="cloudCover" stroke="#6366f1" fill="url(#colorCloud)" name="Cloud Cover" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Monthly Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processedMonthlyData}>
                    <defs>
                      <linearGradient id="colorCloudBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="cloudCover" fill="url(#colorCloudBar)"
                    radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
                    {selectedView === 'radar' && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Multi-Parameter Analysis</h2>
              <p className="text-sm text-gray-600 mb-6">All parameters normalized to 0-100 scale</p>
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
                  <Radar name="Temperature" dataKey="Temperature" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                  <Radar name="Precipitation" dataKey="Precipitation" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <Radar name="Wind" dataKey="Wind" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.4} />
                  <Radar name="Cloud" dataKey="Cloud" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {selectedView === 'comparison' && (
            <>
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">All Parameters Overview</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={processedMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="left" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="tempMean" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="windSpeed" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="precipitation" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="cloudCover" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Temperature vs Precipitation</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={processedMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <YAxis yAxisId="left" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar yAxisId="left" dataKey="tempMean" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      <Bar yAxisId="right" dataKey="precipitation" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Wind vs Cloud Cover</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={processedMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <YAxis yAxisId="left" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar yAxisId="left" dataKey="windSpeed" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                      <Bar yAxisId="right" dataKey="cloudCover" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Seasonal Highlights
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <span className="text-gray-700 font-medium text-sm">Hottest Month</span>
                <span className="font-bold text-orange-600 text-lg">{annualStats.hottestMonth}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <span className="text-gray-700 font-medium text-sm">Coldest Month</span>
                <span className="font-bold text-blue-600 text-lg">{annualStats.coldestMonth}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                <span className="text-gray-700 font-medium text-sm">Wettest Month</span>
                <span className="font-bold text-cyan-600 text-lg">{annualStats.wettestMonth}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                <span className="text-gray-700 font-medium text-sm">Driest Month</span>
                <span className="font-bold text-amber-600 text-lg">{annualStats.driestMonth}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Data Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                <div>
                  <p className="font-semibold text-gray-800">Location</p>
                  <p className="text-gray-600">{location?.name || 'Regional Climate Analysis'}</p>
                  {boundingBox && (
                    <p className="text-gray-500 text-xs mt-1">
                      Coverage: {boundingBox.latitudeMin.toFixed(2)}°N to {boundingBox.latitudeMax.toFixed(2)}°N, {boundingBox.longitudeMin.toFixed(2)}°E to {boundingBox.longitudeMax.toFixed(2)}°E
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5"></div>
                <div>
                  <p className="font-semibold text-gray-800">Time Period</p>
                  <p className="text-gray-600">Year 2023 (12 months)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
                <div>
                  <p className="font-semibold text-gray-800">Data Type</p>
                  <p className="text-gray-600">Monthly aggregations (min, max, mean)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-pink-500 mt-1.5"></div>
                <div>
                  <p className="font-semibold text-gray-800">Source</p>
                  <p className="text-gray-600">NASA POWER API</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Climate Insights */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl p-6 sm:p-8 text-white">
          <h3 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Climate Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <h4 className="font-bold mb-2 text-lg">Temperature Patterns</h4>
              <p className="text-sm text-white/90 leading-relaxed">
                Annual temperature ranges from {annualStats.minTemp}°C to {annualStats.maxTemp}°C, with an average of {annualStats.avgTemp}°C. 
                Peak temperatures occur in {annualStats.hottestMonth}, while {annualStats.coldestMonth} experiences the coolest conditions.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <h4 className="font-bold mb-2 text-lg">Precipitation Patterns</h4>
              <p className="text-sm text-white/90 leading-relaxed">
                Total annual precipitation reaches {annualStats.totalPrecip}mm. The wettest period is {annualStats.wettestMonth}, 
                while {annualStats.driestMonth} is typically the driest month of the year.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <h4 className="font-bold mb-2 text-lg">Wind Conditions</h4>
              <p className="text-sm text-white/90 leading-relaxed">
                Average wind speed throughout the year is {annualStats.avgWind} m/s. Wind patterns show seasonal variations 
                with stronger winds typically during monsoon months.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <h4 className="font-bold mb-2 text-lg">Cloud Coverage</h4>
              <p className="text-sm text-white/90 leading-relaxed">
                Mean cloud cover is {annualStats.avgCloud}%, indicating significant seasonal variation in sky conditions. 
                Monsoon months typically show higher cloud coverage.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-gray-600 text-sm">
            Powered by NASA POWER API • Real-time Weather Analytics
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherVisualization;