'use client';

import { useState } from 'react';
import { inputClassName, SettingField } from './SettingField';

export const DateInput = ({
  basePath,
  initialDate,
}: {
  basePath: string;
  initialDate: string;
}) => {
  const [date, setDate] = useState(initialDate);

  return (
    <SettingField
      id="event-date"
      label="Date"
      url={`${basePath}/api/event/date`}
      field="date"
      value={date}
      isChanged={date !== initialDate}
      validate={() => (date ? null : 'Please pick a date')}>
      {({ id, disabled }) => (
        <input
          id={id}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={disabled}
          className={`${inputClassName} flex-1 min-w-0`}
        />
      )}
    </SettingField>
  );
};
