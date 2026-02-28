import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth out the follower's movement with a spring (viscous delay)
    const springConfig = { damping: 25, stiffness: 200, mass: 1.5 };
    const followerX = useSpring(mouseX, springConfig);
    const followerY = useSpring(mouseY, springConfig);

    // Immediate movement for the leader dot
    const leaderX = useSpring(mouseX, { damping: 40, stiffness: 600, mass: 0.5 });
    const leaderY = useSpring(mouseY, { damping: 40, stiffness: 600, mass: 0.5 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [mouseX, mouseY]);

    return (
        <>
            {/* The Follower - Frosted Glass Aura */}
            <motion.div
                className="pointer-events-none fixed top-0 left-0 z-[9998] w-24 h-24 rounded-full"
                style={{
                    x: followerX,
                    y: followerY,
                    translateX: '-50%',
                    translateY: '-50%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(8px) contrast(1.1) brightness(1.1)',
                    WebkitBackdropFilter: 'blur(8px) contrast(1.1) brightness(1.1)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
            />

            {/* The Leader - Glowing White Dot */}
            <motion.div
                className="pointer-events-none fixed top-0 left-0 z-[9999] w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                style={{
                    x: leaderX,
                    y: leaderY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            />
        </>
    );
}
