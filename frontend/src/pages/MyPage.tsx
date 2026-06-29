import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyPosts, getMyApplications, getMyBookmarks } from '../api/applications';
import { closePost, deletePost } from '../api/posts';
import { changePassword, withdraw } from '../api/auth';
import { getMyProfile, updateMyProfile } from '../api/profiles';
import { getMyGroups } from '../api/groups';
import type { MyApplicationResponse, MyGroupResponse, PostSummaryResponse, UserProfileResponse, RoleType, CareerType } from '../api/types';
import { ROLE_LABELS, DIFFICULTY_LABELS, PROJECT_TYPE_LABELS, TECH_STACKS, CAREER_TYPE_LABELS } from '../api/types';
import { useAuth } from '../context/AuthContext';
import TechStackSelector, { type TechStackSelectorHandle } from '../components/TechStackSelector';
import './MyPage.css';

type Tab = 'posts' | 'applications' | 'bookmarks' | 'groups' | 'profile' | 'settings';

const ALL_ROLES: RoleType[] = ['BACKEND', 'FRONTEND', 'DESIGN', 'PLANNING'];

type StackGroupKey = RoleType | 'ETC';
const STACK_GROUP_ORDER: StackGroupKey[] = ['BACKEND', 'FRONTEND', 'DESIGN', 'PLANNING', 'ETC'];
const STACK_GROUP_LABELS: Record<StackGroupKey, string> = { ...ROLE_LABELS, ETC: '기타' };

function groupStacksByRole(stacks: string[]): Record<StackGroupKey, string[]> {
  const groups: Record<StackGroupKey, string[]> = { BACKEND: [], FRONTEND: [], DESIGN: [], PLANNING: [], ETC: [] };
  for (const stack of stacks) {
    const matchedRoles = ALL_ROLES.filter((r) => TECH_STACKS[r].includes(stack));
    if (matchedRoles.length === 0) groups.ETC.push(stack);
    else matchedRoles.forEach((r) => groups[r].push(stack));
  }
  return groups;
}

export default function MyPage() {
  const { nickname, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('posts');

  const [myPosts, setMyPosts] = useState<PostSummaryResponse[]>([]);
  const [myApps, setMyApps] = useState<MyApplicationResponse[]>([]);
  const [myBookmarks, setMyBookmarks] = useState<PostSummaryResponse[]>([]);
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [myGroups, setMyGroups] = useState<MyGroupResponse[]>([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwCurrentWrong, setPwCurrentWrong] = useState(false);

  // profile state
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSelectedStacks, setProfileSelectedStacks] = useState<string[]>([]);
  const [profileCareerType, setProfileCareerType] = useState<CareerType | ''>('');
  const [profileExperience, setProfileExperience] = useState('');
  const [profileIsPublic, setProfileIsPublic] = useState(false);
  const [profileContactEmail, setProfileContactEmail] = useState('');
  const [profileRole, setProfileRole] = useState<RoleType>('BACKEND');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getMyPosts(), getMyApplications()])
      .then(([postsRes, appsRes]) => {
        setMyPosts(postsRes.data.data);
        setMyApps(appsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'bookmarks' && !bookmarksLoaded) {
      setBookmarksLoading(true);
      getMyBookmarks()
        .then((res) => { setMyBookmarks(res.data.data); setBookmarksLoaded(true); })
        .finally(() => setBookmarksLoading(false));
    }
  }, [tab, bookmarksLoaded]);

  useEffect(() => {
    if (tab === 'groups' && !groupsLoaded) {
      setGroupsLoading(true);
      getMyGroups()
        .then((res) => { setMyGroups(res.data.data); setGroupsLoaded(true); })
        .finally(() => setGroupsLoading(false));
    }
  }, [tab, groupsLoaded]);

  useEffect(() => {
    if (tab === 'profile' && !profileLoaded) {
      setProfileLoading(true);
      getMyProfile()
        .then((res) => {
          const p = res.data.data;
          setProfileData(p);
          setProfileCareerType(p.careerType ?? '');
          setProfileExperience(p.experience ?? '');
          setProfileIsPublic(p.isPublic);
          setProfileContactEmail(p.contactEmail ?? '');
          if (p.techStack) {
            setProfileSelectedStacks(p.techStack.split(',').map((s) => s.trim()).filter(Boolean));
          }
          setProfileLoaded(true);
        })
        .finally(() => setProfileLoading(false));
    }
  }, [tab, profileLoaded]);

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

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    if (profileIsPublic && !profileContactEmail.trim()) {
      setProfileError('공개 프로필로 설정하려면 연락 이메일을 입력해야 합니다.');
      return;
    }
    setProfileSaving(true);
    try {
      const res = await updateMyProfile({
        techStack: profileSelectedStacks.join(', '),
        careerType: profileCareerType || null,
        experience: profileExperience,
        isPublic: profileIsPublic,
        contactEmail: profileContactEmail,
      });
      setProfileData(res.data.data);
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError(err.response?.data?.message ?? '프로필 저장에 실패했습니다.');
    } finally {
      setProfileSaving(false);
    }
  };

  const stackGroups = groupStacksByRole(profileSelectedStacks);
  const techStackSelectorRef = useRef<TechStackSelectorHandle>(null);

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
          <button className={`mypage-tab ${tab === 'bookmarks' ? 'active' : ''}`} onClick={() => setTab('bookmarks')}>
            북마크 {bookmarksLoaded && <span className="tab-count">{myBookmarks.length}</span>}
          </button>
          <button className={`mypage-tab ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>
            내 그룹 {groupsLoaded && <span className="tab-count">{myGroups.length}</span>}
          </button>
          <button className={`mypage-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
            프로필 편집
          </button>
          <button className={`mypage-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            계정 관리
          </button>
        </div>

        {tab === 'posts' && (loading ? (
          <div className="spinner" />
        ) : myPosts.length === 0 ? (
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
                    <button onClick={() => handleDelete(post.id)} className="btn btn-outline btn-sm">삭제</button>
                    <Link to={`/posts/${post.id}/applicants`} className="btn btn-ghost btn-bordered btn-sm">지원자 보기</Link>
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
        ))}

        {tab === 'applications' && (loading ? (
          <div className="spinner" />
        ) : myApps.length === 0 ? (
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
                <Link to={`/posts/${app.postId}/apply`} className="myapp-title">{app.postTitle}</Link>
              </div>
            ))}
          </div>
        ))}

        {tab === 'bookmarks' && (bookmarksLoading ? (
          <div className="spinner" />
        ) : myBookmarks.length === 0 ? (
          <div className="empty-state">
            <p>아직 북마크한 공고가 없어요.</p>
            <Link to="/posts" className="btn btn-outline" style={{ marginTop: 16 }}>공고 보러 가기</Link>
          </div>
        ) : (
          <div className="mybookmark-list">
            {myBookmarks.map((post) => (
              <div key={post.id} className="mybookmark-card card">
                <div className="mybookmark-header">
                  <div className="mypost-badges">
                    {post.roleTypes.map((r) => <span key={r} className="badge badge-green">{ROLE_LABELS[r]}</span>)}
                    {post.closed && <span className="badge badge-red">마감</span>}
                  </div>
                  <span className="myapp-date">
                    {post.applicationDeadline
                      ? `마감일: ${new Date(post.applicationDeadline).toLocaleDateString('ko-KR')}`
                      : new Date(post.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <Link to={`/posts/${post.id}`} className="mypost-title">{post.title}</Link>
                <div className="mypost-meta">
                  {post.difficulty && <span className="badge badge-gray">{DIFFICULTY_LABELS[post.difficulty]}</span>}
                  {post.projectType && <span className="badge badge-gray">{PROJECT_TYPE_LABELS[post.projectType]}</span>}
                  <span className="mypost-date">{post.authorNickname}</span>
                </div>
              </div>
            ))}
          </div>
        ))}

        {tab === 'groups' && (groupsLoading ? (
          <div className="spinner" />
        ) : myGroups.length === 0 ? (
          <div className="empty-state">
            <p>아직 소속된 그룹이 없어요.</p>
            <Link to="/groups" className="btn btn-outline" style={{ marginTop: 16 }}>그룹 찾아보기</Link>
          </div>
        ) : (
          <div className="mygroup-list">
            {myGroups.map((group) => (
              <div key={group.id} className="mygroup-card card">
                <div className="mygroup-card-top">
                  <Link to={`/groups/${group.id}`} className="mypost-title">{group.name}</Link>
                  <span className={`badge ${group.role === 'OWNER' ? 'badge-green' : 'badge-gray'}`}>
                    {group.role === 'OWNER' ? '그룹장' : '멤버'}
                  </span>
                </div>
                <p className="mygroup-desc">{group.description || '그룹 소개가 없어요.'}</p>
                <div className="mygroup-card-footer">
                  <span className="mypost-date">멤버 {group.memberCount}명</span>
                  <Link to={`/groups/${group.id}?tab=posts`} className="btn btn-ghost btn-bordered btn-sm">모집 공고 보기</Link>
                </div>
              </div>
            ))}
          </div>
        ))}

        {tab === 'profile' && (profileLoading ? (
          <div className="spinner" />
        ) : (
          <div className="settings-section">
            <div className="settings-card card">
              <div className="profile-edit-header">
                <h2 className="settings-title">프로필 편집</h2>
                {profileData?.isPublic && (
                  <Link to="/profiles" className="btn btn-ghost btn-sm">내 공개 프로필 보기 →</Link>
                )}
              </div>

              <form onSubmit={handleProfileSave} className="profile-edit-form">
                <div className="form-group">
                  <label className="form-label">역할 선택 (기술 스택 카테고리)</label>
                  <div className="profile-role-tabs">
                    {ALL_ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={`profile-role-tab ${profileRole === r ? 'active' : ''}`}
                        onClick={() => { setProfileRole(r); techStackSelectorRef.current?.open(); }}
                      >
                        {ROLE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                  <TechStackSelector
                    ref={techStackSelectorRef}
                    roleType={profileRole}
                    selected={profileSelectedStacks}
                    onChange={setProfileSelectedStacks}
                    placeholder="기술 스택 선택 (여러 개 가능)"
                    maxHeight={260}
                  />
                  {profileSelectedStacks.length > 0 && (
                    <div className="profile-stack-groups">
                      {STACK_GROUP_ORDER.map((key) => {
                        const items = stackGroups[key];
                        if (items.length === 0) return null;
                        return (
                          <div key={key} className="profile-stack-group">
                            <span className="profile-stack-group-label">{STACK_GROUP_LABELS[key]}</span>
                            <div className="ts-tags">
                              {items.map((s) => (
                                <span key={s} className="ts-tag">
                                  {s}
                                  <button
                                    type="button"
                                    className="ts-tag-remove"
                                    onClick={() => setProfileSelectedStacks((prev) => prev.filter((x) => x !== s))}
                                  >×</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="form-hint">여러 역할에 걸쳐 기술 스택을 추가할 수 있어요. 탭을 전환해서 각 역할의 기술 스택을 선택하세요.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">경력 구분</label>
                  <select
                    className="form-input form-select"
                    value={profileCareerType}
                    onChange={(e) => setProfileCareerType(e.target.value as CareerType | '')}
                  >
                    <option value="">선택 안 함</option>
                    {(Object.keys(CAREER_TYPE_LABELS) as CareerType[]).map((key) => (
                      <option key={key} value={key}>{CAREER_TYPE_LABELS[key]}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">경력 및 경험</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="보유한 경험, 참여 프로젝트, 이력 등을 자유롭게 작성해 주세요."
                    value={profileExperience}
                    onChange={(e) => setProfileExperience(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <div className="profile-public-row">
                    <div>
                      <label className="form-label">프로필 공개</label>
                      <p className="form-hint">공개하면 다른 회원들이 내 프로필을 볼 수 있어요.</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={profileIsPublic}
                        onChange={(e) => setProfileIsPublic(e.target.checked)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    연락 이메일{profileIsPublic && <span className="required-mark"> *</span>}
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="공개 프로필에 표시될 연락처 이메일"
                    value={profileContactEmail}
                    onChange={(e) => setProfileContactEmail(e.target.value)}
                    required={profileIsPublic}
                  />
                  {profileIsPublic && (
                    <p className="form-hint warning">공개 프로필에 이 이메일이 노출됩니다.</p>
                  )}
                </div>

                {profileError && <p className="settings-error">{profileError}</p>}
                {profileSuccess && <p className="settings-success">프로필이 저장되었습니다.</p>}

                <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                  {profileSaving ? '저장 중...' : '저장하기'}
                </button>
              </form>
            </div>
          </div>
        ))}

        {tab === 'settings' && (
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