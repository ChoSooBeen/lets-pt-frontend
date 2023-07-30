import { Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Join from './pages/Join';
import Observe from './pages/Observe';
import Practice from './pages/Practice';
import Result from './pages/Result';
import Main from './pages/Main';
import PrivateRoute from './PrivateRoute';
import Script from './pages/Script';
import Test from './pages/Test';
import MyPage from './pages/MyPage';
import PdfTest from './pages/pdfTest';
function App() {
  return (
    <div>
      <Routes>
        <Route path="/main" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="/test" element={<Test />} />
        <Route path="/pdf" element={<PdfTest />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/result" element={<Result />} />
          <Route path="/observe" element={<Observe />} />
          <Route path="/script" element={<Script />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
      </Routes>
    </div >
  );
}

export default App;
