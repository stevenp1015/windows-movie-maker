import { useEffect, useRef } from "react";
import bgImage from "./assets/bg-img.jpg";

const BackgroundEffect = () => {
    const bgRef = useRef<HTMLDivElement>(null);
    // We use a ref to track the global "virtual" scroll position
    const globalScrollY = useRef(0);
    const globalScrollX = useRef(0);

    // We need to track the last scroll position of every element that scrolls
    // to calculate the delta. WeakMap is perfect because it doesn't hold references.
    const lastScrollPositions = useRef(new WeakMap<EventTarget, { x: number, y: number }>());

    useEffect(() => {
        const handleScroll = (e: Event) => {
            if (!bgRef.current) return;

            const target = e.target as HTMLElement | Document;
            // Handle the case where target is Document (use scrollingElement)
            const element = target instanceof Document ? target.scrollingElement : target;

            if (!element) return;

            const currentY = element.scrollTop;
            const currentX = element.scrollLeft;

            // Get last position or default to current (0 delta for first event)
            const lastPos = lastScrollPositions.current.get(target) || { x: currentX, y: currentY };

            // Calculate delta
            const deltaY = currentY - lastPos.y;
            const deltaX = currentX - lastPos.x;

            // Update last position
            lastScrollPositions.current.set(target, { x: currentX, y: currentY });

            // Accumulate global offset
            // We can adjust the multiplier here for sensitivity
            globalScrollY.current += deltaY * 0.5;
            globalScrollX.current += deltaX * 0.5;

            // Apply transform
            // We use the accumulated global offset
            const yOffset = globalScrollY.current * 0.1;
            const xOffset = globalScrollX.current * 0.05;

            bgRef.current.style.transform = `translate3d(${-xOffset}px, ${-yOffset}px, 0) scale(1.1)`;
        };

        // CAPTURE phase is essential here. 
        // 'scroll' events do not bubble, but they DO capture.
        // This allows us to catch scroll events from ANY element in the DOM.
        window.addEventListener("scroll", handleScroll, { capture: true });

        return () => {
            window.removeEventListener("scroll", handleScroll, { capture: true });
        };
    }, []);

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div
                ref={bgRef}
                className="absolute -top-[20%] -left-[10%] w-[120%] h-[140%] bg-cover bg-center opacity-100 transition-transform duration-75 ease-out will-change-transform"
                style={{
                    backgroundImage: `url(${bgImage})`,
                }}
            />

            {/* Overlay gradient to blend with the app's theme 
      <div className="absolute inset-0 bg-gradient-to-br from-[#4f4940]/90 via-[#3f3930]/85 to-[#5c6f7d]/90 mix-blend-overlay" />
      <div className="absolute inset-0 bg-black/20" />*/}
        </div>
    );
};

export default BackgroundEffect;

