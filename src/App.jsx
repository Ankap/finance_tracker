import React, { useState } from 'react';
import DashboardScreen from './pages/DashboardScreen';
import GoalsScreen from './pages/GoalsScreen';
import WealthOverviewScreen from './pages/WealthOverviewScreen';
import UpdateDataScreen from './pages/UpdateDataScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'goals':
        return <GoalsScreen />;
      case 'wealth':
        return <WealthOverviewScreen />;
      case 'update':
        return <UpdateDataScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="App">
      {/* Navigation can be added here if needed */}
      {renderScreen()}
    </div>
  );
}

export default App;
