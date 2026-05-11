import { format, parse } from 'date-fns';

export function to12HourTime(time24: string): string {
  const parsed = parse(time24, 'HH:mm', new Date());

  if (Number.isNaN(parsed.getTime())) {
    return time24;
  }

  return format(parsed, 'h:mm a');
}
