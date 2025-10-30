import { useEffect, useRef, useState } from 'react';
import { RetroGrid } from '@/components/ui/retro-grid';

/**
 * StickyRetroBackground
 * Fixed RetroGrid that becomes visible only after its sentinel crosses the top.
 * Prevents overlap with the hero background while keeping a persistent grid
 * behind the lower sections.
 */
export function StickyRetroBackground({ targetOpacity = 0.25, triggerRatio = 0.6, className = '' }) {
  const sentinelRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      if (!sentinelRef.current) return;
      const rect = sentinelRef.current.getBoundingClientRect();
      const threshold = window.innerHeight * triggerRatio; // fade in before top hits viewport
      setVisible(rect.top <= threshold);
    }

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  return (
    <>
      {/* Sentinel marks where the background should start being visible */}
      <div ref={sentinelRef} />

      {/* Fixed retro grid behind subsequent content */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${className}`}
        style={{ opacity: visible ? targetOpacity : 0 }}
        aria-hidden="true"
      >
        <RetroGrid className="opacity-100" showGradient={false} />
      </div>
    </>
  );
}

export default StickyRetroBackground;


