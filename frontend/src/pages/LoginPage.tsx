import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      const { token, nickname } = res.data.data;
      login(token, nickname);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page">
      <div className="auth-card card container">
        <h1 className="auth-title">로그인</h1>
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
              placeholder="비밀번호를 입력하세요"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="auth-switch">
          아직 계정이 없나요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}