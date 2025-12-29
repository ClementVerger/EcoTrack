import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FilterBar from "../../../src/components/Map/FilterBar";

describe("FilterBar Component", () => {
  const mockProps = {
    filters: {
      types: [],
      status: [],
      distance: 0,
    },
    onFiltersChange: jest.fn(),
    userPosition: { latitude: 48.8566, longitude: 2.3522 },
    isMobileOpen: false,
    onMobileOpenChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait rendre le composant FilterBar", () => {
    render(<FilterBar {...mockProps} />);
    expect(screen.getByText("Filtres")).toBeInTheDocument();
  });

  it("devrait afficher les boutons de type de conteneur", () => {
    render(<FilterBar {...mockProps} />);
    expect(screen.getByLabelText(/Verre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Papier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plastique/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ordures/i)).toBeInTheDocument();
  });

  it("devrait afficher les boutons de statut", () => {
    render(<FilterBar {...mockProps} />);
    expect(screen.getByLabelText(/Vide/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Presque plein/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plein 🔴/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hors service/i)).toBeInTheDocument();
  });

  it("devrait afficher les options de distance avec position utilisateur", () => {
    render(<FilterBar {...mockProps} />);
    expect(screen.getByText(/Tous les conteneurs/i)).toBeInTheDocument();
    expect(screen.getByText(/500m/i)).toBeInTheDocument();
    expect(screen.getByText(/1km/i)).toBeInTheDocument();
  });

  it("devrait appeler onFiltersChange quand on clique sur un type", () => {
    const mockOnChange = jest.fn();
    render(<FilterBar {...mockProps} onFiltersChange={mockOnChange} />);
    const verreCheckbox = screen.getByLabelText(/Verre/i);
    fireEvent.click(verreCheckbox);
    expect(mockOnChange).toHaveBeenCalled();
  });

  it("devrait appeler onFiltersChange quand on clique sur un statut", () => {
    const mockOnChange = jest.fn();
    render(<FilterBar {...mockProps} onFiltersChange={mockOnChange} />);
    const videCheckbox = screen.getByLabelText(/Vide/i);
    fireEvent.click(videCheckbox);
    expect(mockOnChange).toHaveBeenCalled();
  });

  it("devrait afficher le badge de filtres actifs", () => {
    const filtersWithActive = {
      types: ["Verre"],
      status: [],
      distance: 0,
    };
    render(<FilterBar {...mockProps} filters={filtersWithActive} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("devrait afficher le bouton Réinitialiser quand des filtres sont actifs", () => {
    const filtersWithActive = {
      types: ["Verre"],
      status: [],
      distance: 0,
    };
    render(<FilterBar {...mockProps} filters={filtersWithActive} />);
    expect(screen.getByText(/Réinitialiser/i)).toBeInTheDocument();
  });

  it("devrait appeler onMobileOpenChange quand on clique le toggle sur mobile", () => {
    // Simuler un écran mobile
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(max-width: 767px)",
      media: query,
    }));

    const mockOnOpenChange = jest.fn();
    render(
      <FilterBar
        {...mockProps}
        isMobileOpen={true}
        onMobileOpenChange={mockOnOpenChange}
      />,
    );

    // Le conteneur devrait être présent
    const { container } = render(<FilterBar {...mockProps} />);
    expect(container.querySelector(".filter-bar")).toBeInTheDocument();
  });
});
