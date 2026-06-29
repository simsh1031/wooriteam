import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublicProfileDetail } from '../api/profiles';
import type { PublicProfileDetailResponse } from '../api/types';
import { CAREER_TYPE_LABELS } from '../api/types';
import './ProfileDetailPage.css';

export default function ProfileDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfileDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    getPublicProfileDetail(Number(userId))
      .then((res) => setProfile(res.data.data))
      .catch((err) => {
        const msg = err.response?.data?.message ?? '프로필을 불러오지 못했습니다.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="page"><div className="container"><div className="spinner" /></div></div>;

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <p>{error}</p>
            <Link to="/profiles" className="btn btn-outline" style={{ marginTop: 16 }}>프로필 목록으로</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const techStacks = profile.techStack ? profile.techStack.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="profile-detail-page page">
      <div className="container">
        <Link to="/profiles" className="back-link">← 프로필 목록</Link>

        <div className="profile-detail-card card">
          <div className="profile-detail-top">
            <div className="profile-detail-avatar">
              {profile.nickname.slice(0, 1)}
            </div>
            <div className="profile-detail-identity">
              <h1 className="profile-detail-nickname">{profile.nickname}</h1>
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="profile-detail-email">
                  {profile.email}
                </a>
              )}
            </div>
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="btn btn-primary profile-contact-btn">
                이메일로 컨택
              </a>
            )}
          </div>

          {techStacks.length > 0 && (
            <div className="profile-detail-section">
              <h2 className="profile-section-title">기술 스택</h2>
              <div className="profile-tech-list">
                {techStacks.map((ts) => (
                  <span key={ts} className="badge badge-green profile-tech-badge">{ts}</span>
                ))}
              </div>
            </div>
          )}

          {profile.careerType && (
            <div className="profile-detail-section">
              <h2 className="profile-section-title">경력 구분</h2>
              <p className="profile-experience">{CAREER_TYPE_LABELS[profile.careerType]}</p>
            </div>
          )}

          {profile.experience && (
            <div className="profile-detail-section">
              <h2 className="profile-section-title">경력 및 경험</h2>
              <p className="profile-experience">{profile.experience}</p>
            </div>
          )}

          {!profile.techStack && !profile.careerType && !profile.experience && (
            <p className="profile-empty-info">입력된 정보가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}