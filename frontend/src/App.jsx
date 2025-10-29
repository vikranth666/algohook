import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Webhooks from './pages/Webhooks';
import Events from './pages/Events';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/webhooks" element={<Webhooks />} />
          <Route path="/events" element={<Events />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;