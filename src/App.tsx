import { Routes, Route } from 'react-router-dom';
import { Storefront } from './pages/Storefront';
import { Panel } from './pages/panel/Panel';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Storefront />} />
      <Route path="/panel" element={<Panel />} />
    </Routes>
  );
}
