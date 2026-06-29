import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPosts } from '../api/posts';
import type { Difficulty, PostSummaryResponse, ProjectType, RoleType } from '../api/types';
import { DIFFICULTY_LABELS, PROJECT_TYPE_LABELS } from '../api/types';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import TechStackSelector from '../components/TechStackSelector';
import SelectDropdown from '../components/SelectDropdown';
import './PostListPage.css';

const TABS: { label: string; value: RoleType | 'ALL' }[] = [
  { label: '전체', value: 'ALL' },
  { label: '백엔드', value: 'BACKEND' },
  { label: '프론트엔드', value: 'FRONTEND' },
  { label: '디자인', value: 'DESIGN' },
  { label: '기획', value: 'PLANNING' },
];

const DIFFICULTIES: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const PROJECT_TYPES: ProjectType[] = ['SIDE_PROJECT', 'GRADUATION', 'HACKATHON', 'STUDY', 'OTHER'];

export default function PostListPage() {
  const { isLoggedIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get('role') as RoleType | null;
  const activeTab: RoleType | 'ALL' = roleParam ?? 'ALL';

  const [posts, setPosts] = useState<PostSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [projectType, setProjectType] = useState<ProjectType | ''>('');
  const [selectedTechStacks, setSelectedTechStacks] = useState<string[]>([]);

  const effectiveRole: RoleType = activeTab === 'ALL' ? 'BACKEND' : activeTab;

  useEffect(() => {
    setSelectedTechStacks([]);
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    getPosts({
      role: activeTab === 'ALL' ? undefined : activeTab,
      difficulty: difficulty || undefined,
      projectType: projectType || undefined,
      techStack: selectedTechStacks.length > 0 ? selectedTechStacks : undefined,
    })
      .then((res) => setPosts(res.data.data))
      .finally(() => setLoading(false));
  }, [activeTab, difficulty, projectType, selectedTechStacks]);

  const selectTab = (tab: RoleType | 'ALL') => {
    setDifficulty('');
    setProjectType('');
    setSelectedTechStacks([]);
    if (tab === 'ALL') setSearchParams({});
    else setSearchParams({ role: tab });
  };

  const resetFilters = () => {
    setDifficulty('');
    setProjectType('');
    setSelectedTechStacks([]);
  };

  const hasFilter = difficulty || projectType || selectedTechStacks.length > 0;

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

        <div className="filter-bar">
          <div className="filter-dropdown">
            <SelectDropdown
              options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))}
              value={difficulty}
              onChange={(v) => setDifficulty(v as Difficulty | '')}
              placeholder="난이도 전체"
            />
          </div>

          <div className="filter-dropdown">
            <SelectDropdown
              options={PROJECT_TYPES.map((pt) => ({ value: pt, label: PROJECT_TYPE_LABELS[pt] }))}
              value={projectType}
              onChange={(v) => setProjectType(v as ProjectType | '')}
              placeholder="모집 유형 전체"
            />
          </div>

          <div className="filter-tech">
            <TechStackSelector
              roleType={effectiveRole}
              selected={selectedTechStacks}
              onChange={setSelectedTechStacks}
              placeholder={`기술 스택 필터 (${activeTab === 'ALL' ? '전체' : TABS.find(t => t.value === activeTab)?.label})`}
            />
          </div>

          {hasFilter && (
            <button className="btn btn-ghost btn-sm filter-reset" onClick={resetFilters}>
              필터 초기화
            </button>
          )}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <p>{hasFilter ? '필터 조건에 맞는 공고가 없어요.' : '아직 공고가 없어요.'}</p>
            {hasFilter ? (
              <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={resetFilters}>필터 초기화</button>
            ) : isLoggedIn && (
              <Link to="/posts/new" className="btn btn-outline" style={{ marginTop: 16 }}>첫 공고 올리기</Link>
            )}
          </div>
        ) : (
          <div className="post-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} activeRole={activeTab !== 'ALL' ? activeTab : undefined} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}