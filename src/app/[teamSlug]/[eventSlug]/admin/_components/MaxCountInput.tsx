'use client';

import { useState } from 'react';
import { inputClassName, SettingField } from './SettingField';

export const MaxCountInput = ({
  basePath,
  initialMaxCount,
}: {
  basePath: string;
  initialMaxCount: number;
}) => {
  const [maxCount, setMaxCount] = useState<string>(String(initialMaxCount));
  const parsed = parseInt(maxCount, 10);

  return (
    <SettingField
      id="max-count"
      label="Max visitors"
      url={`${basePath}/api/counter/max-count`}
      field="maxCount"
      value={parsed}
      isChanged={parsed !== initialMaxCount}
      validate={() =>
        isNaN(parsed) || parsed < 1
          ? 'Please enter a number greater than 0'
          : null
      }>
      {({ id, disabled }) => (
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min="1"
          value={maxCount}
          onChange={(e) => setMaxCount(e.target.value)}
          disabled={disabled}
          className={`${inputClassName} flex-1 min-w-0`}
        />
      )}
    </SettingField>
  );
};
