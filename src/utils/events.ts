export const DEFAULT_EVENT_ID = 'devfest-bacolod-2026';

export const getActiveEventId = (): string => {
  return localStorage.getItem('active_event_id') || DEFAULT_EVENT_ID;
};

export const setActiveEventId = (eventId: string): void => {
  localStorage.setItem('active_event_id', eventId);
  window.dispatchEvent(new Event('event_changed'));
};
