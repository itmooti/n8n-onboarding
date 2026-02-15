import { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(color);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync hex input when color changes externally
  useEffect(() => {
    setHexInput(color);
  }, [color]);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleHexChange = (value: string) => {
    // Allow typing without # prefix
    let hex = value.startsWith('#') ? value : `#${value}`;
    setHexInput(hex);

    // Only update if it's a valid hex color
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Swatch button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-[10px] border-2 border-gray-border cursor-pointer transition-all hover:scale-105 hover:shadow-md"
        style={{ background: color }}
        title={label || 'Pick colour'}
      />

      {/* Popover */}
      {open && (
        <div className="absolute top-14 left-0 z-50 bg-white rounded-xl shadow-[0_12px_40px_rgba(15,17,40,0.15)] border border-gray-border p-3 animate-in fade-in">
          {label && (
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-2">
              {label}
            </div>
          )}

          <HexColorPicker color={color} onChange={onChange} />

          {/* Hex input */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md border border-gray-border flex-shrink-0"
              style={{ background: color }}
            />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              maxLength={7}
              className="flex-1 px-2.5 py-1.5 rounded-lg border-2 border-gray-border text-xs font-mono text-navy font-bold bg-white outline-none focus:border-accent transition-colors box-border"
              placeholder="#000000"
            />
          </div>
        </div>
      )}
    </div>
  );
}
