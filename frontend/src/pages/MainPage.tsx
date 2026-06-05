import { Link } from 'react-router-dom';
import { ROLE_LABELS, type RoleType } from '../api/types';
import './MainPage.css';

const ROLES: RoleType[] = ['BACKEND', 'FRONTEND', 'DESIGN', 'PLANNING'];

export default function MainPage() {
  return (
    <main className="main-page page">
      <section className="hero container">
        <p className="hero-sub">대학생 · 비전공자를 위한</p>
        <h1 className="hero-title">역할 중심 팀 프로젝트<br />구인 플랫폼</h1>
        <p className="hero-desc">
          원하는 역할 탭에서 공고를 찾고, 바로 지원해 보세요.<br />
          백엔드·프론트엔드·디자인·기획 별로 팀원을 모집할 수 있어요.
        </p>
        <div className="hero-actions">
          <Link to="/posts" className="btn btn-primary btn-lg">공고 둘러보기</Link>
          <Link to="/signup" className="btn btn-outline btn-lg">팀원 모집하기</Link>
        </div>
      </section>

      <section className="role-tabs-section container">
        <h2 className="section-title">역할별로 바로 찾기</h2>
        <div className="role-tab-grid">
          {ROLES.map((role) => (
            <Link key={role} to={`/posts?role=${role}`} className="role-tab-card card">
              <span className="role-tab-icon">{ROLE_ICONS[role]}</span>
              <span className="role-tab-name">{ROLE_LABELS[role]}</span>
              <span className="role-tab-desc">{ROLE_DESC[role]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="how-section container">
        <h2 className="section-title">이렇게 사용해요</h2>
        <div className="how-grid">
          {HOW_STEPS.map((step, i) => (
            <div key={i} className="how-card card">
              <span className="how-num">{i + 1}</span>
              <strong>{step.title}</strong>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const ROLE_ICONS: Record<RoleType, string> = {
  BACKEND: '⚙️', FRONTEND: '🖥️', DESIGN: '🎨', PLANNING: '📋',
};
const ROLE_DESC: Record<RoleType, string> = {
  BACKEND: 'API · 서버 · DB 개발자 모집',
  FRONTEND: 'UI · 인터랙션 개발자 모집',
  DESIGN: 'UI/UX · 그래픽 디자이너 모집',
  PLANNING: '서비스 기획 · PM 모집',
};
const HOW_STEPS = [
  { title: '역할 탭 선택', desc: '원하는 포지션 탭에서 공고를 탐색해요.' },
  { title: '공고 상세 확인', desc: '프로젝트 소개와 모집 조건을 꼼꼼히 읽어요.' },
  { title: '지원 폼 제출', desc: '지원동기·기술스택·연락처를 입력하고 지원해요.' },
  { title: '팀 합류', desc: '게시자가 연락처로 직접 컨택해 팀에 합류해요.' },
];