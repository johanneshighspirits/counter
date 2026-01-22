import { OccupancyDataPoint } from '@/app/[projectSlug]/counter/analytics/_components/OccupancyChart';
import React from 'react';

type TooltipProps = {
  active?: boolean;
  payload?: { dataKey: string; value: number; payload: OccupancyDataPoint }[];
  label?: string;
};

export const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const entries = payload.find((p) => p.dataKey === 'entries')?.value ?? 0;
    const exits = payload.find((p) => p.dataKey === 'exits')?.value ?? 0;
    const people_inside =
      payload.find((p) => p.dataKey === 'people_inside')?.value ?? 0;
    const tickets_sold =
      payload.find((p) => p.dataKey === 'tickets_sold')?.value ?? 0;
    const minute = payload[0].payload.minute; // original timestamp

    return (
      <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg min-w-[140px]">
        <div className="font-semibold mb-1">
          {new Date(minute).toLocaleTimeString(['sv-SE'], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        <div>
          Sålda biljetter: <span className="font-bold">{tickets_sold}</span>
        </div>
        <div>
          Nuvarande antal: <span className="font-bold">{people_inside}</span>
        </div>
        {entries > 0 ? (
          <div className="text-green-400">In: {entries}</div>
        ) : null}
        {exits > 0 ? <div className="text-red-400">Ut: {exits}</div> : null}
      </div>
    );
  }

  return null;
};
