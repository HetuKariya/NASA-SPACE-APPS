import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import useMapLocation from "../hooks/useMapLocation";

export default function WeeklyForecast() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const { location } = useMapLocation();

  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiKey = import.meta.env.VITE_APP_WEATHER_API_KEY;
        const query = `${location.lat},${location.lng}`;
        
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${query}&days=7&aqi=no&alerts=no`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to fetch weather data");
        }
        
        const data = await response.json();
        setWeatherData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch weather data");
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  const getDayName = (dateString) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const date = new Date(dateString);
    return { full: days[date.getDay()], short: shortDays[date.getDay()] };
  };

  const getHourlyData = (day) => {
    if (!day || !day.hour) return [];
    
    const indices = [0, 3, 6, 9, 12, 15, 18];
    return indices.map(index => ({
      time: new Date(day.hour[index].time).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        hour12: true 
      }),
      temp: day.hour[index].temp_c,
      condition: day.hour[index].condition.text,
      icon: day.hour[index].condition.icon
    }));
  };

  const prepareChartData = () => {
    if (!weatherData || !weatherData.forecast.forecastday[selectedDay]) return [];
    
    const day = weatherData.forecast.forecastday[selectedDay];
    return getHourlyData(day);
  };

  if (loading) {
    return (
      <div className="weather-container">
        <div className="weather-loading">
          <div className="weather-spinner"></div>
          <p>Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-container">
        <div className="weather-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="weather-retry-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!weatherData) return null;

  const selectedDayData = weatherData.forecast.forecastday[selectedDay];
  const hourlyData = getHourlyData(selectedDayData);

  return (
    <div className="weather-container">
      <div className="weather-card">
        <div className="weather-header">
          <h1 className="weather-location">
            {weatherData.location.name}, {weatherData.location.country}
          </h1>
          <div className="weather-current-temp">{Math.round(weatherData.current.temp_c)}°</div>
          <div className="weather-condition">{weatherData.current.condition.text}</div>
          <div className="weather-temp-range">
            H:{Math.round(weatherData.forecast.forecastday[0].day.maxtemp_c)}° 
            L:{Math.round(weatherData.forecast.forecastday[0].day.mintemp_c)}°
          </div>
        </div>

        <div className="weather-forecast-section">
          <div className="weather-section-title">7-DAY FORECAST</div>
          <div className="weather-day-tabs">
            {weatherData.forecast.forecastday.map((day, index) => {
              const dayName = getDayName(day.date);
              const isSelected = selectedDay === index;
              return (
                <div
                  key={day.date}
                  className={`weather-day-tab ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedDay(index)}
                >
                  <div className="weather-tab-day-name">
                    {index === 0 ? "Today" : dayName.short}
                  </div>
                  <img
                    src={`https:${day.day.condition.icon}`}
                    alt={day.day.condition.text}
                    className="weather-tab-icon"
                  />
                  <div className="weather-tab-temp">
                    {Math.round(day.day.maxtemp_c)}°
                  </div>
                </div>
              );
            })}
          </div>

          <div className="weather-selected-day">
            <h2 className="weather-selected-day-title">
              {selectedDay === 0 ? "Today" : getDayName(selectedDayData.date).full}
              <span className="weather-selected-day-date"> - {selectedDayData.date}</span>
            </h2>
            
            <div className="weather-hourly-forecast">
              {hourlyData.map((hour, index) => (
                <div key={index} className="weather-hourly-item">
                  <div className="weather-hour-time">{hour.time}</div>
                  <img
                    src={`https:${hour.icon}`}
                    alt={hour.condition}
                    className="weather-hourly-icon"
                  />
                  <div className="weather-hour-temp">{Math.round(hour.temp)}°</div>
                  <div className="weather-hour-condition">{hour.condition}</div>
                </div>
              ))}
            </div>

            <div className="weather-chart-section">
              <div className="weather-chart-title">HOURLY TEMPERATURE</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={prepareChartData()}>
                  <XAxis 
                    dataKey="time" 
                    stroke="#333" 
                    style={{ fontSize: "11px" }}
                  />
                  <YAxis 
                    stroke="#333" 
                    style={{ fontSize: "12px" }}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      padding: "10px"
                    }}
                    labelStyle={{ color: "#333", fontWeight: "600" }}
                    formatter={(value) => [`${Math.round(value)}°C`, 'Temperature']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temp" 
                    stroke="#007bff" 
                    strokeWidth={3}
                    dot={{ fill: "#007bff", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="weather-day-summary">
              <div className="weather-summary-item">
                <div className="weather-summary-label">High</div>
                <div className="weather-summary-value">{Math.round(selectedDayData.day.maxtemp_c)}°</div>
              </div>
              <div className="weather-summary-item">
                <div className="weather-summary-label">Low</div>
                <div className="weather-summary-value">{Math.round(selectedDayData.day.mintemp_c)}°</div>
              </div>
              <div className="weather-summary-item">
                <div className="weather-summary-label">Humidity</div>
                <div className="weather-summary-value">{selectedDayData.day.avghumidity}%</div>
              </div>
              <div className="weather-summary-item">
                <div className="weather-summary-label">Rain Chance</div>
                <div className="weather-summary-value">{selectedDayData.day.daily_chance_of_rain}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}