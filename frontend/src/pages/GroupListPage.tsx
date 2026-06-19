import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGroups, getMyGroups } from '../api/groups';
import type { GroupSummaryResponse, MyGroupResponse } from '../api/types';
import { useAuth } from '../context/AuthContext';
import './GroupListPage.css';

const MAX_JOINED_GROUPS = 3;

export default function GroupListPage() {
  const { isLoggedIn, userId } = useAuth();
  const [groups, setGroups] = useState<GroupSummaryResponse[]>([]);
  const [myGroups, setMyGroups] = useState<MyGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getGroups(),
      isLoggedIn ? getMyGroups() : Promise.resolve(null),
    ])
      .then(([groupsRes, myGroupsRes]) => {
        setGroups(groupsRes.data.data);
        if (myGroupsRes) setMyGroups(myGroupsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const ownedGroupId = myGroups.find((g) => g.role === 'OWNER')?.id;
  const joinedCount = myGroups.filter((g) => g.role === 'MEMBER').length;
  const canCreateGroup = isLoggedIn && !ownedGroupId;
  const canJoinMore = joinedCount < MAX_JOINED_GROUPS;

  const statusOf = (groupId: number): 'OWNER' | 'MEMBER' | 'NONE' =>
    myGroups.find((g) => g.id === groupId)?.role ?? 'NONE';

  return (
    <div className="group-list-page page">
      <div className="container">
        <div className="group-list-header">
          <div>
            <h1 className="group-list-title">그룹 찾기</h1>
            <p className="group-list-sub">관심 있는 그룹에 가입 신청하고 함께 팀을 꾸려보세요</p>
          </div>
          {isLoggedIn && (
            canCreateGroup ? (
              <Link to="/groups/new" className="btn btn-primary">+ 그룹 만들기</Link>
            ) : ownedGroupId ? (
              <Link to={`/groups/${ownedGroupId}`} className="btn btn-outline">내 그룹 보기</Link>
            ) : null
          )}
        </div>

        {isLoggedIn && !canJoinMore && (
          <p className="group-list-notice">이미 최대 {MAX_JOINED_GROUPS}개의 그룹에 가입했어요. 더 가입하려면 기존 그룹에서 나가야 해요.</p>
        )}

        {loading ? (
          <div className="spinner" />
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <p>아직 생성된 그룹이 없어요.</p>
            {isLoggedIn && canCreateGroup && (
              <Link to="/groups/new" className="btn btn-outline" style={{ marginTop: 16 }}>첫 그룹 만들기</Link>
            )}
          </div>
        ) : (
          <div className="group-grid">
            {groups.map((group) => {
              const isOwnGroup = group.ownerId === userId;
              const status = isOwnGroup ? 'OWNER' : statusOf(group.id);
              return (
                <div key={group.id} className="group-card card">
                  <div className="group-card-top">
                    <h3 className="group-card-name">{group.name}</h3>
                    {status === 'OWNER' && <span className="badge badge-green">그룹장</span>}
                    {status === 'MEMBER' && <span className="badge badge-gray">가입됨</span>}
                  </div>
                  <p className="group-card-desc">{group.description || '그룹 소개가 없어요.'}</p>
                  <div className="group-card-meta">
                    <span className="meta-item">그룹장 {group.ownerNickname}</span>
                    <span className="meta-item">멤버 {group.memberCount}명</span>
                  </div>
                  <div className="group-card-actions">
                    <Link to={`/groups/${group.id}`} className="btn btn-ghost btn-bordered btn-sm">상세 보기</Link>
                    {status === 'NONE' && isLoggedIn && (
                      <Link
                        to={`/groups/${group.id}/apply`}
                        className={`btn btn-primary btn-sm ${!canJoinMore ? 'btn-disabled' : ''}`}
                        onClick={(e) => { if (!canJoinMore) e.preventDefault(); }}
                      >
                        가입 신청
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
