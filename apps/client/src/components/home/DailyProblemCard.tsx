import { motion } from 'framer-motion';

interface DailyProblem {
  platform: 'LEETCODE' | 'GFG';
  title: string;
  link: string;
  difficulty?: string;
  available: boolean;
}

interface DailyProblemCardProps {
  problem: DailyProblem;
  index: number;
}

export function DailyProblemCard({ problem, index }: DailyProblemCardProps) {
  const isLC = problem.platform === 'LEETCODE';
  const color = isLC ? '#ffa116' : '#5B4638';
  
  const getDifficultyColor = (diff?: string) => {
    if (!diff) return 'var(--text-muted)';
    const d = diff.toLowerCase();
    if (d === 'easy') return '#00b8a3';
    if (d === 'medium') return '#ffc01e';
    if (d === 'hard') return '#ff375f';
    return 'var(--text-muted)';
  };

  return (
    <motion.a
      href={problem.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="flex flex-col p-5 bg-bg-surface border border-border-default rounded-lg transition-all duration-200"
      style={{
        boxShadow: `0 4px 15px rgba(0, 0, 0, 0.1)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span 
          className="font-mono text-[10px] uppercase tracking-widest font-bold"
          style={{ color }}
        >
          {isLC ? 'LEETCODE DAILY' : 'GFG POTD'}
        </span>
        {problem.difficulty && (
          <span 
            className="text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider"
            style={{ 
              backgroundColor: `${getDifficultyColor(problem.difficulty)}20`,
              color: getDifficultyColor(problem.difficulty)
            }}
          >
            {problem.difficulty}
          </span>
        )}
      </div>
      
      <h3 className="font-syne font-bold text-lg mb-1">{problem.title}</h3>
      
      {!problem.available && (
        <span className="text-xs text-text-muted font-mono italic mt-1">
          Failed to fetch today's problem. Click to view on site.
        </span>
      )}
      
      <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: 'var(--accent)' }}>
        SOLVE NOW <span className="text-[10px]">→</span>
      </div>
    </motion.a>
  );
}
