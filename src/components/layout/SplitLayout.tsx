interface SplitLayoutProps {
  video: React.ReactNode;
  children: React.ReactNode;
}

export function SplitLayout({ video, children }: SplitLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 items-start">
      <div className="md:sticky md:top-[80px]">{video}</div>
      <div>{children}</div>
    </div>
  );
}
