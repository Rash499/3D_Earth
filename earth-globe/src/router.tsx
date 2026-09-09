import { BrowserRouter, Route, Routes } from "react-router-dom";

import CountryDashboardPage from "./components/pages/CountryDashboardPage";
import EarthPage from "./components/pages/EarthPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EarthPage />} />

        <Route
          path="/country/:countryCode"
          element={<CountryDashboardPage />}
        />

        <Route path="*" element={<EarthPage />} />
      </Routes>
    </BrowserRouter>
  );
}