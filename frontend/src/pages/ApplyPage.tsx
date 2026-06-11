import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPost } from '../api/posts';
import { applyToPost, getMyApplicationForPost, updateMyApplication, withdrawMyApplication } from '../api/applications';
import type { PostDetailResponse, PostRoleResponse } from '../api/types';
import { ROLE_LABELS } from '../api/types';
import TechStackSelector from '../components/TechStackSelector';
import { useAuth } from '../context/AuthContext';
import './ApplyPage.css';

const NO_EXPERIENCE = '경험 없음';

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [post, setPost] = useState<PostDetailResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<PostRoleResponse | null>(null);
  const [motivation, setMotivation] = useState('');
  const [techStacks, setTechStacks] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    getPost(postId).then(async (res) => {
      const postData = res.data.data;
      setPost(postData);

      if (!isLoggedIn) {
        if (postData.roles.length === 1) setSelectedRole(postData.roles[0]);
        return;
      }

      try {
        const appRes = await getMyApplicationForPost(postId);
        const myApp = appRes.data.data;
        if (myApp) {
          setIsEdit(!myApp.withdrawn);
          const role = postData.roles.find((r) => r.id === myApp.roleId);
          if (role) setSelectedRole(role);
          setMotivation(myApp.motivation);
          setTechStacks(myApp.techStack ? myApp.techStack.split(',').map((s) => s.trim()).filter(Boolean) : []);
          setExperience(myApp.experience ?? '');
          setContact(myApp.contact);
          return;
        }
      } catch (err) {
        console.error('내 지원 정보 조회 실패:', err);
      }

      if (postData.roles.length === 1) setSelectedRole(postData.roles[0]);
    });
  }, [postId, isLoggedIn]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRole) { setError('지원할 역할을 선택해 주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      const payload = { roleId: selectedRole.id, motivation, techStack: techStacks.join(', '), experience, contact };
      if (isEdit) {
        await updateMyApplication(postId, payload);
      } else {
        await applyToPost(postId, payload);
      }
      navigate(`/posts/${postId}`, { state: { applied: true } });
    } catch (err: any) {
      setError(err.response?.data?.message ?? '지원에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('지원을 철회하시겠습니까?')) return;
    await withdrawMyApplication(postId);
    navigate(`/posts/${postId}`);
  };

  if (!post) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="apply-page page">
      <div className="container">
        <h1 className="apply-title">{isEdit ? '지원서 수정' : '지원하기'}</h1>
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
                  onClick={() => { setSelectedRole(role); setTechStacks([]); }}
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
            <TechStackSelector
              roleType={selectedRole?.roleType ?? 'BACKEND'}
              options={[
                ...((selectedRole?.techStack ?? '').split(',').map((s) => s.trim()).filter(Boolean)),
                NO_EXPERIENCE,
              ]}
              selected={techStacks}
              onChange={setTechStacks}
              placeholder={selectedRole ? '기술 스택 선택' : '먼저 지원 역할을 선택해 주세요'}
            />
            {techStacks.length > 0 && (
              <div className="ts-tags ts-tags-below">
                {techStacks.map((s) => (
                  <span key={s} className="ts-tag">
                    {s}
                    <button
                      type="button"
                      className="ts-tag-remove"
                      onClick={() => setTechStacks(techStacks.filter((x) => x !== s))}
                    >×</button>
                  </span>
                ))}
              </div>
            )}
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
            {isEdit && (
              <button type="button" className="btn btn-danger" onClick={handleWithdraw}>지원 철회</button>
            )}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? '제출 중...' : (isEdit ? '수정 완료' : '지원서 제출')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}