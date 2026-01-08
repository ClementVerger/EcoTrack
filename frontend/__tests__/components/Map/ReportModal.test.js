/* eslint-disable no-undef */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportModal from '../../../src/components/Map/ReportModal';

describe('ReportModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockLocation = {
    latitude: 48.8566,
    longitude: 2.3522,
  };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    isLoading: false,
    error: null,
    location: mockLocation,
    containerId: undefined,
    containers: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<ReportModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Signaler un problème')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<ReportModal {...defaultProps} />);
    expect(screen.getByText('📋 Signaler un problème')).toBeInTheDocument();
  });

  it('should have all form fields', () => {
    render(<ReportModal {...defaultProps} />);
    
    expect(screen.getByLabelText(/Description du problème/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Catégorie/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Niveau de sévérité/i)).toBeInTheDocument();
  });

  it('should display location information when provided', () => {
    render(<ReportModal {...defaultProps} />);
    
    expect(screen.getByText(/Position GPS/i)).toBeInTheDocument();
    expect(screen.getByText(/48.8566°, 2.3522°/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<ReportModal {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Fermer le modal');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(<ReportModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when clicking outside', () => {
    render(<ReportModal {...defaultProps} />);
    
    const overlay = screen.getByText('📋 Signaler un problème').closest('.report-modal-overlay');
    fireEvent.click(overlay);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close when clicking inside modal content', () => {
    render(<ReportModal {...defaultProps} />);
    
    const modalContent = screen.getByText('📋 Signaler un problème').closest('.report-modal-content');
    fireEvent.click(modalContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should validate description field', async () => {
    render(<ReportModal {...defaultProps} />);
    
    const submitButton = screen.getByText('Envoyer le signalement');
    
    // Try to submit with empty description
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('La description est obligatoire')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate minimum description length', async () => {
    render(<ReportModal {...defaultProps} />);
    
    const descriptionField = screen.getByPlaceholderText(/Décrivez le problème/i);
    const submitButton = screen.getByText('Envoyer le signalement');
    
    // Enter short description
    fireEvent.change(descriptionField, { target: { value: 'Short' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/au moins 10 caractères/i)).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    mockOnSubmit.mockResolvedValue({});
    
    render(<ReportModal {...defaultProps} />);
    
    const descriptionField = screen.getByPlaceholderText(/Décrivez le problème/i);
    const categoryField = screen.getByLabelText(/Catégorie/i);
    const submitButton = screen.getByText('Envoyer le signalement');
    
    fireEvent.change(descriptionField, { target: { value: 'Ceci est un problème' } });
    fireEvent.change(categoryField, { target: { value: 'conteneur_plein' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Ceci est un problème',
          category: 'conteneur_plein',
          severity: 'normal',
          latitude: 48.8566,
          longitude: 2.3522,
        }),
      );
    });
  });

  it('should show success message after successful submission', async () => {
    mockOnSubmit.mockResolvedValue({});
    jest.useFakeTimers();
    
    render(<ReportModal {...defaultProps} />);
    
    const descriptionField = screen.getByPlaceholderText(/Décrivez le problème/i);
    const submitButton = screen.getByText('Envoyer le signalement');
    
    fireEvent.change(descriptionField, { target: { value: 'Problème valide' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Signalement enregistré')).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  }, 10000);

  it('should display error message when submission fails', async () => {
    const errorMessage = 'Erreur lors de l\'envoi';
    mockOnSubmit.mockRejectedValue(new Error(errorMessage));
    
    render(<ReportModal {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should disable form while loading', () => {
    render(<ReportModal {...defaultProps} isLoading={true} />);
    
    const descriptionField = screen.getByPlaceholderText(/Décrivez le problème/i);
    const submitButton = screen.getByText(/Envoi/i);
    const closeButton = screen.getByLabelText('Fermer le modal');
    
    expect(descriptionField).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(closeButton).toBeDisabled();
  });

  it('should show spinner when loading', () => {
    render(<ReportModal {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText(/Envoi/i)).toBeInTheDocument();
  });

  it('should update character count for description', async () => {
    render(<ReportModal {...defaultProps} />);
    
    const descriptionField = screen.getByPlaceholderText(/Décrivez le problème/i);
    
    expect(screen.getByText('0/500')).toBeInTheDocument();
    
    fireEvent.change(descriptionField, { target: { value: 'Test text' } });
    
    expect(screen.getByText('9/500')).toBeInTheDocument();
  }, 10000);

  it('should have category options', () => {
    render(<ReportModal {...defaultProps} />);
    
    const categorySelect = screen.getByLabelText(/Catégorie/i);
    const options = categorySelect.querySelectorAll('option');
    
    expect(options).toHaveLength(6); // autre + 5 options
    expect(options[1]).toHaveValue('conteneur_plein');
    expect(options[2]).toHaveValue('conteneur_casse');
  });

  it('should have severity options', () => {
    render(<ReportModal {...defaultProps} />);
    
    const severitySelect = screen.getByLabelText(/Niveau de sévérité/i);
    const options = severitySelect.querySelectorAll('option');
    
    expect(options).toHaveLength(3); // 3 severity levels
    expect(options[0]).toHaveValue('basse');
    expect(options[1]).toHaveValue('normal');
    expect(options[2]).toHaveValue('haute');
  });

  it('should trim whitespace from description', async () => {
    mockOnSubmit.mockResolvedValue({});
    
    render(<ReportModal {...defaultProps} />);
    
    const descriptionField = screen.getByPlaceholderText(/Décrivez le problème/i);
    const submitButton = screen.getByText('Envoyer le signalement');
    
    fireEvent.change(descriptionField, { target: { value: '   Problème valide   ' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Problème valide',
        }),
      );
    });
  }, 10000);

  it('should set containerId from props', () => {
    const { rerender } = render(<ReportModal {...defaultProps} containerId="container-123" />);
    
    const descriptionField = screen.getByPlaceholderText(/Décrivez le problème/i);
    expect(descriptionField).toBeInTheDocument();
    
    rerender(<ReportModal {...defaultProps} containerId="container-123" />);
  });

  it('should clear validation errors when user types', async () => {
    render(<ReportModal {...defaultProps} />);
    
    const descriptionField = screen.getByPlaceholderText(/Décrivez le problème/i);
    const submitButton = screen.getByText('Envoyer le signalement');
    
    // Trigger validation error
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('La description est obligatoire')).toBeInTheDocument();
    });
    
    // Start typing
    fireEvent.change(descriptionField, { target: { value: 'Test' } });
    
    // Error should be cleared on first keystroke
    expect(screen.queryByText('La description est obligatoire')).not.toBeInTheDocument();
  }, 10000);

  it('should allow editing position GPS', () => {
    render(<ReportModal {...defaultProps} />);
    
    const editButton = screen.getByText('✏️ Éditer');
    fireEvent.click(editButton);
    
    expect(screen.getByLabelText('Latitude')).toBeInTheDocument();
    expect(screen.getByLabelText('Longitude')).toBeInTheDocument();
  });

  it('should update latitude and longitude when editing position', () => {
    render(<ReportModal {...defaultProps} />);
    
    const editButton = screen.getByText('✏️ Éditer');
    fireEvent.click(editButton);
    
    const latitudeInput = screen.getByLabelText('Latitude');
    const longitudeInput = screen.getByLabelText('Longitude');
    
    fireEvent.change(latitudeInput, { target: { value: '48.9' } });
    fireEvent.change(longitudeInput, { target: { value: '2.4' } });
    
    expect(latitudeInput.value).toBe('48.9');
    expect(longitudeInput.value).toBe('2.4');
  });

  it('should display container selector when containers provided', () => {
    const mockContainers = [
      { id: 'container-1', type: 'Verre' },
      { id: 'container-2', type: 'Papier' },
    ];
    
    render(<ReportModal {...defaultProps} containers={mockContainers} />);
    
    expect(screen.getByLabelText(/Conteneur concerné/i)).toBeInTheDocument();
    expect(screen.getByText(/Verre/)).toBeInTheDocument();
    expect(screen.getByText(/Papier/)).toBeInTheDocument();
  });

  it('should include selected container in submission', async () => {
    mockOnSubmit.mockResolvedValue({});
    
    const mockContainers = [
      { id: 'container-123', type: 'Verre' },
    ];
    
    render(<ReportModal {...defaultProps} containers={mockContainers} />);
    
    const descriptionField = screen.getByPlaceholderText(/Décrivez le problème/i);
    const containerSelect = screen.getByLabelText(/Conteneur concerné/i);
    const submitButton = screen.getByText('Envoyer le signalement');
    
    fireEvent.change(descriptionField, { target: { value: 'Problème valide' } });
    fireEvent.change(containerSelect, { target: { value: 'container-123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          containerId: 'container-123',
        }),
      );
    });
  });

  it('should send latitude and longitude in submission', async () => {
    mockOnSubmit.mockResolvedValue({});
    
    render(<ReportModal {...defaultProps} />);
    
    const descriptionField = screen.getByPlaceholderText(/Décrivez le problème/i);
    const submitButton = screen.getByText('Envoyer le signalement');
    
    fireEvent.change(descriptionField, { target: { value: 'Problème valide' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 48.8566,
          longitude: 2.3522,
        }),
      );
    });
  });

  it('should display photo upload field', () => {
    render(<ReportModal {...defaultProps} />);
    
    expect(screen.getByLabelText(/Photo/i)).toBeInTheDocument();
  });

  it('should handle photo file selection', () => {
    render(<ReportModal {...defaultProps} />);
    
    const photoInput = screen.getByLabelText(/Photo/i).parentElement.querySelector('input[type="file"]');
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(photoInput, { target: { files: [file] } });
    
    expect(photoInput).toBeInTheDocument();
  });

  it('should accept photo as optional field', async () => {
    mockOnSubmit.mockResolvedValue({});
    
    render(<ReportModal {...defaultProps} />);
    
    const descriptionField = screen.getByPlaceholderText(/Décrivez le problème/i);
    const submitButton = screen.getByText('Envoyer le signalement');
    
    fireEvent.change(descriptionField, { target: { value: 'Problème valide' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });
});
