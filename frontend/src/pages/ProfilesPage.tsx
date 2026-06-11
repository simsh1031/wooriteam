import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicProfiles } from '../api/profiles';
import type { PublicProfileSummaryResponse, RoleType } from '../api/types';
import { ROLE_LABELS, TECH_STACKS, CAREER_TYPE_LABELS } from '../api/types';
import './ProfilesPage.css';

const TABS: { label: string; value: RoleType | 'ALL' }[] = [
  { label: '전체', value: 'ALL' },
  { label: '백엔드', value: 'BACKEND' },
  { label: '프론트엔드', value: 'FRONTEND' },
  { label: '디자인', value: 'DESIGN' },
  { label: '기획', value: 'PLANNING' },
];

function parseStacks(techStack: string | null): string[] {
  return techStack ? techStack.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<PublicProfileSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RoleType | 'ALL'>('ALL');

  useEffect(() => {
    getPublicProfiles()
      .then((res) => setProfiles(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const visibleProfiles = activeTab === 'ALL'
    ? profiles
    : profiles.filter((p) => parseStacks(p.techStack).some((s) => TECH_STACKS[activeTab].includes(s)));

  return (
    <div className="profiles-page page">
      <div className="container">
        <div className="profiles-header">
          <h1 className="profiles-title">회원 프로필</h1>
          <p className="profiles-sub">공개 설정된 회원들의 프로필을 확인하고 직접 컨택해 보세요</p>
        </div>

        <div className="role-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              className={`role-tab-btn ${activeTab === tab.value ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : visibleProfiles.length === 0 ? (
          <div className="empty-state">
            <p>공개된 프로필이 없어요.</p>
            <Link to="/my" className="btn btn-outline" style={{ marginTop: 16 }}>내 프로필 공개하기</Link>
          </div>
        ) : (
          <div className="profiles-grid">
            {visibleProfiles.map((profile) => {
              const allStacks = parseStacks(profile.techStack);
              const stacks = activeTab === 'ALL'
                ? allStacks
                : allStacks.filter((s) => TECH_STACKS[activeTab].includes(s));
              return (
                <Link key={profile.userId} to={`/profiles/${profile.userId}`} className="profile-card card">
                  <div className="profile-card-avatar">
                    {profile.nickname.slice(0, 1)}
                  </div>
                  <div className="profile-card-info">
                    <p className="profile-card-nickname">{profile.nickname}</p>
                    {profile.careerType && (
                      <p className="profile-card-exp">{CAREER_TYPE_LABELS[profile.careerType]}</p>
                    )}
                    {activeTab !== 'ALL' && (
                      <p className="profile-card-role-label">{ROLE_LABELS[activeTab]} 기술 스택</p>
                    )}
                    {stacks.length > 0 ? (
                      <div className="profile-card-stacks">
                        {stacks.slice(0, 4).map((ts) => (
                          <span key={ts} className="badge badge-green">{ts}</span>
                        ))}
                        {stacks.length > 4 && (
                          <span className="badge badge-gray">+{stacks.length - 4}</span>
                        )}
                      </div>
                    ) : (
                      <p className="profile-card-no-stack">기술 스택 미입력</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}