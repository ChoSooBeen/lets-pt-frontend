import { Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Join from './pages/Join';
import Observe from './pages/Observe';
import Keyword from './pages/Keyword';
import Practice from './pages/Practice';
import Result from './pages/Result';
import Main from './pages/Main';
import PrivateRoute from './PrivateRoute';
import Script from './pages/Script';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/main" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/result" element={<Result />} />
          <Route path="/observe" element={<Observe />} />
          <Route path="/keyword" element={<Keyword />} />
          <Route path="/script" element={<Script />} />
          <Route path="/practice" element={<Practice />} />
        </Route>
      </Routes>
    </div >
  );
}

export default App;
