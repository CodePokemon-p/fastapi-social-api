import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import PostDetails from './pages/PostDetails';
import AdminDashboard from './pages/AdminDashboard'; // <-- Import

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto p-4 mt-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/post/:id" element={<PostDetails />} />
          <Route path="/admin" element={<AdminDashboard />} /> {/* <-- Add */}
        </Routes>
      </main>
    </div>
  );
}

export default App;