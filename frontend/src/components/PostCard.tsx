import { Link } from 'react-router-dom';
import type { PostSummaryResponse } from '../api/types';
import { ROLE_LABELS, DIFFICULTY_LABELS, PROJECT_TYPE_LABELS } from '../api/types';
import './PostCard.css';

interface Props {
  post: PostSummaryResponse;
}

export default function PostCard({ post }: Props) {
  return (
    <Link to={`/posts/${post.id}`} className="post-card card">
      <div className="post-card-top">
        <div className="post-card-roles">
          {post.roleTypes.map((r) => (
            <span key={r} className="badge badge-green">{ROLE_LABELS[r]}</span>
          ))}
        </div>
        {post.closed && <span className="badge badge-red">마감</span>}
      </div>
      <h3 className="post-card-title">{post.title}</h3>
      <div className="post-card-meta">
        {post.difficulty && (
          <span className="badge badge-gray">{DIFFICULTY_LABELS[post.difficulty]}</span>
        )}
        {post.projectType && (
          <span className="badge badge-gray">{PROJECT_TYPE_LABELS[post.projectType]}</span>
        )}
      </div>
      <div className="post-card-footer">
        <span className="post-card-author">{post.authorNickname}</span>
        <span className="post-card-date">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
      </div>
    </Link>
  );
}