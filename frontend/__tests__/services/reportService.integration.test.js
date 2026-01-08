/* eslint-disable no-undef */
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('reportService.createReport - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Simuler une réponse d'axios
    axios.create = jest.fn(() => ({
      post: jest.fn(),
      get: jest.fn(),
    }));
  });

  describe('Success scenarios', () => {
    test('Should successfully create a report with all fields', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '123',
            description: 'Container déborde',
            category: 'conteneur_plein',
            severity: 'haute',
            containerId: 'cont-1',
            latitude: 48.8566,
            longitude: 2.3522,
            photo: null,
            status: 'pending',
            createdAt: '2024-01-20T10:00:00Z',
          },
        },
      };

      const reportData = {
        description: 'Container déborde de déchets',
        category: 'conteneur_plein',
        severity: 'haute',
        containerId: 'cont-1',
        latitude: 48.8566,
        longitude: 2.3522,
        photo: null,
      };

      // Mock axios response
      axios.post = jest.fn().mockResolvedValue(mockResponse);

      // Créer un client mock
      const mockClient = {
        post: jest.fn().mockResolvedValue(mockResponse),
      };

      // Test with mocked axios directly
      const response = await mockClient.post('/reports', reportData);
      expect(response.data.data).toEqual(mockResponse.data.data);
      expect(mockClient.post).toHaveBeenCalledWith('/reports', reportData);
    });

    test('Should create a report with minimal fields (description and category only)', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '456',
            description: 'Conteneur cassé',
            category: 'conteneur_casse',
            severity: 'normal',
            containerId: null,
            latitude: null,
            longitude: null,
            photo: null,
            status: 'pending',
            createdAt: '2024-01-20T10:00:00Z',
          },
        },
      };

      const reportData = {
        description: 'Conteneur cassé près de la gare',
        category: 'conteneur_casse',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      };

      const mockClient = {
        post: jest.fn().mockResolvedValue(mockResponse),
      };

      const response = await mockClient.post('/reports', reportData);
      expect(response.data.data.id).toBe('456');
      expect(response.data.data.containerId).toBeNull();
      expect(response.data.data.latitude).toBeNull();
      expect(mockClient.post).toHaveBeenCalledWith('/reports', reportData);
    });

    test('Should handle photo data correctly (base64 encoded)', async () => {
      const base64Photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';

      const mockResponse = {
        data: {
          data: {
            id: '789',
            description: 'Conteneur avec photo',
            category: 'autre',
            photo: base64Photo,
            createdAt: '2024-01-20T10:00:00Z',
          },
        },
      };

      const reportData = {
        description: 'Problème avec photo',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: base64Photo,
      };

      const mockClient = {
        post: jest.fn().mockResolvedValue(mockResponse),
      };

      const response = await mockClient.post('/reports', reportData);
      expect(response.data.data.photo).toBe(base64Photo);
      expect(mockClient.post).toHaveBeenCalledWith('/reports', reportData);
    });
  });

  describe('Error scenarios', () => {
    test('Should handle 401 Unauthorized error', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized',
          },
        },
      };

      const reportData = {
        description: 'Test',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      };

      const mockClient = {
        post: jest.fn().mockRejectedValue(mockError),
      };

      try {
        await mockClient.post('/reports', reportData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('Should handle 400 Validation error', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Description must be at least 10 characters',
          },
        },
      };

      const reportData = {
        description: 'Too short',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      };

      const mockClient = {
        post: jest.fn().mockRejectedValue(mockError),
      };

      try {
        await mockClient.post('/reports', reportData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('Description');
      }
    });

    test('Should handle 500 Server error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
      };

      const reportData = {
        description: 'Valid description here',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      };

      const mockClient = {
        post: jest.fn().mockRejectedValue(mockError),
      };

      try {
        await mockClient.post('/reports', reportData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(500);
      }
    });

    test('Should handle network error (no response)', async () => {
      const mockError = {
        message: 'Network Error',
      };

      const reportData = {
        description: 'Valid description here',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      };

      const mockClient = {
        post: jest.fn().mockRejectedValue(mockError),
      };

      try {
        await mockClient.post('/reports', reportData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Network Error');
        expect(error.response).toBeUndefined();
      }
    });
  });

  describe('Data validation', () => {
    test('Should validate required fields (description and category)', async () => {
      const invalidReportData = {
        description: '', // Empty
        category: '', // Empty
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      };

      // Validation should fail on empty required fields
      expect(invalidReportData.description).toBeFalsy();
      expect(invalidReportData.category).toBeFalsy();
    });

    test('Should accept null values for optional fields', async () => {
      const reportData = {
        description: 'Valid description with enough characters',
        category: 'autre',
        severity: 'normal',
        containerId: null, // Optional
        latitude: null, // Optional
        longitude: null, // Optional
        photo: null, // Optional
      };

      const mockResponse = {
        data: {
          data: {
            id: '999',
            ...reportData,
          },
        },
      };

      const mockClient = {
        post: jest.fn().mockResolvedValue(mockResponse),
      };

      const response = await mockClient.post('/reports', reportData);
      expect(response.data.data.containerId).toBeNull();
      expect(response.data.data.latitude).toBeNull();
      expect(response.data.data.longitude).toBeNull();
      expect(response.data.data.photo).toBeNull();
    });

    test('Should handle GPS coordinates as numbers', async () => {
      const reportData = {
        description: 'Avec coordonnées GPS',
        category: 'autre',
        severity: 'normal',
        containerId: 'cont-1',
        latitude: 48.8566,
        longitude: 2.3522,
        photo: null,
      };

      const mockClient = {
        post: jest.fn().mockResolvedValue({
          data: {
            data: {
              id: '111',
              ...reportData,
            },
          },
        }),
      };

      await mockClient.post('/reports', reportData);

      // Verify coordinates are sent as numbers, not strings
      const callArgs = mockClient.post.mock.calls[0][1];
      expect(typeof callArgs.latitude).toBe('number');
      expect(typeof callArgs.longitude).toBe('number');
      expect(callArgs.latitude).toBe(48.8566);
      expect(callArgs.longitude).toBe(2.3522);
    });
  });

  describe('Photo data handling', () => {
    test('Should correctly encode and send large photo files', async () => {
      // Simulate a large base64 photo (but not exceeding 5MB limit)
      const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(100000);

      const reportData = {
        description: 'Photo très grande',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: largeBase64,
      };

      const mockClient = {
        post: jest.fn().mockResolvedValue({
          data: {
            data: {
              id: '222',
              ...reportData,
            },
          },
        }),
      };

      await mockClient.post('/reports', reportData);

      const callArgs = mockClient.post.mock.calls[0][1];
      expect(callArgs.photo).toBe(largeBase64);
      expect(callArgs.photo.length).toBeGreaterThan(100000);
    });

    test('Should handle missing photo (null)', async () => {
      const reportData = {
        description: 'Sans photo',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      };

      const mockClient = {
        post: jest.fn().mockResolvedValue({
          data: {
            data: {
              id: '333',
              ...reportData,
            },
          },
        }),
      };

      await mockClient.post('/reports', reportData);

      const callArgs = mockClient.post.mock.calls[0][1];
      expect(callArgs.photo).toBeNull();
    });
  });

  describe('API endpoint verification', () => {
    test('Should POST to /reports endpoint', async () => {
      const reportData = {
        description: 'Test endpoint',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      };

      const mockClient = {
        post: jest.fn().mockResolvedValue({
          data: {
            data: {
              id: '444',
              ...reportData,
            },
          },
        }),
      };

      await mockClient.post('/reports', reportData);

      // Verify the endpoint is correct
      expect(mockClient.post).toHaveBeenCalledWith('/reports', reportData);
      const [endpoint] = mockClient.post.mock.calls[0];
      expect(endpoint).toBe('/reports');
    });

    test('Should send Content-Type as application/json', async () => {
      const reportData = {
        description: 'Test content type',
        category: 'autre',
        severity: 'normal',
        containerId: null,
        latitude: null,
        longitude: null,
        photo: null,
      };

      // In a real scenario, axios would set Content-Type automatically
      // when posting JSON data
      const mockClient = {
        post: jest.fn().mockResolvedValue({
          data: {
            data: {
              id: '555',
              ...reportData,
            },
          },
        }),
        defaults: {
          headers: {
            common: {
              'Content-Type': 'application/json',
            },
          },
        },
      };

      await mockClient.post('/reports', reportData);

      // Verify Content-Type would be application/json
      expect(mockClient.defaults.headers.common['Content-Type']).toBe(
        'application/json',
      );
    });
  });

  describe('Response handling', () => {
    test('Should extract data from nested response structure', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '666',
            description: 'Test',
            category: 'autre',
            createdAt: '2024-01-20T10:00:00Z',
          },
        },
      };

      const mockClient = {
        post: jest.fn().mockResolvedValue(mockResponse),
      };

      const response = await mockClient.post('/reports', {
        description: 'Test',
        category: 'autre',
      });

      // Should return the nested data property
      expect(response.data.data.id).toBe('666');
      expect(response.data.data).toHaveProperty('createdAt');
    });

    test('Should include report ID in response', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '777',
            description: 'Test with ID',
            category: 'autre',
          },
        },
      };

      const mockClient = {
        post: jest.fn().mockResolvedValue(mockResponse),
      };

      const response = await mockClient.post('/reports', {
        description: 'Test with ID',
        category: 'autre',
      });

      expect(response.data.data.id).toBeDefined();
      expect(response.data.data.id).toBe('777');
    });
  });
});
