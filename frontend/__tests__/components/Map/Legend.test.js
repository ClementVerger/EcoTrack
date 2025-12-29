import React from "react";
import { render, screen } from "@testing-library/react";
import Legend from "../../../src/components/Map/Legend";

describe("Legend Component", () => {
  it("devrait rendre le composant Legend", () => {
    const { container } = render(<Legend />);
    expect(container.querySelector(".legend-container")).toBeInTheDocument();
  });

  it("devrait afficher les 4 types de conteneurs", () => {
    render(<Legend />);
    expect(screen.getByText(/Verre/i)).toBeInTheDocument();
    expect(screen.getByText(/Papier/i)).toBeInTheDocument();
    expect(screen.getByText(/Plastique/i)).toBeInTheDocument();
    expect(screen.getByText(/Ordures/i)).toBeInTheDocument();
  });

  it("devrait avoir les bonnes couleurs pour chaque type", () => {
    const { container } = render(<Legend />);
    const legendDots = container.querySelectorAll(".legend-dot");
    expect(legendDots).toHaveLength(4);
    // Vérifier les couleurs
    expect(legendDots[0]).toHaveStyle("background-color: rgb(33, 150, 243)");
    expect(legendDots[1]).toHaveStyle("background-color: rgb(255, 152, 0)");
    expect(legendDots[2]).toHaveStyle("background-color: rgb(76, 175, 80)");
    expect(legendDots[3]).toHaveStyle("background-color: rgb(156, 39, 176)");
  });

  it("devrait afficher les labels correctement", () => {
    const { container } = render(<Legend />);
    const labels = container.querySelectorAll(".legend-label");
    expect(labels).toHaveLength(4);
    expect(labels[0]).toHaveTextContent("Verre");
    expect(labels[1]).toHaveTextContent("Papier");
    expect(labels[2]).toHaveTextContent("Plastique");
    expect(labels[3]).toHaveTextContent("Ordures");
  });
});
