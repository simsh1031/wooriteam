import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getGroup, joinGroup } from '../api/groups';
import type { GroupDetailResponse } from '../api/types';
import { useAuth } from '../context/AuthContext';
import './GroupApplyPage.css';

export default function GroupApplyPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [group, setGroup] = useState<GroupDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [introduction, setIntroduction] = useState('');
  const [experience, setExperience] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    getGroup(groupId)
      .then((res) => setGroup(res.data.data))
      .catch((err) => setError(err.response?.data?.message ?? '그룹 정보를 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await joinGroup(groupId, { introduction, experience, portfolioLink, email });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? '가입 신청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;

  if (done) {
    return (
      <div className="group-apply-page page">
        <div className="container">
          <div className="group-apply-done card">
            <p>가입 신청이 접수되었습니다. 그룹장의 승인을 기다려 주세요.</p>
            <button className="btn btn-primary" onClick={() => navigate(`/groups/${groupId}`)}>그룹으로 돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="page container">
        <p className="form-error">{error || '그룹을 찾을 수 없습니다.'}</p>
        <Link to="/groups" className="btn btn-outline" style={{ marginTop: 16 }}>그룹 목록으로</Link>
      </div>
    );
  }

  const isOwner = group.myStatus === 'OWNER' || group.ownerId === userId;
  const canApply = group.myStatus === 'NONE' && !isOwner;

  return (
    <div className="group-apply-page page">
      <div className="container">
        <h1 className="group-apply-title">그룹 가입 신청</h1>

        <div className="group-apply-card card">
          <h2 className="group-apply-name">{group.name}</h2>
          <p className="group-apply-desc">{group.description || '그룹 소개가 없어요.'}</p>
          <div className="group-apply-meta">
            <span className="meta-item">그룹장 {group.ownerNickname}</span>
            <span className="meta-item">멤버 {group.memberCount}명</span>
          </div>

          {isOwner && <p className="group-apply-status">본인이 만든 그룹이에요.</p>}
          {!isOwner && group.myStatus === 'APPROVED' && <p className="group-apply-status">이미 가입된 그룹이에요.</p>}
          {!isOwner && group.myStatus === 'PENDING' && <p className="group-apply-status">이미 가입 신청을 보냈어요. 승인을 기다려 주세요.</p>}

          {canApply && (
            <form onSubmit={handleSubmit} className="group-apply-form">
              <div className="form-group">
                <label className="form-label">자기소개 *</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="간단한 자기소개를 작성해 주세요"
                  value={introduction} onChange={(e) => setIntroduction(e.target.value)}
                  rows={4} required
                />
              </div>

              <div className="form-group">
                <label className="form-label">경험 및 경력 *</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="관련 프로젝트, 경험, 경력 등을 작성해 주세요"
                  value={experience} onChange={(e) => setExperience(e.target.value)}
                  rows={4} required
                />
              </div>

              <div className="form-group">
                <label className="form-label">관련 링크</label>
                <input
                  className="form-input"
                  placeholder="포트폴리오, GitHub, 블로그 등 (선택)"
                  value={portfolioLink} onChange={(e) => setPortfolioLink(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">이메일 *</label>
                <input
                  className="form-input" type="email"
                  placeholder="연락 가능한 이메일을 입력하세요"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="form-error">{error}</p>}

              <div className="group-apply-actions">
                <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>취소</button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                  {submitting ? '신청 중...' : '신청 제출하기'}
                </button>
              </div>
            </form>
          )}

          {!canApply && (
            <>
              {error && <p className="form-error">{error}</p>}
              <div className="group-apply-actions">
                <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>돌아가기</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
