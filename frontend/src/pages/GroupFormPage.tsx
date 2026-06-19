import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '../api/groups';
import './GroupFormPage.css';

export default function GroupFormPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createGroup({ name, description });
      navigate(`/groups/${res.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? '그룹 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group-form-page page">
      <div className="container">
        <h1 className="group-form-title">그룹 만들기</h1>
        <p className="group-form-sub">한 명당 그룹은 최대 1개까지 만들 수 있어요.</p>

        <form onSubmit={handleSubmit} className="group-form card">
          <div className="form-group">
            <label className="form-label">그룹명 *</label>
            <input
              className="form-input"
              placeholder="그룹 이름을 입력하세요"
              value={name} onChange={(e) => setName(e.target.value)} required
            />
          </div>

          <div className="form-group">
            <label className="form-label">그룹 소개</label>
            <textarea
              className="form-input form-textarea"
              placeholder="그룹을 소개해 주세요 (소속, 목표, 활동 방식 등)"
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="group-form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '생성 중...' : '그룹 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
