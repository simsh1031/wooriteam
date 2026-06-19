import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { approveGroupMember, getGroup, getGroupPosts, removeGroupMember } from '../api/groups';
import type { GroupDetailResponse, GroupMemberResponse, PostSummaryResponse } from '../api/types';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import './GroupDetailPage.css';

type Tab = 'info' | 'posts';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const [searchParams] = useSearchParams();
  const { userId } = useAuth();

  const [group, setGroup] = useState<GroupDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'posts' ? 'posts' : 'info');

  const [posts, setPosts] = useState<PostSummaryResponse[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [viewingApplicant, setViewingApplicant] = useState<GroupMemberResponse | null>(null);

  const loadGroup = () => {
    getGroup(groupId)
      .then((res) => setGroup(res.data.data))
      .catch((err) => setError(err.response?.data?.message ?? '그룹 정보를 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  useEffect(() => {
    if (tab === 'posts' && !postsLoaded) {
      setPostsLoading(true);
      getGroupPosts(groupId)
        .then((res) => { setPosts(res.data.data); setPostsLoaded(true); })
        .finally(() => setPostsLoading(false));
    }
  }, [tab, postsLoaded, groupId]);

  const handleApprove = async (memberId: number) => {
    await approveGroupMember(groupId, memberId);
    setViewingApplicant(null);
    loadGroup();
  };

  const handleReject = async (memberId: number) => {
    if (!confirm('이 가입 신청을 거절하시겠습니까?')) return;
    await removeGroupMember(groupId, memberId);
    setViewingApplicant(null);
    loadGroup();
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('이 멤버를 그룹에서 제외하시겠습니까?')) return;
    await removeGroupMember(groupId, memberId);
    loadGroup();
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;

  if (error || !group) {
    return (
      <div className="page container">
        <p className="form-error">{error || '그룹을 찾을 수 없습니다.'}</p>
        <Link to="/groups" className="btn btn-outline" style={{ marginTop: 16 }}>그룹 목록으로</Link>
      </div>
    );
  }

  const isOwner = group.myStatus === 'OWNER' || group.ownerId === userId;
  const canPost = isOwner || group.myStatus === 'APPROVED';
  const canApply = group.myStatus === 'NONE' && !isOwner;

  return (
    <div className="group-detail-page page">
      <div className="container">
        <div className="group-detail-back">
          <Link to="/groups" className="btn btn-ghost btn-sm">← 그룹 목록으로</Link>
        </div>

        <div className="group-detail-head card">
          <div className="group-detail-head-top">
            <div className="group-detail-badges">
              {isOwner && <span className="badge badge-green">그룹장</span>}
              {group.myStatus === 'APPROVED' && <span className="badge badge-gray">가입됨</span>}
              {group.myStatus === 'PENDING' && <span className="badge badge-yellow">승인 대기중</span>}
            </div>
            <div className="group-detail-actions">
              {canPost && (
                <Link to={`/posts/new?groupId=${group.id}`} className="btn btn-primary btn-sm">+ 공고 올리기</Link>
              )}
              {canApply && (
                <Link to={`/groups/${group.id}/apply`} className="btn btn-primary btn-sm">가입 신청</Link>
              )}
            </div>
          </div>
          <h1 className="group-detail-name">{group.name}</h1>
          <p className="group-detail-desc">{group.description || '그룹 소개가 없어요.'}</p>
          <div className="group-detail-meta">
            <span className="meta-item">그룹장 {group.ownerNickname}</span>
            <span className="meta-item">멤버 {group.memberCount}명</span>
            <span className="meta-item">{new Date(group.createdAt).toLocaleDateString('ko-KR')} 생성</span>
          </div>
        </div>

        <div className="group-detail-tabs">
          <button className={`group-detail-tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
            그룹 정보
          </button>
          <button className={`group-detail-tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>
            모집 공고 {postsLoaded && <span className="tab-count">{posts.length}</span>}
          </button>
        </div>

        {tab === 'info' && (
          <div className="group-detail-section">
            <h2 className="group-section-title">멤버 ({group.members.length + 1})</h2>
            <div className="group-member-list">
              <div className="group-member-row">
                <span className="group-member-name">{group.ownerNickname}</span>
                <span className="badge badge-green">그룹장</span>
              </div>
              {group.members.map((member) => (
                <div key={member.id} className="group-member-row">
                  <span className="group-member-name">{member.nickname}</span>
                  {isOwner && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveMember(member.id)}>제외</button>
                  )}
                </div>
              ))}
            </div>

            {isOwner && group.pendingMembers && (
              <>
                <h2 className="group-section-title">가입 신청 대기 ({group.pendingMembers.length})</h2>
                {group.pendingMembers.length === 0 ? (
                  <p className="group-empty-text">대기 중인 신청이 없어요.</p>
                ) : (
                  <div className="group-member-list">
                    {group.pendingMembers.map((member) => (
                      <div key={member.id} className="group-member-row">
                        <button type="button" className="group-member-name group-member-name-btn" onClick={() => setViewingApplicant(member)}>
                          {member.nickname}
                        </button>
                        <div className="group-member-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => setViewingApplicant(member)}>신청서 보기</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleApprove(member.id)}>승인</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(member.id)}>거절</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'posts' && (
          postsLoading ? (
            <div className="spinner" />
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <p>아직 이 그룹에 올라온 공고가 없어요.</p>
              {canPost && (
                <Link to={`/posts/new?groupId=${group.id}`} className="btn btn-outline" style={{ marginTop: 16 }}>첫 공고 올리기</Link>
              )}
            </div>
          ) : (
            <div className="post-grid">
              {posts.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          )
        )}
      </div>

      {viewingApplicant && (
        <div className="modal-overlay" onClick={() => setViewingApplicant(null)}>
          <div className="modal-panel group-apply-view" onClick={(e) => e.stopPropagation()}>
            <div className="group-apply-view-head">
              <h2 className="group-apply-view-title">{viewingApplicant.nickname}님의 가입 신청서</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setViewingApplicant(null)}>닫기</button>
            </div>

            <div className="form-group">
              <label className="form-label">자기소개</label>
              <div className="form-input form-textarea form-view">{viewingApplicant.introduction || '작성하지 않았어요.'}</div>
            </div>

            <div className="form-group">
              <label className="form-label">경험 및 경력</label>
              <div className="form-input form-textarea form-view">{viewingApplicant.experience || '작성하지 않았어요.'}</div>
            </div>

            <div className="form-group">
              <label className="form-label">관련 링크</label>
              <div className="form-input form-view">
                {viewingApplicant.portfolioLink
                  ? <a href={viewingApplicant.portfolioLink} target="_blank" rel="noreferrer">{viewingApplicant.portfolioLink}</a>
                  : '작성하지 않았어요.'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">이메일</label>
              <div className="form-input form-view">{viewingApplicant.email || '작성하지 않았어요.'}</div>
            </div>

            <div className="group-apply-actions">
              <button className="btn btn-danger btn-sm" onClick={() => handleReject(viewingApplicant.id)}>거절</button>
              <button className="btn btn-outline btn-sm" onClick={() => handleApprove(viewingApplicant.id)}>승인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
