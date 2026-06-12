import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  className?: string;
}

export default function DateInput({ value, onChange, min, className }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <input
      ref={ref}
      type="date"
      className={className}
      value={value}
      min={min}
      onChange={(e) => onChange(e.target.value)}
      onClick={() => ref.current?.showPicker?.()}
    />
  );
}
