import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 5, className = "" }: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value > 0) {
      // Reset to 0 first
      count.set(0);
      
      // Animate to the target value
      const controls = animate(count, value, { 
        duration,
        ease: "easeOut"
      });
      
      // Update display value
      const unsubscribe = rounded.on("change", (latest) => {
        setDisplayValue(latest);
      });

      return () => {
        controls.stop();
        unsubscribe();
      };
    }
  }, [value, duration, count, rounded]);

  return (
    <motion.div className={className}>
      <span>{displayValue.toLocaleString()}</span>
    </motion.div>
  );
}
