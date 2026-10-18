'use client';

import { useState } from 'react';
import { inputClassName, SettingField } from './SettingField';
import { MAX_MAX_COUNT } from '@/lib/event-limits';

export const MaxCountInput = ({
  basePath,
  initialMaxCount,
}: {
  basePath: string;
  initialMaxCount: number;
}) => {
  const [maxCount, setMaxCount] = useState<string>(String(initialMaxCount));
  // Number, not parseInt, so "1.5" isn't quietly saved as 1
  const parsed = Number(maxCount);

  return (
    <SettingField
      id="max-count"
      label="Max visitors"
      url={`${basePath}/api/counter/max-count`}
      field="maxCount"
      value={parsed}
      isChanged={parsed !== initialMaxCount}
      validate={() =>
        maxCount.trim() &&
        Number.isInteger(parsed) &&
        parsed >= 1 &&
        parsed <= MAX_MAX_COUNT
          ? null
          : `Please enter a whole number from 1 to ${MAX_MAX_COUNT}`
      }>
      {({ id, disabled }) => (
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min="1"
          // Let validate() explain decimals, instead of the browser's tooltip
          step="any"
          value={maxCount}
          onChange={(e) => setMaxCount(e.target.value)}
          disabled={disabled}
          className={`${inputClassName} flex-1 min-w-0`}
        />
      )}
    </SettingField>
  );
};
