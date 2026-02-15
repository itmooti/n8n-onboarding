interface StepHeadingProps {
  title: string;
  subtitle?: string;
}

export function StepHeading({ title, subtitle }: StepHeadingProps) {
  return (
    <div className="mb-5 sm:mb-7">
      <h2 className="text-[22px] sm:text-[28px] font-extrabold text-navy m-0 leading-[1.15] font-heading">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-500 text-[14px] sm:text-[15px] mt-2 sm:mt-2.5 leading-relaxed font-sans">
          {subtitle}
        </p>
      )}
    </div>
  );
}
