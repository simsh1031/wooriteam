import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout as apiLogout } from '../api/auth';
import './Header.css';

export default function Header() {
  const { isLoggedIn, nickname, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-inner container">
        <Link to="/" className="header-logo">우리팀</Link>
        <nav className="header-nav">
          <Link to="/posts" className="header-link">공고</Link>
          {isLoggedIn ? (
            <>
              <Link to="/profiles" className="header-link">프로필</Link>
              <Link to="/groups" className="header-link">그룹</Link>
              <Link to="/posts/new" className="btn btn-outline btn-sm">공고 올리기</Link>
              <Link to="/my" className="header-link">{nickname}</Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" className="header-link">로그인</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">회원가입</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}