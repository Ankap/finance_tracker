import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WealthOverview from './pages/WealthOverview';
import Goals from './pages/Goals';
import Expenses from './pages/Expenses';
import UpdateData from './pages/UpdateData';
import AISummary from './pages/AISummary';
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wealth" element={<WealthOverview />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/update" element={<UpdateData />} />
          <Route path="/ai-summary" element={<AISummary />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
