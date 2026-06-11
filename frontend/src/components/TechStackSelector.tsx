import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { RoleType } from '../api/types';
import { TECH_STACKS } from '../api/types';
import './TechStackSelector.css';

interface Props {
  roleType: RoleType;
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxHeight?: number;
}

export interface TechStackSelectorHandle {
  open: () => void;
}

const TechStackSelector = forwardRef<TechStackSelectorHandle, Props>(function TechStackSelector({ roleType, selected, onChange, placeholder = '기술 스택 선택', maxHeight = 280 }, forwardedRef) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const options = TECH_STACKS[roleType];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useImperativeHandle(forwardedRef, () => ({
    open: () => setOpen(true),
  }));

  const toggle = (item: string) => {
    if (selected.includes(item)) onChange(selected.filter((s) => s !== item));
    else onChange([...selected, item]);
  };

  const addCustom = () => {
    const val = customInput.trim();
    if (val && !selected.includes(val)) onChange([...selected, val]);
    setCustomInput('');
  };

  return (
    <div className="ts-selector" ref={ref}>
      <div className="ts-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="ts-placeholder">
          {selected.length === 0 ? placeholder : `${selected.length}개 선택됨`}
        </span>
        <span className="ts-arrow">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="ts-dropdown" style={{ maxHeight }}>
          <div className="ts-options">
            {options.map((opt) => (
              <label key={opt} className="ts-option">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          <div className="ts-custom">
            <input
              type="text"
              className="ts-custom-input"
              placeholder="기타 직접 입력"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            />
            <button type="button" className="ts-custom-btn" onClick={addCustom}>추가</button>
          </div>
          <button type="button" className="ts-done-btn" onClick={() => setOpen(false)}>완료</button>
        </div>
      )}
    </div>
  );
});

export default TechStackSelector;