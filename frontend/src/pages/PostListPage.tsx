import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPosts } from '../api/posts';
import type { PostSummaryResponse, RoleType } from '../api/types';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import './PostListPage.css';

const TABS: { label: string; value: RoleType | 'ALL' }[] = [
  { label: '전체', value: 'ALL' },
  { label: '백엔드', value: 'BACKEND' },
  { label: '프론트엔드', value: 'FRONTEND' },
  { label: '디자인', value: 'DESIGN' },
  { label: '기획', value: 'PLANNING' },
];

export default function PostListPage() {
  const { isLoggedIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get('role') as RoleType | null;
  const activeTab: RoleType | 'ALL' = roleParam ?? 'ALL';

  const [posts, setPosts] = useState<PostSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPosts(activeTab === 'ALL' ? undefined : activeTab)
      .then((res) => setPosts(res.data.data))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const selectTab = (tab: RoleType | 'ALL') => {
    if (tab === 'ALL') setSearchParams({});
    else setSearchParams({ role: tab });
  };

  return (
    <div className="post-list-page page">
      <div className="container">
        <div className="post-list-header">
          <div>
            <h1 className="post-list-title">팀원 모집 공고</h1>
            <p className="post-list-sub">원하는 역할 탭에서 팀을 찾아보세요</p>
          </div>
          {isLoggedIn && (
            <Link to="/posts/new" className="btn btn-primary">+ 공고 올리기</Link>
          )}
        </div>

        <div className="role-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              className={`role-tab-btn ${activeTab === tab.value ? 'active' : ''}`}
              onClick={() => selectTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <p>아직 공고가 없어요.</p>
            {isLoggedIn && (
              <Link to="/posts/new" className="btn btn-outline" style={{ marginTop: 16 }}>첫 공고 올리기</Link>
            )}
          </div>
        ) : (
          <div className="post-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}