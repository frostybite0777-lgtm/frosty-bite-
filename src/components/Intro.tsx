import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Intro({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 1000);
    }, 8000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[100] bg-luxury-black flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Video Background - Clarified and Cropped to remove YouTube UI */}
          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full scale-[1.25]">
              <iframe
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[177.77vw] min-h-[100vh] min-w-[56.25vh] pointer-events-none opacity-100"
                src="https://www.youtube.com/embed/1nwJ6nT9jDw?autoplay=1&mute=1&controls=0&loop=1&playlist=1nwJ6nT9jDw&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1"
                allow="autoplay; encrypted-media"
                title="Intro Video"
              />
            </div>
            {/* Protective Masks */}
            <div className="absolute top-0 left-0 right-0 h-[15%] bg-luxury-black z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-luxury-black z-10" />
          </div>

          {/* Skip Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={() => {
              setShow(false);
              setTimeout(onComplete, 1000);
            }}
            className="absolute bottom-12 right-12 z-20 text-[10px] uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors border border-white/10 px-6 py-2 rounded-full backdrop-blur-md bg-black/20"
          >
            Skip Intro
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
