import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Map from "../../../src/components/Map/Map";
import * as containerService from "../../../src/services/containerService";

jest.mock("../../../src/services/containerService");
jest.mock("../../../src/services/geocodingService");
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  ZoomControl: () => <div />,
  useMap: () => ({
    setView: jest.fn(),
  }),
}));

jest.mock("../../../src/hooks/useGeolocation", () => ({
  useGeolocation: () => ({
    position: { latitude: 48.8566, longitude: 2.3522 },
    error: null,
    loading: false,
  }),
}));

describe("Map Component - Tests d'intégration", () => {
  const mockContainers = [
    {
      id: "1",
      type: "Verre",
      status: "vide",
      latitude: 48.8566,
      longitude: 2.3522,
      fillLevel: 30,
    },
    {
      id: "2",
      type: "Papier",
      status: "plein",
      latitude: 48.857,
      longitude: 2.353,
      fillLevel: 95,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait afficher l'écran de chargement initialement", () => {
    containerService.getAllContainers.mockImplementation(
      () => new Promise(() => {}),
    );

    render(
      <BrowserRouter>
        <Map />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Chargement de la carte/i)).toBeInTheDocument();
  });

  it("devrait charger et afficher les conteneurs", async () => {
    containerService.getAllContainers.mockResolvedValue(mockContainers);

    render(
      <BrowserRouter>
        <Map />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(containerService.getAllContainers).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.queryByText(/Chargement de la carte/i),
      ).not.toBeInTheDocument();
    });
  });

  it("devrait afficher un message d'erreur en cas d'échec de chargement", async () => {
    containerService.getAllContainers.mockRejectedValue(
      new Error("Erreur lors du chargement des conteneurs"),
    );

    render(
      <BrowserRouter>
        <Map />
      </BrowserRouter>,
    );

    // Attendre que la fonction soit appelée
    await waitFor(() => {
      expect(containerService.getAllContainers).toHaveBeenCalled();
    });

    // Attendre que l'écran d'erreur s'affiche (utiliser une fonction pour matcher le texte avec l'emoji)
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Erreur de chargement/ }),
      ).toBeInTheDocument();
    });
  });

  it("devrait afficher le bouton réessayer après une erreur", async () => {
    containerService.getAllContainers.mockRejectedValue(new Error("Erreur"));

    render(
      <BrowserRouter>
        <Map />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Réessayer/)).toBeInTheDocument();
    });
  });

  it("devrait afficher la barre inférieure avec le compteur", async () => {
    containerService.getAllContainers.mockResolvedValue(mockContainers);

    render(
      <BrowserRouter>
        <Map />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Conteneurs:/i)).toBeInTheDocument();
    });
  });

  it("devrait afficher le bon nombre de conteneurs", async () => {
    containerService.getAllContainers.mockResolvedValue(mockContainers);

    render(
      <BrowserRouter>
        <Map />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("2/2")).toBeInTheDocument();
    });
  });

  it("devrait appliquer les filtres correctement", async () => {
    containerService.getAllContainers.mockResolvedValue(mockContainers);

    const { rerender } = render(
      <BrowserRouter>
        <Map />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(containerService.getAllContainers).toHaveBeenCalled();
    });
  });

  it("devrait afficher le bouton de signalement", async () => {
    containerService.getAllContainers.mockResolvedValue(mockContainers);

    render(
      <BrowserRouter>
        <Map />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(containerService.getAllContainers).toHaveBeenCalled();
    });

    // Le bouton de signalement doit être visible
    const reportButton = screen.getByTitle("Signaler un problème");
    expect(reportButton).toBeInTheDocument();
  });

  it("devrait ouvrir le modal de signalement au clic du bouton", async () => {
    containerService.getAllContainers.mockResolvedValue(mockContainers);

    const { container } = render(
      <BrowserRouter>
        <Map />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(containerService.getAllContainers).toHaveBeenCalled();
    });

    const reportButton = screen.getByTitle("Signaler un problème");
    reportButton.click();

    await waitFor(() => {
      const modal = container.querySelector(".report-modal-overlay");
      expect(modal).toBeInTheDocument();
    });
  });
});
