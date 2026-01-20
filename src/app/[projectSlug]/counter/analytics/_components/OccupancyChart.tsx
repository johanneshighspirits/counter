'use client';

import { CustomTooltip } from '@/components/CustomTooltip';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Bar,
} from 'recharts';

export type OccupancyDataPoint = {
  minute: string;
  entries: number;
  exits: number;
  people_inside: number;
};

export const OccupancyChart = ({ data }: { data: OccupancyDataPoint[] }) => {
  // Format timestamps nicely
  const formatted = data.map((d) => ({
    ...d,
    time: new Date(d.minute).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    exits: Math.abs(d.exits),
  }));

  return (
    <div className="w-full h-screen max-h-120 bg-green-950/50 rounded-xl shadow p-4">
      <ResponsiveContainer width="100%" height={480}>
        <LineChart data={formatted}>
          <XAxis
            dataKey="time"
            domain={['dataMin', 'dataMax']}
            tick={{ fill: '#bbb' }}
            axisLine={{ stroke: '#bbb' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#bbb' }}
            axisLine={{ stroke: '#bbb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="people_inside"
            strokeWidth={3}
            stroke="#fff"
            dot={false}
          />
          <Bar
            dataKey="entries"
            name="In"
            stackId="a"
            fill="#008a09"
            barSize={16}
          />
          <Bar
            dataKey="exits"
            name="Ut"
            stackId="a"
            fill="#d72121"
            barSize={16}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
