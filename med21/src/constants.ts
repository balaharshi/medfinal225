export const TIME_SLOTS = [
  { label: '12:00 AM - 02:00 AM', startHour: 0, startMin: 0 },
  { label: '02:00 AM - 04:00 AM', startHour: 2, startMin: 0 },
  { label: '04:00 AM - 06:00 AM', startHour: 4, startMin: 0 },
  { label: '06:00 AM - 08:00 AM', startHour: 6, startMin: 0 },
  { label: '08:00 AM - 10:00 AM', startHour: 8, startMin: 0 },
  { label: '10:00 AM - 12:00 PM', startHour: 10, startMin: 0 },
  { label: '12:00 PM - 02:00 PM', startHour: 12, startMin: 0 },
  { label: '02:00 PM - 04:00 PM', startHour: 14, startMin: 0 },
  { label: '04:00 PM - 06:00 PM', startHour: 16, startMin: 0 },
  { label: '06:00 PM - 08:00 PM', startHour: 18, startMin: 0 },
  { label: '08:00 PM - 10:00 PM', startHour: 20, startMin: 0 },
  { label: '10:00 PM - 12:00 AM', startHour: 22, startMin: 0 },
] as const;

export const TIME_SLOTS_3HR = [
  { label: '12:00 AM - 03:00 AM', startHour: 0, startMin: 0 },
  { label: '03:00 AM - 06:00 AM', startHour: 3, startMin: 0 },
  { label: '06:00 AM - 09:00 AM', startHour: 6, startMin: 0 },
  { label: '09:00 AM - 12:00 PM', startHour: 9, startMin: 0 },
  { label: '12:00 PM - 03:00 PM', startHour: 12, startMin: 0 },
  { label: '03:00 PM - 06:00 PM', startHour: 15, startMin: 0 },
  { label: '06:00 PM - 09:00 PM', startHour: 18, startMin: 0 },
  { label: '09:00 PM - 12:00 AM', startHour: 21, startMin: 0 },
] as const;
