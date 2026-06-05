import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyPosts, getMyApplications } from '../api/applications';
import { closePost, deletePost } from '../api/posts';
import type { MyApplicationResponse, PostSummaryResponse } from '../api/types';
import { ROLE_LABELS, DIFFICULTY_LABELS, PROJECT_TYPE_LABELS } from '../api/types';
import { useAuth } from '../context/AuthContext';
import './MyPage.css';

type Tab = 'posts' | 'applications';

export default function MyPage() {
  const { nickname } = useAuth();
  const [tab, setTab] = useState<Tab>('posts');

  const [myPosts, setMyPosts] = useState<PostSummaryResponse[]>([]);
  const [myApps, setMyApps] = useState<MyApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);

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
        </div>

        {loading ? (
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
        ) : (
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
        )}
      </div>
    </div>
  );
}