import "@testing-library/jest-dom";

// Polyfill pour import.meta (requis par Vite)
if (typeof global.import === "undefined") {
  global.import = {
    meta: {
      env: {
        VITE_API_BASE_URL: "http://localhost:3000/api",
      },
    },
  };
}

// Fix pour TextEncoder qui est requis par react-router
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock de window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de navigator.geolocation
global.navigator.geolocation = {
  getCurrentPosition: jest.fn(),
};
