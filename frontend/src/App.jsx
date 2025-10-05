// import MapWithSearch from "./components/MapWithSearch";
import WeatherForcast from "./components/WeatherForcast";
import ClickableMap from "./components/ClickableMap";
import WeatherVisualization from './components/WeatherVisualization';

function App() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ClickableMap/>
      <WeatherForcast />
      <WeatherVisualization/>
    </div>
  );
}

export default App;
