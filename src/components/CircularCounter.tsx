'use client';

interface CircularCounterProps {
  count: number | null;
  maxCount?: number | null;
}

const color = {
  progressBg: 'rgb(0 60 0)',
  progress: 'rgb(0 220 0)',
  progressGlow: 'rgb(0 255 0 / 0.6)',
};

export const CircularCounter = ({ count, maxCount }: CircularCounterProps) => {
  if (count === null) {
    return null;
  }

  if (!maxCount) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 relative w-full aspect-square">
        <div className="flex items-center rounded-full bg-emerald-950 aspect-square">
          <CircleNumber display={count} />
        </div>
      </div>
    );
  }

  const radius = 140 - 20;
  const progress = count / maxCount;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;
  const maximumReached = count >= maxCount;

  return (
    <div className="flex flex-col items-center justify-center gap-6 relative w-full aspect-square">
      <svg
        viewBox="0 0 280 280"
        className="w-full h-full drop-shadow-lg absolute top-0"
        preserveAspectRatio="xMidYMid meet">
        {/* Background fill */}
        <circle
          cx="140"
          cy="140"
          r={radius}
          fill={maximumReached ? '#630000' : '#006338'}
          stroke="none"
        />
        {/* Background circle */}
        <circle
          cx="140"
          cy="140"
          r={radius}
          fill="none"
          stroke={maximumReached ? '#500' : color.progressBg}
          strokeWidth="28"
        />

        {/* Progress circle */}
        <circle
          cx="140"
          cy="140"
          r={radius}
          fill="none"
          stroke={maximumReached ? '#f00' : color.progress}
          strokeWidth="22"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 140 140)"
          filter={`drop-shadow(0 0 4px ${
            maximumReached ? '#f55' : color.progressGlow
          })`}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      <CircleNumber display={count} maxCount={maxCount} />
    </div>
  );
};

const CircleNumber = ({
  display,
  maxCount,
}: {
  display: number;
  maxCount?: number;
}) => {
  return (
    <div className="text-center z-1 p-16">
      <p
        className="text-8xl font-bold font-mono"
        style={
          maxCount ? { width: `${maxCount.toString().length}ch` } : undefined
        }>
        {display}
      </p>
      {maxCount ? (
        <p className="text-gray-400">
          Max: <span className="font-semibold">{maxCount}</span>
        </p>
      ) : null}
    </div>
  );
};
