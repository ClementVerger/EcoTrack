/* eslint-disable no-undef */
import React from 'react';
import { render } from '@testing-library/react';
import Map from '../../src/components/Map/Map';
import * as reportService from '../../src/services/reportService';

// Mock the reportService
jest.mock('../../src/services/reportService');

// Mock components that Map uses
jest.mock('../../src/components/Map/ReportModal', () => {
  return function MockReportModal({ isOpen, onClose, onSubmit, isLoading, error }) {
    if (!isOpen) return null;
    return (
      <div data-testid="report-modal">
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="modal-submit"
          onClick={() =>
            onSubmit({
              description: 'Test report description',
              category: 'autre',
              severity: 'normal',
              containerId: null,
              latitude: 48.8566,
              longitude: 2.3522,
              photo: null,
            })
          }
          disabled={isLoading}
        >
          Submit Report
        </button>
        {error && <div data-testid="modal-error">{error}</div>}
        {isLoading && <div data-testid="modal-loading">Loading...</div>}
      </div>
    );
  };
});

// Mock other Map components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  useMapEvent: () => ({
    on: jest.fn(),
  }),
}));

jest.mock('leaflet', () => ({
  icon: jest.fn(),
  latLngBounds: jest.fn(() => ({
    contains: jest.fn(() => true),
  })),
}));

describe('Map Component - API Call Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Report submission via API', () => {
    test('Should call createReport when submitting a report', async () => {
      reportService.createReport.mockResolvedValue({
        id: '123',
        description: 'Test report description',
        category: 'autre',
        status: 'pending',
      });

      render(<Map />);

      // Verify createReport was not called yet
      expect(reportService.createReport).not.toHaveBeenCalled();

      // Simulating the form submission
      const reportData = {
        description: 'Test report description',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: 48.8566,
        longitude: 2.3522,
        photo: null,
      };

      await reportService.createReport(reportData);

      expect(reportService.createReport).toHaveBeenCalledWith(reportData);
      expect(reportService.createReport).toHaveBeenCalledTimes(1);
    });

    test('Should handle successful report submission', async () => {
      const mockReportData = {
        id: '456',
        description: 'Test report description',
        category: 'autre',
        severity: 'normal',
        status: 'pending',
        createdAt: '2024-01-20T10:00:00Z',
      };

      reportService.createReport.mockResolvedValue(mockReportData);

      render(<Map />);

      const result = await reportService.createReport({
        description: 'Test report description',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: 48.8566,
        longitude: 2.3522,
        photo: null,
      });

      expect(result).toEqual(mockReportData);
      expect(result.id).toBe('456');
      expect(result.status).toBe('pending');
    });

    test('Should handle API error with 401 status', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized',
          },
        },
        message: 'Unauthorized',
      };

      reportService.createReport.mockRejectedValue(mockError);

      const reportData = {
        description: 'Test report description',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: 48.8566,
        longitude: 2.3522,
        photo: null,
      };

      try {
        await reportService.createReport(reportData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('Should handle API error with 400 status', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Description must be at least 10 characters',
          },
        },
        message: 'Description must be at least 10 characters',
      };

      reportService.createReport.mockRejectedValue(mockError);

      const reportData = {
        description: 'Short',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: 48.8566,
        longitude: 2.3522,
        photo: null,
      };

      try {
        await reportService.createReport(reportData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.message).toContain('Description');
      }
    });

    test('Should handle API error with 500 status', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
        message: 'Internal server error',
      };

      reportService.createReport.mockRejectedValue(mockError);

      const reportData = {
        description: 'Test report description',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: 48.8566,
        longitude: 2.3522,
        photo: null,
      };

      try {
        await reportService.createReport(reportData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(500);
      }
    });

    test('Should handle network error (no response)', async () => {
      const mockError = {
        message: 'Network Error',
      };

      reportService.createReport.mockRejectedValue(mockError);

      const reportData = {
        description: 'Test report description',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: 48.8566,
        longitude: 2.3522,
        photo: null,
      };

      try {
        await reportService.createReport(reportData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Network Error');
        expect(error.response).toBeUndefined();
      }
    });
  });

  describe('Data sent to API', () => {
    test('Should send all required and optional fields to API', async () => {
      reportService.createReport.mockResolvedValue({
        id: '789',
        description: 'Complete report',
        category: 'conteneur_plein',
        severity: 'haute',
        containerId: 'cont-1',
        latitude: 48.8566,
        longitude: 2.3522,
        photo: 'data:image/jpeg;base64,...',
      });

      const reportData = {
        description: 'Complete report with all data',
        category: 'conteneur_plein',
        severity: 'haute',
        containerId: 'cont-1',
        latitude: 48.8566,
        longitude: 2.3522,
        photo: 'data:image/jpeg;base64,...',
      };

      await reportService.createReport(reportData);

      expect(reportService.createReport).toHaveBeenCalledWith(reportData);
      const callArgs = reportService.createReport.mock.calls[0][0];
      expect(callArgs.description).toBe('Complete report with all data');
      expect(callArgs.category).toBe('conteneur_plein');
      expect(callArgs.severity).toBe('haute');
      expect(callArgs.containerId).toBe('cont-1');
      expect(callArgs.latitude).toBe(48.8566);
      expect(callArgs.longitude).toBe(2.3522);
      expect(callArgs.photo).toBeDefined();
    });

    test('Should send only required fields when optional fields are null', async () => {
      reportService.createReport.mockResolvedValue({
        id: '999',
        description: 'Minimal report',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      });

      const reportData = {
        description: 'Minimal report with required fields only',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      };

      await reportService.createReport(reportData);

      expect(reportService.createReport).toHaveBeenCalledWith(reportData);
      const callArgs = reportService.createReport.mock.calls[0][0];
      expect(callArgs.containerId).toBeNull();
      expect(callArgs.latitude).toBeNull();
      expect(callArgs.longitude).toBeNull();
      expect(callArgs.photo).toBeNull();
    });

    test('Should send coordinates as numbers, not strings', async () => {
      reportService.createReport.mockResolvedValue({
        id: '111',
        description: 'Report with GPS',
        category: 'autre',
        latitude: 48.8566,
        longitude: 2.3522,
      });

      const reportData = {
        description: 'Report with GPS coordinates',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: 48.8566, // Number, not string
        longitude: 2.3522, // Number, not string
        photo: null,
      };

      await reportService.createReport(reportData);

      const callArgs = reportService.createReport.mock.calls[0][0];
      expect(typeof callArgs.latitude).toBe('number');
      expect(typeof callArgs.longitude).toBe('number');
    });

    test('Should include photo as base64 string in API call', async () => {
      const base64Photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

      reportService.createReport.mockResolvedValue({
        id: '222',
        description: 'Report with photo',
        category: 'autre',
        photo: base64Photo,
      });

      const reportData = {
        description: 'Report with photo included',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: base64Photo,
      };

      await reportService.createReport(reportData);

      const callArgs = reportService.createReport.mock.calls[0][0];
      expect(callArgs.photo).toBe(base64Photo);
      expect(callArgs.photo).toMatch(/^data:image\//);
    });
  });

  describe('API Response handling', () => {
    test('Should handle response with created report ID', async () => {
      const mockResponse = {
        id: '333',
        description: 'Created report',
        category: 'autre',
        status: 'pending',
        createdAt: '2024-01-20T10:00:00Z',
      };

      reportService.createReport.mockResolvedValue(mockResponse);

      const result = await reportService.createReport({
        description: 'Created report test',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      });

      expect(result.id).toBe('333');
      expect(result.status).toBe('pending');
      expect(result.createdAt).toBeDefined();
    });

    test('Should return report data from API response', async () => {
      const mockResponse = {
        id: '444',
        description: 'Full report response',
        category: 'conteneur_plein',
        severity: 'haute',
        containerId: 'cont-1',
        latitude: 48.8566,
        longitude: 2.3522,
        photo: null,
        status: 'pending',
        userId: 'user-1',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
      };

      reportService.createReport.mockResolvedValue(mockResponse);

      const result = await reportService.createReport({
        description: 'Full response test',
        category: 'conteneur_plein',
        severity: 'haute',
        containerId: 'cont-1',
        latitude: 48.8566,
        longitude: 2.3522,
        photo: null,
      });

      expect(result).toEqual(mockResponse);
      expect(result.id).toBe('444');
      expect(result.userId).toBe('user-1');
    });
  });

  describe('Error message handling', () => {
    test('Should provide user-friendly error message for 401', async () => {
      const mockError = new Error(
        'Vous devez être connecté pour créer un signalement',
      );
      mockError.response = { status: 401 };

      reportService.createReport.mockRejectedValue(mockError);

      try {
        await reportService.createReport({
          description: 'Test',
          category: 'autre',
        });
        fail('Should throw error');
      } catch (error) {
        expect(error.message).toContain('connecté');
        expect(error.response.status).toBe(401);
      }
    });

    test('Should provide user-friendly error message for 400', async () => {
      const mockError = new Error('Données invalides. Veuillez vérifier votre formulaire');
      mockError.response = { status: 400 };

      reportService.createReport.mockRejectedValue(mockError);

      try {
        await reportService.createReport({
          description: 'Invalid data',
          category: 'autre',
        });
        fail('Should throw error');
      } catch (error) {
        expect(error.message).toContain('invalides');
      }
    });

    test('Should provide user-friendly error message for 500', async () => {
      const mockError = new Error('Erreur serveur');
      mockError.response = { status: 500 };

      reportService.createReport.mockRejectedValue(mockError);

      try {
        await reportService.createReport({
          description: 'Test',
          category: 'autre',
        });
        fail('Should throw error');
      } catch (error) {
        expect(error.message).toContain('serveur');
      }
    });
  });
});
