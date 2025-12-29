import { calculateDistance, filterContainers } from "../../src/utils/distance";

describe("distance.js - Utilitaires GPS", () => {
  describe("calculateDistance", () => {
    it("devrait calculer la distance entre deux points identiques", () => {
      const distance = calculateDistance(48.8566, 2.3522, 48.8566, 2.3522);
      expect(distance).toBe(0);
    });

    it("devrait calculer la distance entre Paris et Londres (environ 340km)", () => {
      // Paris: 48.8566°N, 2.3522°E
      // Londres: 51.5074°N, -0.1278°W
      const distance = calculateDistance(48.8566, 2.3522, 51.5074, -0.1278);

      // Distance réelle: ~340km
      expect(distance).toBeGreaterThan(330000);
      expect(distance).toBeLessThan(350000);
    });

    it("devrait calculer une distance positive", () => {
      const distance = calculateDistance(45.5017, -122.675, 37.7749, -122.4194);
      expect(distance).toBeGreaterThan(0);
    });

    it("devrait être symétrique", () => {
      const distance1 = calculateDistance(48.8566, 2.3522, 51.5074, -0.1278);
      const distance2 = calculateDistance(51.5074, -0.1278, 48.8566, 2.3522);
      expect(distance1).toBeCloseTo(distance2, 2);
    });

    it("devrait gérer les coordonnées négatives", () => {
      const distance = calculateDistance(
        -33.8688,
        151.2093,
        -37.8136,
        144.9631,
      );
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe("filterContainers", () => {
    const mockContainers = [
      {
        id: "1",
        type: "Verre",
        status: "vide",
        latitude: 48.8566,
        longitude: 2.3522,
      },
      {
        id: "2",
        type: "Papier",
        status: "presque_plein",
        latitude: 48.8567,
        longitude: 2.3523,
      },
      {
        id: "3",
        type: "Plastique",
        status: "plein",
        latitude: 48.857,
        longitude: 2.353,
      },
      {
        id: "4",
        type: "Verre",
        status: "plein",
        latitude: 48.858,
        longitude: 2.354,
      },
    ];

    it("devrait retourner tous les conteneurs sans filtre", () => {
      const filters = { types: [], status: [], distance: 0 };
      const result = filterContainers(mockContainers, filters, null);
      expect(result).toHaveLength(4);
    });

    it("devrait filtrer par type", () => {
      const filters = { types: ["Verre"], status: [], distance: 0 };
      const result = filterContainers(mockContainers, filters, null);
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.type === "Verre")).toBe(true);
    });

    it("devrait filtrer par plusieurs types", () => {
      const filters = { types: ["Verre", "Papier"], status: [], distance: 0 };
      const result = filterContainers(mockContainers, filters, null);
      expect(result).toHaveLength(3);
    });

    it("devrait filtrer par statut", () => {
      const filters = { types: [], status: ["plein"], distance: 0 };
      const result = filterContainers(mockContainers, filters, null);
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.status === "plein")).toBe(true);
    });

    it("devrait filtrer par distance", () => {
      const userPosition = { latitude: 48.8566, longitude: 2.3522 };
      const filters = { types: [], status: [], distance: 1000 }; // 1km
      const result = filterContainers(mockContainers, filters, userPosition);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(4);
    });

    it("devrait appliquer les filtres en AND (tous les critères)", () => {
      const filters = {
        types: ["Verre"],
        status: ["plein"],
        distance: 0,
      };
      const result = filterContainers(mockContainers, filters, null);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("4");
    });

    it("devrait ignorer le filtre distance sans position utilisateur", () => {
      const filters = { types: [], status: [], distance: 1000 };
      const result = filterContainers(mockContainers, filters, null);
      expect(result).toHaveLength(4);
    });

    it("devrait retourner un tableau vide si aucun conteneur ne correspond", () => {
      const filters = { types: ["Ordures"], status: [], distance: 0 };
      const result = filterContainers(mockContainers, filters, null);
      expect(result).toHaveLength(0);
    });
  });
});
