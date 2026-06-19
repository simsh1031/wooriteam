import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createPost, getPost, updatePost } from '../api/posts';
import { getGroup } from '../api/groups';
import type { Difficulty, PostRoleRequest, ProjectType, RoleType } from '../api/types';
import { ROLE_LABELS } from '../api/types';
import TechStackSelector from '../components/TechStackSelector';
import SelectDropdown from '../components/SelectDropdown';
import DateInput from '../components/DateInput';
import './PostFormPage.css';

const ROLE_OPTIONS: RoleType[] = ['BACKEND', 'FRONTEND', 'DESIGN', 'PLANNING'];
const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER', label: '입문' },
  { value: 'INTERMEDIATE', label: '중급' },
  { value: 'ADVANCED', label: '고급' },
];
const PROJECT_TYPE_OPTIONS = [
  { value: 'SIDE_PROJECT', label: '사이드 프로젝트' },
  { value: 'GRADUATION', label: '졸업작품' },
  { value: 'HACKATHON', label: '해커톤' },
  { value: 'STUDY', label: '스터디' },
  { value: 'OTHER', label: '기타' },
];

const emptyRole = (type: RoleType): PostRoleRequest => ({ roleType: type, description: '', techStack: '' });

export default function PostFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId') ? Number(searchParams.get('groupId')) : null;
  const [groupName, setGroupName] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [projectType, setProjectType] = useState<ProjectType | ''>('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>([]);
  const [roleDetails, setRoleDetails] = useState<Record<RoleType, PostRoleRequest>>({} as any);
  const [roleTechStacks, setRoleTechStacks] = useState<Record<RoleType, string[]>>({} as any);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getPost(Number(id)).then((res) => {
      const p = res.data.data;
      setTitle(p.title);
      setDescription(p.description ?? '');
      setDifficulty(p.difficulty ?? '');
      setProjectType(p.projectType ?? '');
      setApplicationDeadline(p.applicationDeadline ?? '');
      setProjectStartDate(p.projectStartDate ?? '');
      setProjectEndDate(p.projectEndDate ?? '');
      const roles = p.roles.map((r) => r.roleType);
      setSelectedRoles(roles);
      const details: Record<string, PostRoleRequest> = {};
      const stacks: Record<string, string[]> = {};
      p.roles.forEach((r) => {
        details[r.roleType] = { roleType: r.roleType, description: r.description ?? '', techStack: r.techStack ?? '' };
        stacks[r.roleType] = r.techStack ? r.techStack.split(',').map((s) => s.trim()).filter(Boolean) : [];
      });
      setRoleDetails(details as any);
      setRoleTechStacks(stacks as any);
    });
  }, [id]);

  useEffect(() => {
    if (!groupId || isEdit) return;
    getGroup(groupId).then((res) => setGroupName(res.data.data.name)).catch(() => {});
  }, [groupId, isEdit]);

  const toggleRole = (role: RoleType) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
    if (!roleDetails[role]) {
      setRoleDetails((prev) => ({ ...prev, [role]: emptyRole(role) }));
      setRoleTechStacks((prev) => ({ ...prev, [role]: [] }));
    }
  };

  const updateRoleDescription = (role: RoleType, value: string) => {
    setRoleDetails((prev) => ({ ...prev, [role]: { ...prev[role], description: value } }));
  };

  const updateRoleTechStack = (role: RoleType, stacks: string[]) => {
    setRoleTechStacks((prev) => ({ ...prev, [role]: stacks }));
    setRoleDetails((prev) => ({ ...prev, [role]: { ...prev[role], techStack: stacks.join(', ') } }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) { setError('모집 역할을 최소 1개 선택해주세요.'); return; }
    setError('');
    setLoading(true);
    const data = {
      title, description,
      difficulty: difficulty || ('' as any),
      projectType: projectType || ('' as any),
      applicationDeadline: applicationDeadline || '',
      projectStartDate: projectStartDate || '',
      projectEndDate: projectEndDate || '',
      roles: selectedRoles.map((r) => roleDetails[r] ?? emptyRole(r)),
      groupId: !isEdit ? groupId : undefined,
    };
    try {
      if (isEdit) {
        await updatePost(Number(id), data);
        navigate(`/posts/${id}`);
      } else {
        const res = await createPost(data);
        navigate(`/posts/${res.data.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-form-page page">
      <div className="container">
        <h1 className="post-form-title">{isEdit ? '공고 수정' : '공고 작성'}</h1>
        {groupId && !isEdit && (
          <p className="post-form-group-notice">'{groupName || `그룹 #${groupId}`}' 그룹 전용 공고로 등록됩니다.</p>
        )}
        <form onSubmit={handleSubmit} className="post-form card">
          <div className="form-group">
            <label className="form-label">제목 *</label>
            <input
              className="form-input" placeholder="공고 제목을 입력하세요"
              value={title} onChange={(e) => setTitle(e.target.value)} required
            />
          </div>

          <div className="form-group">
            <label className="form-label">지원 마감일</label>
            <DateInput
              className="form-input"
              value={applicationDeadline} onChange={setApplicationDeadline}
            />
          </div>

          <div className="form-group">
            <label className="form-label">프로젝트 기한</label>
            <div className="form-row">
              <DateInput
                className="form-input"
                value={projectStartDate} onChange={setProjectStartDate}
              />
              <DateInput
                className="form-input"
                value={projectEndDate} onChange={setProjectEndDate}
                min={projectStartDate || undefined}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">난이도</label>
              <SelectDropdown
                options={DIFFICULTY_OPTIONS}
                value={difficulty}
                onChange={(v) => setDifficulty(v as Difficulty | '')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">프로젝트 유형</label>
              <SelectDropdown
                options={PROJECT_TYPE_OPTIONS}
                value={projectType}
                onChange={(v) => setProjectType(v as ProjectType | '')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">프로젝트 소개</label>
            <textarea
              className="form-input form-textarea"
              placeholder="프로젝트를 소개해 주세요"
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <div className="form-group">
            <label className="form-label">모집 역할 * (복수 선택 가능)</label>
            <div className="role-toggle-group">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role} type="button"
                  className={`role-toggle-btn ${selectedRoles.includes(role) ? 'active' : ''}`}
                  onClick={() => toggleRole(role)}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          {selectedRoles.map((role) => (
            <div key={role} className="role-detail-form">
              <h3 className="role-detail-form-title">
                <span className="badge badge-green">{ROLE_LABELS[role]}</span> 상세 정보
              </h3>
              <div className="form-group">
                <label className="form-label">역할 설명</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder={`${ROLE_LABELS[role]} 역할의 할 일을 설명해 주세요`}
                  value={roleDetails[role]?.description ?? ''}
                  onChange={(e) => updateRoleDescription(role, e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group form-group-spaced">
                <label className="form-label">기술 스택</label>
                <TechStackSelector
                  roleType={role}
                  selected={roleTechStacks[role] ?? []}
                  onChange={(stacks) => updateRoleTechStack(role, stacks)}
                  placeholder={`${ROLE_LABELS[role]} 기술 스택 선택`}
                />
                {(roleTechStacks[role] ?? []).length > 0 && (
                  <div className="ts-tags ts-tags-below">
                    {(roleTechStacks[role] ?? []).map((s) => (
                      <span key={s} className="ts-tag">
                        {s}
                        <button
                          type="button"
                          className="ts-tag-remove"
                          onClick={() => updateRoleTechStack(role, (roleTechStacks[role] ?? []).filter((x) => x !== s))}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {error && <p className="form-error">{error}</p>}
          <div className="post-form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '저장 중...' : (isEdit ? '수정 완료' : '공고 등록')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}