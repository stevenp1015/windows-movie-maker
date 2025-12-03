import React, { useRef, useEffect } from 'react';
import { type SceneNode } from '../../types';
import SceneCard from './SceneCard';

interface TimelineViewProps {
  scenes: SceneNode[];
  onRegenerateScene: (id: string, customPrompt?: string) => void;
  onForceApproveScene?: (id: string) => void;
  onInjectSceneFeedback?: (id: string, feedback: string) => void;
  onViewSceneImage?: (base64: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  scenes,
  onRegenerateScene,
  onForceApproveScene,
  onInjectSceneFeedback,
  onViewSceneImage
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Horizontal scroll with wheel - Steven's special no-vertical-bullshit edition
  // Now with document-level interception to tell Chrome's navigation gesture to fuck right off
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const THRESHOLD = 0.5;

    // Document-level listener to intercept BEFORE Chrome's gesture detection
    // This is the nuclear option that catches wheel events at the highest level
    const documentWheelHandler = (e: WheelEvent) => {
      // Check if the wheel event is happening over our timeline container
      const target = e.target as Node;
      if (el.contains(target)) {
        // Got you, Chrome. This wheel event is OURS now.
        // We're preventing default at the document level so Chrome's navigation
        // gesture detector never even sees this event.
        const horizontalDelta = e.deltaX;
        if (Math.abs(horizontalDelta) > THRESHOLD) {
          e.preventDefault();
          el.scrollLeft += horizontalDelta;
        }
      }
    };

    // Container-level listener as backup (shouldn't be needed but belt-and-suspenders)
    const containerWheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const horizontalDelta = e.deltaX;
      if (Math.abs(horizontalDelta) > THRESHOLD) {
        el.scrollLeft += horizontalDelta;
      }
    };

    // CRITICAL: passive: false on BOTH listeners so preventDefault actually works
    // The document-level one is what really matters for killing Chrome's gestures
    document.addEventListener('wheel', documentWheelHandler, { passive: false });
    el.addEventListener('wheel', containerWheelHandler, { passive: false });

    return () => {
      document.removeEventListener('wheel', documentWheelHandler);
      el.removeEventListener('wheel', containerWheelHandler);
    };
  }, []);

  return (
    <div className="h-full flex flex-col relative">
      {/* Toolbar / Stats */}
      <div className="h-12 border-b border-white/50 bg-white/30 backdrop-blur-sm flex items-center px-6 gap-6 text-xs font-mono text-[var(--text-secondary)] z-10">
        <span>TOTAL SCENES: {scenes.length}</span>
        <span>GENERATED: {scenes.filter(s => s.overallStatus === 'complete').length}</span>
        <span>PENDING: {scenes.filter(s => s.overallStatus === 'pending').length}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-success)]"></span>
          <span>SYSTEM READY</span>
        </div>
      </div>

      {/* Scrollable Timeline */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden flex items-center px-10 gap-8 relative"
        style={{
          overscrollBehaviorX: 'contain',
          overscrollBehaviorY: 'none'
        }}
      >
        {/* TODO - Connection Layer (SVG) - Placeholder for Bezier Curves */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20">
          {/* Logic to draw curves would go here based on scene positions */}
        </svg>

        {scenes.length === 0 ? (
          <div className="m-auto text-center text-[var(--text-muted)]">
            <p className="text-lg font-medium">Timeline Empty</p>
            <p className="text-sm">Go to the Director's Sanctum to plan your narrative.</p>
          </div>
        ) : (
          scenes.map((scene) => (
            <div key={scene.id} className="relative z-10">
              <SceneCard
                scene={scene}
                onRegenerate={onRegenerateScene}
                onForceApprove={onForceApproveScene}
                onInjectFeedback={onInjectSceneFeedback}
                onViewImage={onViewSceneImage}
              />

              {/* Connector Line */}
              {scene.index < scenes.length - 1 && (
                <div className="absolute top-1/2 -right-8 w-8 h-[1px] bg-black/10" />
              )}
            </div>
          ))
        )}

        {/* Padding at the end */}
        <div className="w-20 flex-shrink-0" />
      </div>
    </div>
  );
};

export default TimelineView;
