import InteractiveEarthGlobe from "./components/InteractiveEarthGlobe";

function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#020617",
      }}
    >
      <InteractiveEarthGlobe />
    </div>
  );
}

export default App;