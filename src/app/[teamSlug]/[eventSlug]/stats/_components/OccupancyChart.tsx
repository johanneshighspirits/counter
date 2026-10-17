'use client';

import type { OccupancyByMinute } from '@/lib/firebase-server';
import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Validated against the chart surface (dark): adjacent CVD ΔE ≥ 19
const color = {
  surface: '#0f1a14',
  grid: 'rgb(255 255 255 / 0.08)',
  axis: 'rgb(255 255 255 / 0.2)',
  tick: '#9ca3af',
  inside: '#3987e5',
  tickets: '#d95926',
  entries: '#3987e5',
  exits: '#e66767',
};

type Bucket = {
  start: number;
  end: number;
  time: string;
  entries: number;
  exits: number;
  // Negative so exits are drawn below the baseline
  exitsBelow: number;
  people_inside: number;
  tickets_sold: number;
};

const MINUTE_MS = 60_000;
const BUCKET_MINUTES = [1, 2, 5, 10, 15, 30];
const MAX_BARS = 30;

const formatTime = (ms: number) =>
  new Date(ms).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });

// Group minutes into buckets so a phone-width chart never shows more than
// MAX_BARS bars. Counts are summed; people inside and tickets sold are the
// values at the end of each bucket.
const toBuckets = (data: OccupancyByMinute[]): Bucket[] => {
  const bucketMinutes =
    BUCKET_MINUTES.find((size) => data.length / size <= MAX_BARS) ??
    BUCKET_MINUTES[BUCKET_MINUTES.length - 1];
  const bucketMs = bucketMinutes * MINUTE_MS;
  const buckets = new Map<number, Bucket>();

  for (const point of data) {
    const minuteMs = new Date(point.minute).getTime();
    const start = Math.floor(minuteMs / bucketMs) * bucketMs;
    const bucket = buckets.get(start) ?? {
      start,
      end: start + bucketMs,
      time: formatTime(start),
      entries: 0,
      exits: 0,
      exitsBelow: 0,
      people_inside: 0,
      tickets_sold: 0,
    };

    bucket.entries += point.entries;
    bucket.exits += point.exits;
    bucket.exitsBelow = -bucket.exits;
    bucket.people_inside = point.people_inside;
    bucket.tickets_sold = point.tickets_sold;
    buckets.set(start, bucket);
  }

  return [...buckets.values()];
};

const axisProps = {
  tick: { fill: color.tick, fontSize: 12 },
  axisLine: { stroke: color.axis },
  tickLine: false,
} as const;

const xAxisProps = {
  ...axisProps,
  dataKey: 'time',
  minTickGap: 24,
  interval: 'preserveStartEnd',
} as const;

const yAxisProps = {
  ...axisProps,
  allowDecimals: false,
  width: 32,
} as const;

type TooltipRow = { label: string; value: number; color: string };

const TooltipBox = ({ title, rows }: { title: string; rows: TooltipRow[] }) => (
  <div className="bg-gray-900/95 border border-white/10 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
    <div className="text-gray-400 mb-1">{title}</div>
    {rows.map((row) => (
      <div key={row.label} className="flex items-center gap-2">
        <span
          className="inline-block size-2.5 rounded-full"
          style={{ backgroundColor: row.color }}
        />
        <span className="text-gray-300">{row.label}</span>
        <span className="ml-auto pl-4 font-mono font-bold">{row.value}</span>
      </div>
    ))}
  </div>
);

type ChartTooltipProps = {
  active?: boolean;
  payload?: { payload: Bucket }[];
};

const bucketTitle = (bucket: Bucket) =>
  bucket.end - bucket.start > MINUTE_MS
    ? `${formatTime(bucket.start)}–${formatTime(bucket.end)}`
    : formatTime(bucket.start);

const TotalsTooltip = ({ active, payload }: ChartTooltipProps) => {
  const bucket = payload?.[0]?.payload;
  if (!active || !bucket) return null;
  return (
    <TooltipBox
      title={formatTime(bucket.end - MINUTE_MS)}
      rows={[
        { label: 'Inne', value: bucket.people_inside, color: color.inside },
        {
          label: 'Sålda biljetter',
          value: bucket.tickets_sold,
          color: color.tickets,
        },
      ]}
    />
  );
};

const FlowTooltip = ({ active, payload }: ChartTooltipProps) => {
  const bucket = payload?.[0]?.payload;
  if (!active || !bucket) return null;
  return (
    <TooltipBox
      title={bucketTitle(bucket)}
      rows={[
        { label: 'In', value: bucket.entries, color: color.entries },
        { label: 'Ut', value: bucket.exits, color: color.exits },
      ]}
    />
  );
};

const Legend = ({ items }: { items: { label: string; color: string }[] }) => (
  <div className="flex gap-4 text-sm text-gray-300">
    {items.map((item) => (
      <span key={item.label} className="flex items-center gap-1.5">
        <span
          className="inline-block w-3 h-0.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        {item.label}
      </span>
    ))}
  </div>
);

const ChartCard = ({
  title,
  legend,
  children,
}: {
  title: string;
  legend: ReactNode;
  children: ReactNode;
}) => (
  <section
    className="w-full rounded-xl p-3 flex flex-col gap-2"
    style={{ backgroundColor: color.surface }}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="font-semibold">{title}</h2>
      {legend}
    </div>
    {children}
  </section>
);

export const OccupancyChart = ({ data }: { data: OccupancyByMinute[] }) => {
  if (data.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12">
        Ingen aktivitet de senaste 6 timmarna
      </p>
    );
  }

  const buckets = toBuckets(data);
  const bucketMinutes = (buckets[0].end - buckets[0].start) / MINUTE_MS;
  const hoverCursor = { fill: 'rgb(255 255 255 / 0.06)' };

  return (
    <div className="w-full flex flex-col gap-4">
      <ChartCard
        title="Över tid"
        legend={
          <Legend
            items={[
              { label: 'Inne', color: color.inside },
              { label: 'Sålda biljetter', color: color.tickets },
            ]}
          />
        }>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={buckets}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={color.grid} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip
              content={<TotalsTooltip />}
              cursor={{ stroke: color.axis }}
            />
            <Line
              type="stepAfter"
              dataKey="people_inside"
              stroke={color.inside}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: color.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="tickets_sold"
              stroke={color.tickets}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: color.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={
          bucketMinutes === 1
            ? 'In och ut per minut'
            : `In och ut per ${bucketMinutes} min`
        }
        legend={
          <Legend
            items={[
              { label: 'In', color: color.entries },
              { label: 'Ut', color: color.exits },
            ]}
          />
        }>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={buckets}
            stackOffset="sign"
            barCategoryGap={2}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={color.grid} />
            <XAxis {...xAxisProps} />
            <YAxis
              {...yAxisProps}
              tickFormatter={(value: number) => String(Math.abs(value))}
            />
            <ReferenceLine y={0} stroke={color.axis} />
            <Tooltip content={<FlowTooltip />} cursor={hoverCursor} />
            <Bar
              dataKey="entries"
              stackId="flow"
              fill={color.entries}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
            <Bar
              dataKey="exitsBelow"
              stackId="flow"
              fill={color.exits}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};
