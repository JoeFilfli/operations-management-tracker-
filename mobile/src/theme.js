export const colors = {
  primary:    '#2d5cd4',
  primaryDark:'#2449aa',
  background: '#f9fafb',
  surface:    '#ffffff',
  border:     '#e5e7eb',
  text:       '#111827',
  textMuted:  '#6b7280',
  error:      '#dc2626',
  errorBg:    '#fef2f2',
  errorBorder:'#fecaca',
  success:    '#16a34a',

  statusEquipment: {
    available:   { bg: '#dcfce7', text: '#166534' },
    in_use:      { bg: '#dbeafe', text: '#1e40af' },
    maintenance: { bg: '#fef9c3', text: '#854d0e' },
    retired:     { bg: '#f3f4f6', text: '#6b7280' },
  },
  statusTicket: {
    open:        { bg: '#fee2e2', text: '#991b1b' },
    in_progress: { bg: '#fef9c3', text: '#854d0e' },
    resolved:    { bg: '#dcfce7', text: '#166534' },
    closed:      { bg: '#f3f4f6', text: '#6b7280' },
  },
  priority: {
    low:      { bg: '#f3f4f6', text: '#6b7280' },
    medium:   { bg: '#dbeafe', text: '#1e40af' },
    high:     { bg: '#ffedd5', text: '#9a3412' },
    critical: { bg: '#fee2e2', text: '#991b1b' },
  },
}

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
}

export const radius = {
  sm: 6, md: 10, lg: 16,
}

export const font = {
  sm: 13, md: 15, lg: 17, xl: 20, xxl: 26,
}
