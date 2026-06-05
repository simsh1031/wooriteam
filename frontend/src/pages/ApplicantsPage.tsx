import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApplicationsByPost } from '../api/applications';
import { getPost } from '../api/posts';
import type { ApplicationResponse, RoleType } from '../api/types';
import { ROLE_LABELS } from '../api/types';
import './ApplicantsPage.css';

export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);

  const [postTitle, setPostTitle] = useState('');
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRole, setActiveRole] = useState<RoleType | 'ALL'>('ALL');

  useEffect(() => {
    Promise.all([getPost(postId), getApplicationsByPost(postId)])
      .then(([postRes, appRes]) => {
        setPostTitle(postRes.data.data.title);
        setApplications(appRes.data.data);
      })
      .catch(() => setError('지원자 목록을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [postId]);

  const roles = [...new Set(applications.map((a) => a.roleType))];
  const filtered = activeRole === 'ALL' ? applications : applications.filter((a) => a.roleType === activeRole);

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (error) return <div className="page container"><p className="form-error">{error}</p></div>;

  return (
    <div className="applicants-page page">
      <div className="container">
        <div className="applicants-header">
          <Link to={`/posts/${postId}`} className="btn btn-ghost btn-sm">← 공고로 돌아가기</Link>
          <div>
            <h1 className="applicants-title">지원자 목록</h1>
            <p className="applicants-sub">{postTitle}</p>
          </div>
          <span className="applicants-count">총 {applications.length}명</span>
        </div>

        {roles.length > 1 && (
          <div className="applicant-role-tabs">
            <button
              className={`role-tab-btn ${activeRole === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveRole('ALL')}
            >전체</button>
            {roles.map((r) => (
              <button
                key={r}
                className={`role-tab-btn ${activeRole === r ? 'active' : ''}`}
                onClick={() => setActiveRole(r)}
              >
                {ROLE_LABELS[r]} ({applications.filter((a) => a.roleType === r).length})
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty-state"><p>지원자가 없습니다.</p></div>
        ) : (
          <div className="applicant-list">
            {filtered.map((app) => (
              <div key={app.id} className="applicant-card card">
                <div className="applicant-card-header">
                  <div className="applicant-info">
                    <span className="applicant-name">{app.applicantNickname}</span>
                    <span className="badge badge-green">{ROLE_LABELS[app.roleType]}</span>
                  </div>
                  <span className="applicant-date">{new Date(app.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="applicant-section">
                  <p className="applicant-section-label">지원동기</p>
                  <p className="applicant-section-text">{app.motivation}</p>
                </div>
                {app.techStack && (
                  <div className="applicant-stacks">
                    {app.techStack.split(',').map((s) => (
                      <span key={s} className="badge badge-gray">{s.trim()}</span>
                    ))}
                  </div>
                )}
                {app.experience && (
                  <div className="applicant-section">
                    <p className="applicant-section-label">경험</p>
                    <p className="applicant-section-text">{app.experience}</p>
                  </div>
                )}
                <div className="applicant-contact">
                  <span className="applicant-section-label">연락처</span>
                  <span className="applicant-contact-value">{app.contact}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}