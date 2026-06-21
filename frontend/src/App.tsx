import { Routes, Route, NavLink } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import BookingsListPage from './pages/BookingsListPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <div>
      <header className="header">
        <h1>🎯 真人CS场馆预约系统</h1>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            预约场地
          </NavLink>
          <NavLink to="/bookings" className={({ isActive }) => (isActive ? 'active' : '')}>
            我的预约
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
            后台管理
          </NavLink>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/bookings" element={<BookingsListPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
