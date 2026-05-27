'use client';

// ── Countdown Component ──────────────────────────

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Countdown({ targetDate }: { targetDate: string | Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const update = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference,
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.total <= 0) {
    return <span className="text-text-muted text-sm font-mono font-bold">STARTED</span>;
  }

  const isUrgent = timeLeft.total < 1000 * 60 * 60; // < 1 hour

  const Box = ({ val, label }: { val: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-bg-primary border border-border-default rounded px-2 py-1 text-sm font-mono font-bold w-10 text-center flex justify-center">
        {val.toString().padStart(2, '0')}
      </div>
      <span className="text-[9px] text-text-muted mt-1 uppercase tracking-widest">{label}</span>
    </div>
  );

  return (
    <motion.div
      className={`flex items-start gap-1.5 ${isUrgent ? 'text-red' : 'text-text-primary'}`}
      animate={isUrgent ? { opacity: [1, 0.7, 1] } : {}}
      transition={isUrgent ? { duration: 1, repeat: Infinity } : {}}
    >
      <Box val={timeLeft.days} label="d" />
      <span className="text-sm font-mono font-bold py-1">:</span>
      <Box val={timeLeft.hours} label="h" />
      <span className="text-sm font-mono font-bold py-1">:</span>
      <Box val={timeLeft.minutes} label="m" />
      <span className="text-sm font-mono font-bold py-1">:</span>
      <Box val={timeLeft.seconds} label="s" />
    </motion.div>
  );
}
