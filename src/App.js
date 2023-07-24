import { Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Join from './pages/Join';
import Observe from './pages/Observe';
import Keyword from './pages/Keyword';
import Practice from './pages/Practice';
import Result from './pages/Result';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/result" element={<Result />} />
        <Route path="/join" element={<Join />} />
        <Route path="/observe" element={<Observe />} />
        <Route path="/keyword" element={<Keyword />} />
        <Route path="/practice" element={<Practice />} />
      </Routes>
    </div>
  );
}

export default App;
