export const tintColorLight = '#00BF12';
export const tintColorDark = '#00BF12';

export default {
  light: {
    primary: '#00BF12', // Main brand green
    primaryMuted: '#34D147', // Lighter green for secondary elements
    secondary: '#2B2D42', // Dark blue for contrast
    accent: '#FF6B6B', // Coral accent for important actions
    background: '#F8FFF9', // Very light green tinted background
    card: '#FFFFFF',
    text: '#2B2D42', // Dark blue text for better readability
    textSecondary: '#6C757D', // Softer text for secondary information
    border: '#E9ECEF',
    shadow: 'rgba(0, 0, 0, 0.1)',
    tint: tintColorLight,
    tabIconDefault: '#ADB5BD',
    tabIconSelected: tintColorLight,
    navBarBackground: '#F8FFF9', // Match background color
    buttonBackground: '#00BF12',
    buttonText: '#FFFFFF',
    inputBackground: '#FFFFFF',
    statusBarStyle: 'dark',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
    info: '#17A2B8',
    cardHighlight: '#E8F5E9',
  },
  dark: {
    primary: '#00BF12', // Main brand green
    primaryMuted: '#34D147', // Lighter green for secondary elements
    secondary: '#DEE2E6', // Light gray for contrast in dark mode
    accent: '#FF6B6B', // Coral accent for important actions
    background: '#121212', // Dark background
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#ADB5BD',
    border: '#2C2C2C',
    shadow: 'rgba(0, 0, 0, 0.2)',
    tint: tintColorDark,
    tabIconDefault: '#6C757D',
    tabIconSelected: tintColorDark,
    navBarBackground: '#121212', // Match background color
    buttonBackground: '#00BF12',
    buttonText: '#FFFFFF',
    inputBackground: '#2C2C2C',
    statusBarStyle: 'light',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
    info: '#17A2B8',
    cardHighlight: '#1E3320',
  },
};