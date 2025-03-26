const tintColorLight = '#2E8B57'; // Sea Green (primary color)
const tintColorDark = '#3DA77A'; // Lighter Sea Green for dark mode

export default {
  light: {
    primary: '#2E8B57', // Sea Green
    primaryMuted: '#A7E8BD', // Light Green
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#1D2A32',
    textSecondary: '#626D77',
    border: '#C9D3DB',
    shadow: '#000000',
    tint: tintColorLight,
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    buttonBackground: '#2E8B57',
    buttonText: '#FFFFFF',
    inputBackground: '#FFFFFF',
    statusBarStyle: 'dark',
  },
  dark: {
    primary: '#3DA77A', // Lighter Sea Green for better visibility in dark mode
    primaryMuted: '#2E8B57', // Sea Green
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    border: '#2C2C2C',
    shadow: '#000000',
    tint: tintColorDark,
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    buttonBackground: '#3DA77A',
    buttonText: '#FFFFFF',
    inputBackground: '#2C2C2C',
    statusBarStyle: 'light',
  },
};