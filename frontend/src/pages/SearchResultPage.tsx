import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPosts } from '../api/posts';
import type { Difficulty, PostSummaryResponse, ProjectType, RoleType } from '../api/types';
import { DIFFICULTY_LABELS, PROJECT_TYPE_LABELS } from '../api/types';
import PostCard from '../components/PostCard';
import TechStackSelector from '../components/TechStackSelector';
import './SearchResultPage.css';

const TABS: { label: string; value: RoleType | 'ALL' }[] = [
  { label: '전체', value: 'ALL' },
  { label: '백엔드', value: 'BACKEND' },
  { label: '프론트엔드', value: 'FRONTEND' },
  { label: '디자인', value: 'DESIGN' },
  { label: '기획', value: 'PLANNING' },
];

const DIFFICULTIES: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const PROJECT_TYPES: ProjectType[] = ['SIDE_PROJECT', 'GRADUATION', 'HACKATHON', 'STUDY', 'OTHER'];

export default function SearchResultPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') ?? '';
  const roleParam = searchParams.get('role') as RoleType | null;
  const activeTab: RoleType | 'ALL' = roleParam ?? 'ALL';

  const [posts, setPosts] = useState<PostSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputVal, setInputVal] = useState(keyword);

  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [projectType, setProjectType] = useState<ProjectType | ''>('');
  const [selectedTechStacks, setSelectedTechStacks] = useState<string[]>([]);

  const effectiveRole: RoleType = activeTab === 'ALL' ? 'BACKEND' : activeTab;

  useEffect(() => { setInputVal(keyword); }, [keyword]);

  useEffect(() => {
    setSelectedTechStacks([]);
  }, [activeTab]);

  useEffect(() => {
    if (!keyword) { setPosts([]); setLoading(false); return; }
    setLoading(true);
    getPosts({
      keyword,
      role: activeTab === 'ALL' ? undefined : activeTab,
      difficulty: difficulty || undefined,
      projectType: projectType || undefined,
      techStack: selectedTechStacks.length > 0 ? selectedTechStacks : undefined,
    })
      .then((res) => setPosts(res.data.data))
      .finally(() => setLoading(false));
  }, [keyword, activeTab, difficulty, projectType, selectedTechStacks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (trimmed) {
      const params: Record<string, string> = { keyword: trimmed };
      if (activeTab !== 'ALL') params.role = activeTab;
      setSearchParams(params);
    }
  };

  const selectTab = (tab: RoleType | 'ALL') => {
    setSelectedTechStacks([]);
    const params: Record<string, string> = {};
    if (keyword) params.keyword = keyword;
    if (tab !== 'ALL') params.role = tab;
    setSearchParams(params);
  };

  const resetFilters = () => {
    setDifficulty('');
    setProjectType('');
    setSelectedTechStacks([]);
  };

  const hasFilter = difficulty || projectType || selectedTechStacks.length > 0;

  return (
    <div className="search-page page">
      <div className="container">
        <div className="search-header">
          <h1 className="search-title">검색 결과</h1>
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input form-input"
              placeholder="프로젝트 제목, 기술 스택, 소개 등으로 검색"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">검색</button>
          </form>
          {keyword && (
            <p className="search-keyword-label">
              <strong>"{keyword}"</strong> 검색 결과 {!loading && <span className="search-count">{posts.length}건</span>}
            </p>
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
          <select
            className="filter-select"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
          >
            <option value="">난이도 전체</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as ProjectType | '')}
          >
            <option value="">모집 유형 전체</option>
            {PROJECT_TYPES.map((pt) => (
              <option key={pt} value={pt}>{PROJECT_TYPE_LABELS[pt]}</option>
            ))}
          </select>

          <div className="filter-tech">
            <TechStackSelector
              roleType={effectiveRole}
              selected={selectedTechStacks}
              onChange={setSelectedTechStacks}
              placeholder="기술 스택 필터"
            />
          </div>

          {hasFilter && (
            <button className="btn btn-ghost btn-sm filter-reset" onClick={resetFilters}>
              필터 초기화
            </button>
          )}
        </div>

        {!keyword ? (
          <div className="empty-state">
            <p>검색어를 입력해 공고를 찾아보세요.</p>
          </div>
        ) : loading ? (
          <div className="spinner" />
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <p>검색 결과가 없어요.</p>
            <Link to="/posts" className="btn btn-outline" style={{ marginTop: 16 }}>전체 공고 보기</Link>
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