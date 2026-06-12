import { useEffect, useRef, useState } from 'react';
import './TechStackSelector.css';
import './SelectDropdown.css';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allLabel?: string;
}

export default function SelectDropdown({ options, value, onChange, placeholder = '선택 안함', allLabel }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="ts-selector" ref={ref}>
      <div className="ts-trigger" onClick={() => setOpen((o) => !o)}>
        <span className={selectedLabel ? 'ts-selected-label' : 'ts-placeholder'}>
          {selectedLabel ?? placeholder}
        </span>
        <span className="ts-arrow">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="ts-dropdown">
          <div className="ts-options">
            <div className={`ts-option ${value === '' ? 'ts-option-active' : ''}`} onClick={() => select('')}>
              <span>{allLabel ?? placeholder}</span>
            </div>
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`ts-option ${value === opt.value ? 'ts-option-active' : ''}`}
                onClick={() => select(opt.value)}
              >
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
