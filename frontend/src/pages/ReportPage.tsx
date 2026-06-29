import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts } from '../api/posts';
import { createReport } from '../api/reports';
import type { PostSummaryResponse } from '../api/types';
import './ReportPage.css';

export default function ReportPage() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState<PostSummaryResponse[]>([]);
  const [postId, setPostId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getPosts().then((res) => setPosts(res.data.data));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!postId) { setError('신고할 공고를 선택해 주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      await createReport({ postId: Number(postId), title, content });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? '신고 접수에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="report-page page">
        <div className="container">
          <div className="report-done card">
            <p>신고가 접수되었습니다. 검토 후 처리하겠습니다.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>메인으로</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page page">
      <div className="container">
        <h1 className="report-title">신고하기</h1>

        <form onSubmit={handleSubmit} className="report-form card">
          <div className="form-group">
            <label className="form-label">신고 제목 *</label>
            <input
              className="form-input"
              placeholder="신고 제목을 입력해 주세요"
              value={title} onChange={(e) => setTitle(e.target.value)} required
            />
          </div>

          <div className="form-group">
            <label className="form-label">신고하는 공고글 *</label>
            <select
              className="form-input"
              value={postId} onChange={(e) => setPostId(e.target.value)} required
            >
              <option value="" disabled>신고할 공고를 선택해 주세요</option>
              {posts.map((post) => (
                <option key={post.id} value={post.id}>{post.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">신고 내용 *</label>
            <textarea
              className="form-input form-textarea"
              placeholder="신고 사유를 자세히 작성해 주세요"
              value={content} onChange={(e) => setContent(e.target.value)}
              rows={6} required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="report-form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>취소</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? '제출 중...' : '신고'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
