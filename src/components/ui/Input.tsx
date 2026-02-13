import { useState } from 'react';

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-[0.1em] font-sans">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full px-4 py-3 rounded-[10px] border-2 text-[15px] font-sans outline-none transition-all bg-white box-border ${
          focused ? 'border-accent shadow-[0_0_0_3px_rgba(233,72,77,0.08)]' : 'border-gray-border'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}
