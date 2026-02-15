import { useState } from 'react';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  title: string;
  duration: string;
  src?: string;
  poster?: string;
}

export function VideoPlayer({ title, duration, src, poster }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);

  if (src && playing) {
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-border">
        <video
          src={src}
          poster={poster}
          controls
          autoPlay
          className="w-full"
          onEnded={() => setPlaying(false)}
        />
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl flex flex-col items-center justify-center min-h-[180px] sm:min-h-[260px] overflow-hidden border border-gray-border cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1128 60%, #161a38 100%)',
      }}
      onClick={() => src && setPlaying(true)}
    >
      {/* Dot grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(233,72,77,0.08) 0%, transparent 60%)',
        }}
      />

      {/* Play button */}
      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-accent to-accent-orange shadow-[0_0_30px_rgba(233,72,77,0.25)] mb-3 sm:mb-4 z-10 transition-transform duration-300 group-hover:scale-110">
        <Play size={18} className="text-white ml-0.5 sm:hidden" fill="white" />
        <Play size={22} className="text-white ml-0.5 hidden sm:block" fill="white" />
      </div>

      <span className="text-white font-semibold text-sm opacity-90 tracking-wide z-10">
        {title}
      </span>
      <span className="text-white/40 text-xs mt-1 font-mono z-10">
        {duration}
      </span>

      {/* Progress bar decoration */}
      <div className="absolute bottom-3 left-4 right-4 h-[3px] bg-white/10 rounded-full">
        <div className="w-[35%] h-full bg-gradient-to-r from-accent to-accent-orange rounded-full" />
      </div>
    </div>
  );
}
