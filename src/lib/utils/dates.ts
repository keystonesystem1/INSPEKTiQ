import { format, formatDistanceToNowStrict, isToday, parseISO } from 'date-fns';

export function formatShortDate(value: string) {
  return format(parseISO(value), 'MMM d, yyyy');
}

export function formatMonthDay(value: string) {
  return format(parseISO(value), 'MMM d');
}

export function formatTimeLabel(value: string) {
  return format(parseISO(value), 'h:mm a');
}

export function formatRelativeFromNow(value: string) {
  return formatDistanceToNowStrict(parseISO(value), { addSuffix: true });
}

export function formatGreetingDate(value: string) {
  const date = parseISO(value);
  return `${isToday(date) ? 'Today' : format(date, 'EEEE')}, ${format(date, 'MMMM d, yyyy')}`;
}
