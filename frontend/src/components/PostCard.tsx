import { Link } from 'react-router-dom';
import type { PostSummaryResponse, RoleType } from '../api/types';
import { ROLE_LABELS, DIFFICULTY_LABELS, PROJECT_TYPE_LABELS } from '../api/types';
import './PostCard.css';

interface Props {
  post: PostSummaryResponse;
  activeRole?: RoleType;
}

export default function PostCard({ post, activeRole }: Props) {
  const techStacks = activeRole
    ? (post.roleStacks.find((r) => r.roleType === activeRole)?.techStack ?? '')
        .split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Link to={`/posts/${post.id}`} className="post-card card">
      <div className="post-card-top">
        <div className="post-card-roles">
          {post.roleTypes.map((r) => (
            <span key={r} className="badge badge-green">{ROLE_LABELS[r]}</span>
          ))}
        </div>
        <div className="post-card-top-right">
          {post.applicationDeadline && (
            <span className="post-card-apply-deadline">
              지원 마감: {new Date(post.applicationDeadline).toLocaleDateString('ko-KR')}
            </span>
          )}
          {post.closed && <span className="badge badge-red">마감</span>}
        </div>
      </div>
      <h3 className="post-card-title">{post.title}</h3>
      {(post.projectStartDate || post.projectEndDate) && (
        <p className="post-card-deadline">
          프로젝트 기한: {post.projectStartDate ? new Date(post.projectStartDate).toLocaleDateString('ko-KR') : ''}
          {' ~ '}
          {post.projectEndDate ? new Date(post.projectEndDate).toLocaleDateString('ko-KR') : ''}
        </p>
      )}
      <div className="post-card-meta">
        {post.difficulty && (
          <span className="badge badge-yellow">{DIFFICULTY_LABELS[post.difficulty]}</span>
        )}
        {post.projectType && (
          <span className="badge badge-gray">{PROJECT_TYPE_LABELS[post.projectType]}</span>
        )}
      </div>
      {techStacks.length > 0 && (
        <div className="post-card-stacks">
          {techStacks.slice(0, 4).map((ts) => (
            <span key={ts} className="badge badge-outline">{ts}</span>
          ))}
          {techStacks.length > 4 && (
            <span className="badge badge-outline">+{techStacks.length - 4}</span>
          )}
        </div>
      )}
      <div className="post-card-footer">
        <span className="post-card-author">{post.authorNickname}</span>
        <span className="post-card-date">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
      </div>
    </Link>
  );
}