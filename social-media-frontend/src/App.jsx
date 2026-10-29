import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <main className="container mx-auto p-4 mt-6">
        <Routes>
          <Route path="/" element={<h1 className="text-3xl font-bold text-center mt-10">Welcome to the Social App!</h1>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;