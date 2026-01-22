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
  tickets_sold: number;
  people_inside: number;
};

export const OccupancyChart = ({ data }: { data: OccupancyDataPoint[] }) => {
  // Format timestamps nicely
  const formatted = data.reduce(
    (acc, { minute, entries, exits, ...rest }, i) => {
      const previousMinute = acc.at(i - 1);
      return [
        ...acc,
        {
          ...rest,
          minute,
          entries,
          time: new Date(minute).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          exits: Math.abs(exits),
          tickets_sold: previousMinute
            ? previousMinute.tickets_sold + entries
            : entries,
        },
      ];
    },
    [] as OccupancyDataPoint[],
  );

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
            strokeWidth={4}
            stroke="white"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="tickets_sold"
            strokeWidth={2}
            stroke="green"
            dot={false}
          />
          <Bar
            dataKey="entries"
            name="In"
            stackId="a"
            fill="#00b20c"
            barSize={16}
          />
          <Bar
            dataKey="exits"
            name="Ut"
            stackId="a"
            fill="#a61a1a"
            barSize={16}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
