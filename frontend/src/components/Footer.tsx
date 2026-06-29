import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-top">
          <span className="footer-logo">우리팀</span>
          <nav className="footer-links">
            <Link to="/posts" className="footer-link">공고</Link>
            <Link to="/groups" className="footer-link">그룹</Link>
            <Link to="/profiles" className="footer-link">프로필</Link>
            <Link to="/report" className="footer-link">신고하기</Link>
          </nav>
        </div>
        <p className="footer-copy">© {year} 우리팀. All rights reserved.</p>
      </div>
    </footer>
  );
}