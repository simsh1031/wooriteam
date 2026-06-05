import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup as apiSignup } from '../api/auth';
import './AuthPage.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return; }
    setLoading(true);
    try {
      await apiSignup(email, password, nickname);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message ?? '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page">
      <div className="auth-card card container">
        <h1 className="auth-title">회원가입</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              type="email" className="form-input"
              placeholder="이메일을 입력하세요"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              type="password" className="form-input"
              placeholder="8자 이상 입력하세요"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
          </div>
          <div className="form-group">
            <label className="form-label">닉네임</label>
            <input
              type="text" className="form-input"
              placeholder="닉네임을 입력하세요 (최대 20자)"
              value={nickname} onChange={(e) => setNickname(e.target.value)}
              maxLength={20} required
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>
        <p className="auth-switch">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}