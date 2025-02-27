
import { Routes, Route } from 'react-router-dom';
import ChatBot from './components/ChatBot';
import Home from './components/Home';
import AppointmentCard from './components/AppointmentCard'; // Import the AppointmentCard component
import LoginPage from './components/LoginPage';

function App() {
  return (
    <div className="min-h-screen min-w-screen bg-gray-900 flex flex-col items-center justify-center p-10">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/medicAssistant" element={<ChatBot />} />
        <Route path="/appointments" element={<AppointmentCard />} />
        <Route path="/login" element={<LoginPage/>} />
      </Routes>
    </div>
  );
}

export default App;