import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPost, deletePost, closePost } from '../api/posts';
import { getMyApplicationForPost, withdrawMyApplication } from '../api/applications';
import type { PostDetailResponse, ApplicationResponse } from '../api/types';
import { ROLE_LABELS, DIFFICULTY_LABELS, PROJECT_TYPE_LABELS } from '../api/types';
import { useAuth } from '../context/AuthContext';
import './PostDetailPage.css';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const { isLoggedIn, userId } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<PostDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [myApplication, setMyApplication] = useState<ApplicationResponse | null>(null);

  useEffect(() => {
    getPost(postId)
      .then((res) => setPost(res.data.data))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    if (!isLoggedIn) return;
    getMyApplicationForPost(postId)
      .then((res) => setMyApplication(res.data.data))
      .catch((err) => console.error('내 지원 정보 조회 실패:', err));
  }, [postId, isLoggedIn]);

  const isAuthor = post && userId !== null && post.authorId === userId;

  const handleWithdraw = async () => {
    if (!confirm('지원을 철회하시겠습니까?')) return;
    await withdrawMyApplication(postId);
    setMyApplication(null);
  };

  const handleClose = async () => {
    if (!confirm('공고를 마감하시겠습니까?')) return;
    await closePost(postId);
    setPost((p) => p ? { ...p, closed: true } : p);
  };

  const handleDelete = async () => {
    if (!confirm('공고를 삭제하시겠습니까?')) return;
    await deletePost(postId);
    navigate('/posts');
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!post) return <div className="page container"><p>공고를 찾을 수 없습니다.</p></div>;

  return (
    <div className="post-detail-page page">
      <div className="container">
        <div className="post-detail-back">
          <Link to="/posts" className="btn btn-ghost btn-sm">← 목록으로</Link>
        </div>

        <div className="post-detail-card card">
          <div className="post-detail-head">
            <div className="post-detail-badges">
              {post.roles.map((r) => (
                <span key={r.id} className="badge badge-green">{ROLE_LABELS[r.roleType]}</span>
              ))}
              {post.closed && <span className="badge badge-red">마감</span>}
            </div>
            {isAuthor && (
              <div className="post-detail-actions">
                {!post.closed && (
                  <button onClick={handleClose} className="btn btn-outline btn-sm">마감 처리</button>
                )}
                <Link to={`/posts/${postId}/edit`} className="btn btn-ghost btn-sm">수정</Link>
                <button onClick={handleDelete} className="btn btn-danger btn-sm">삭제</button>
                <Link to={`/posts/${postId}/applicants`} className="btn btn-primary btn-sm">지원자 보기</Link>
              </div>
            )}
          </div>

          <h1 className="post-detail-title">{post.title}</h1>
          {(post.applicationDeadline || post.projectStartDate || post.projectEndDate) && (
            <p className="post-detail-deadline">
              {post.applicationDeadline && (
                <>지원 마감일: {new Date(post.applicationDeadline).toLocaleDateString('ko-KR')}</>
              )}
              {post.applicationDeadline && (post.projectStartDate || post.projectEndDate) && ' · '}
              {(post.projectStartDate || post.projectEndDate) && (
                <>
                  프로젝트 기한: {post.projectStartDate ? new Date(post.projectStartDate).toLocaleDateString('ko-KR') : ''}
                  {' ~ '}
                  {post.projectEndDate ? new Date(post.projectEndDate).toLocaleDateString('ko-KR') : ''}
                </>
              )}
            </p>
          )}

          <div className="post-detail-meta">
            <span className="meta-item">작성자: <strong>{post.authorNickname}</strong></span>
            {post.difficulty && (
              <span className="badge badge-gray">{DIFFICULTY_LABELS[post.difficulty]}</span>
            )}
            {post.projectType && (
              <span className="badge badge-gray">{PROJECT_TYPE_LABELS[post.projectType]}</span>
            )}
            <span className="meta-item">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
          </div>

          {post.description && (
            <div className="post-detail-section">
              <h2>프로젝트 소개</h2>
              <p className="post-detail-desc">{post.description}</p>
            </div>
          )}

          <div className="post-detail-section">
            <h2>모집 역할</h2>
            <div className="role-cards">
              {post.roles.map((role) => (
                <div key={role.id} className="role-detail-card">
                  <div className="role-detail-header">
                    <span className="badge badge-green">{ROLE_LABELS[role.roleType]}</span>
                    {role.techStack && (
                      <div className="role-stacks">
                        {role.techStack.split(',').map((s) => (
                          <span key={s} className="badge badge-gray">{s.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {role.description && <p className="role-detail-desc">{role.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {!post.closed && isLoggedIn && !isAuthor && (
          <div className="apply-cta">
            {myApplication && !myApplication.withdrawn ? (
              <div className="apply-cta-actions">
                <Link to={`/posts/${postId}/apply`} className="btn btn-primary btn-lg">지원서 수정</Link>
                <button onClick={handleWithdraw} className="btn btn-danger btn-lg">지원 철회</button>
              </div>
            ) : (
              <Link to={`/posts/${postId}/apply`} className="btn btn-primary btn-lg">이 팀에 지원하기</Link>
            )}
          </div>
        )}
        {!isLoggedIn && (
          <div className="apply-cta">
            <p className="apply-cta-msg">지원하려면 로그인이 필요해요.</p>
            <Link to="/login" className="btn btn-primary btn-lg">로그인하고 지원하기</Link>
          </div>
        )}
      </div>
    </div>
  );
}