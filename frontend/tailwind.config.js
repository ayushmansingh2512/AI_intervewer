/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000',
      white: '#fff',
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      // Add other colors here, avoiding oklch
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
  features: {
    respectDefaultRingColor: false,
    disableColorOpacityUtilitiesByDefault: false,
    hoverOnlyWhenSupported: false,
    relativeContentPaths: false,
    modernNormalize: false,
    logicalProperties: false,
    spaceBetweenReverse: false,
    extendedSpacingScale: false,
    extendedFontSizeScale: false,
    defaultLineHeights: false,
    relativeLineHeights: false,
    utilityFirstOrder: false,
  },
}