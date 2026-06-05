import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyPosts, getMyApplications } from '../api/applications';
import { closePost, deletePost } from '../api/posts';
import { changePassword, withdraw } from '../api/auth';
import type { MyApplicationResponse, PostSummaryResponse } from '../api/types';
import { ROLE_LABELS, DIFFICULTY_LABELS, PROJECT_TYPE_LABELS } from '../api/types';
import { useAuth } from '../context/AuthContext';
import './MyPage.css';

type Tab = 'posts' | 'applications' | 'settings';

export default function MyPage() {
  const { nickname, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('posts');

  const [myPosts, setMyPosts] = useState<PostSummaryResponse[]>([]);
  const [myApps, setMyApps] = useState<MyApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwCurrentWrong, setPwCurrentWrong] = useState(false);

  useEffect(() => {
    Promise.all([getMyPosts(), getMyApplications()])
      .then(([postsRes, appsRes]) => {
        setMyPosts(postsRes.data.data);
        setMyApps(appsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleClose = async (postId: number) => {
    if (!confirm('공고를 마감하시겠습니까?')) return;
    await closePost(postId);
    setMyPosts((prev) => prev.map((p) => p.id === postId ? { ...p, closed: true } : p));
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('공고를 삭제하시겠습니까?')) return;
    await deletePost(postId);
    setMyPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (pwForm.newPassword.length < 8) {
      setPwError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? '비밀번호 변경에 실패했습니다.';
      setPwError(msg);
      if (err.response?.status === 400 && err.response?.data?.message?.includes('현재 비밀번호')) setPwCurrentWrong(true);
    } finally {
      setPwLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) return;
    try {
      await withdraw();
      logout();
      navigate('/');
    } catch {
      alert('탈퇴 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="mypage page">
      <div className="container">
        <div className="mypage-header">
          <div>
            <h1 className="mypage-title">마이페이지</h1>
            <p className="mypage-nick">{nickname}</p>
          </div>
          <Link to="/posts/new" className="btn btn-primary">+ 공고 올리기</Link>
        </div>

        <div className="mypage-tabs">
          <button className={`mypage-tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>
            내가 올린 공고 <span className="tab-count">{myPosts.length}</span>
          </button>
          <button className={`mypage-tab ${tab === 'applications' ? 'active' : ''}`} onClick={() => setTab('applications')}>
            내가 지원한 공고 <span className="tab-count">{myApps.length}</span>
          </button>
          <button className={`mypage-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            계정 관리
          </button>
        </div>

        {loading && tab !== 'settings' ? (
          <div className="spinner" />
        ) : tab === 'posts' ? (
          myPosts.length === 0 ? (
            <div className="empty-state">
              <p>아직 올린 공고가 없어요.</p>
              <Link to="/posts/new" className="btn btn-outline" style={{ marginTop: 16 }}>첫 공고 올리기</Link>
            </div>
          ) : (
            <div className="mypost-list">
              {myPosts.map((post) => (
                <div key={post.id} className="mypost-card card">
                  <div className="mypost-card-top">
                    <div className="mypost-badges">
                      {post.roleTypes.map((r) => <span key={r} className="badge badge-green">{ROLE_LABELS[r]}</span>)}
                      {post.closed && <span className="badge badge-red">마감</span>}
                    </div>
                    <div className="mypost-actions">
                      {!post.closed && (
                        <button onClick={() => handleClose(post.id)} className="btn btn-outline btn-sm">마감 처리</button>
                      )}
                      <Link to={`/posts/${post.id}/applicants`} className="btn btn-ghost btn-sm">지원자 보기</Link>
                      <Link to={`/posts/${post.id}/edit`} className="btn btn-ghost btn-sm">수정</Link>
                      <button onClick={() => handleDelete(post.id)} className="btn btn-danger btn-sm">삭제</button>
                    </div>
                  </div>
                  <Link to={`/posts/${post.id}`} className="mypost-title">{post.title}</Link>
                  <div className="mypost-meta">
                    {post.difficulty && <span className="badge badge-gray">{DIFFICULTY_LABELS[post.difficulty]}</span>}
                    {post.projectType && <span className="badge badge-gray">{PROJECT_TYPE_LABELS[post.projectType]}</span>}
                    <span className="mypost-date">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'applications' ? (
          myApps.length === 0 ? (
            <div className="empty-state">
              <p>아직 지원한 공고가 없어요.</p>
              <Link to="/posts" className="btn btn-outline" style={{ marginTop: 16 }}>공고 보러 가기</Link>
            </div>
          ) : (
            <div className="myapp-list">
              {myApps.map((app) => (
                <div key={app.id} className="myapp-card card">
                  <div className="myapp-header">
                    <span className="badge badge-green">{ROLE_LABELS[app.roleType]}</span>
                    {app.postClosed && <span className="badge badge-red">마감</span>}
                    <span className="myapp-date">{new Date(app.createdAt).toLocaleDateString('ko-KR')} 지원</span>
                  </div>
                  <Link to={`/posts/${app.postId}`} className="myapp-title">{app.postTitle}</Link>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="settings-section">
            <div className="settings-card card">
              <h2 className="settings-title">비밀번호 변경</h2>
              <form onSubmit={handlePasswordChange} className="settings-form">
                <div className="form-group">
                  <label className="form-label">현재 비밀번호</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="현재 비밀번호를 입력하세요"
                    value={pwForm.currentPassword}
                    onChange={(e) => { setPwForm((f) => ({ ...f, currentPassword: e.target.value })); setPwCurrentWrong(false); }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">새 비밀번호</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                    required
                  />
                </div>
                {pwError && <p className="settings-error">{pwError}</p>}
                {pwSuccess && <p className="settings-success">비밀번호가 변경되었습니다.</p>}
                <button type="submit" className="btn btn-primary" disabled={pwLoading || pwCurrentWrong}>
                  {pwLoading ? '변경 중...' : '변경하기'}
                </button>
              </form>
            </div>

            <div className="settings-card card danger-zone">
              <h2 className="settings-title danger-title">회원탈퇴</h2>
              <p className="danger-desc">탈퇴하면 모든 공고와 지원 내역이 삭제되며 복구할 수 없습니다.</p>
              <button onClick={handleWithdraw} className="btn btn-danger">회원탈퇴</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}