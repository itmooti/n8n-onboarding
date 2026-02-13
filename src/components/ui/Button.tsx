interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'dark' | 'sm';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const base =
    'font-sans font-bold uppercase tracking-[0.05em] transition-all duration-200 cursor-pointer rounded-[10px]';

  const variants: Record<string, string> = {
    primary: `px-8 py-3.5 text-[14px] text-white border-none ${
      disabled
        ? 'bg-gray-300 cursor-not-allowed'
        : 'bg-gradient-to-br from-accent to-accent-orange hover:shadow-[0_8px_25px_rgba(233,72,77,0.25)] hover:-translate-y-0.5'
    }`,
    ghost:
      'px-8 py-3.5 text-[14px] text-navy bg-transparent border-2 border-gray-border hover:border-accent/20 hover:bg-accent/[0.03]',
    dark: `px-8 py-3.5 text-[14px] text-white border-none bg-navy ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#161a38]'
    }`,
    sm: `px-5 py-2.5 text-[12px] text-white border-none ${
      disabled
        ? 'bg-gray-300 cursor-not-allowed'
        : 'bg-gradient-to-br from-accent to-accent-orange hover:shadow-[0_6px_20px_rgba(233,72,77,0.2)]'
    }`,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
