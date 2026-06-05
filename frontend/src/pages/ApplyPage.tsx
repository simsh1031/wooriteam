import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPost } from '../api/posts';
import { applyToPost } from '../api/applications';
import type { PostDetailResponse, PostRoleResponse } from '../api/types';
import { ROLE_LABELS } from '../api/types';
import './ApplyPage.css';

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const navigate = useNavigate();

  const [post, setPost] = useState<PostDetailResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<PostRoleResponse | null>(null);
  const [motivation, setMotivation] = useState('');
  const [techStack, setTechStack] = useState('');
  const [experience, setExperience] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPost(postId).then((res) => {
      setPost(res.data.data);
      if (res.data.data.roles.length === 1) setSelectedRole(res.data.data.roles[0]);
    });
  }, [postId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRole) { setError('지원할 역할을 선택해 주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      await applyToPost(postId, {
        roleId: selectedRole.id, motivation, techStack, experience, contact,
      });
      navigate(`/posts/${postId}`, { state: { applied: true } });
    } catch (err: any) {
      setError(err.response?.data?.message ?? '지원에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!post) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="apply-page page">
      <div className="container">
        <h1 className="apply-title">지원하기</h1>
        <div className="apply-post-info card">
          <p className="apply-post-label">지원 공고</p>
          <p className="apply-post-name">{post.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="apply-form card">
          <div className="form-group">
            <label className="form-label">지원 역할 *</label>
            <div className="role-select-group">
              {post.roles.map((role) => (
                <button
                  key={role.id} type="button"
                  className={`role-select-btn ${selectedRole?.id === role.id ? 'active' : ''}`}
                  onClick={() => setSelectedRole(role)}
                >
                  {ROLE_LABELS[role.roleType]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">지원동기 *</label>
            <textarea
              className="form-input form-textarea"
              placeholder="이 팀에 지원하는 이유를 작성해 주세요"
              value={motivation} onChange={(e) => setMotivation(e.target.value)}
              rows={5} required
            />
          </div>

          <div className="form-group">
            <label className="form-label">기술 스택</label>
            <input
              className="form-input"
              placeholder="예: React, TypeScript, Figma"
              value={techStack} onChange={(e) => setTechStack(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">경험 및 이력</label>
            <textarea
              className="form-input form-textarea"
              placeholder="관련 프로젝트 경험이나 이력을 소개해 주세요"
              value={experience} onChange={(e) => setExperience(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">연락처 *</label>
            <input
              className="form-input"
              placeholder="게시자가 연락할 수 있는 방법 (이메일, 오픈카카오 등)"
              value={contact} onChange={(e) => setContact(e.target.value)} required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="apply-form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>취소</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? '제출 중...' : '지원서 제출'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}