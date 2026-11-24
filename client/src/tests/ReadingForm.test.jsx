import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ReadingModal, getTodayDateString } from '../components/ReadingModal';
import { api } from '../api/client';

// Mock the API client
vi.mock('../api/client', () => ({
  api: {
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('ReadingModal Form Component & Validation Rules', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with required inputs and default values', () => {
    render(
      <ReadingModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByTestId('reading-modal')).toBeInTheDocument();
    expect(screen.getByTestId('input-date')).toBeInTheDocument();
    expect(screen.getByTestId('select-slot')).toBeInTheDocument();
    expect(screen.getByTestId('input-value')).toBeInTheDocument();
    expect(screen.getByTestId('submit-reading-btn')).toBeInTheDocument();
  });

  it('displays exact error "Please enter a glucose value." when value is empty', async () => {
    render(
      <ReadingModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitBtn = screen.getByTestId('submit-reading-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const errorMsg = screen.getByTestId('validation-error-message');
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveTextContent('Please enter a glucose value.');
    });

    expect(api.post).not.toHaveBeenCalled();
  });

  it('displays exact error "Value must be between 40 and 600 mg/dl." when value is below 40', async () => {
    render(
      <ReadingModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const valueInput = screen.getByTestId('input-value');
    fireEvent.change(valueInput, { target: { value: '35' } });

    const submitBtn = screen.getByTestId('submit-reading-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const errorMsg = screen.getByTestId('validation-error-message');
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveTextContent('Value must be between 40 and 600 mg/dl.');
    });

    expect(api.post).not.toHaveBeenCalled();
  });

  it('displays exact error "Value must be between 40 and 600 mg/dl." when value is above 600', async () => {
    render(
      <ReadingModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const valueInput = screen.getByTestId('input-value');
    fireEvent.change(valueInput, { target: { value: '650' } });

    const submitBtn = screen.getByTestId('submit-reading-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const errorMsg = screen.getByTestId('validation-error-message');
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveTextContent('Value must be between 40 and 600 mg/dl.');
    });

    expect(api.post).not.toHaveBeenCalled();
  });

  it('displays exact error "Date cannot be in the future." when future date is selected', async () => {
    render(
      <ReadingModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const dateInput = screen.getByTestId('input-date');
    fireEvent.change(dateInput, { target: { value: '2099-12-31' } });

    const valueInput = screen.getByTestId('input-value');
    fireEvent.change(valueInput, { target: { value: '110' } });

    const submitBtn = screen.getByTestId('submit-reading-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const errorMsg = screen.getByTestId('validation-error-message');
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveTextContent('Date cannot be in the future.');
    });

    expect(api.post).not.toHaveBeenCalled();
  });

  it('successfully submits valid reading data to API', async () => {
    api.post.mockResolvedValueOnce({
      reading: {
        id: 1,
        date: getTodayDateString(),
        slot: 'Morning (fasting)',
        value: 105,
      },
    });

    render(
      <ReadingModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const valueInput = screen.getByTestId('input-value');
    fireEvent.change(valueInput, { target: { value: '105' } });

    const submitBtn = screen.getByTestId('submit-reading-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/readings', {
        date: getTodayDateString(),
        slot: 'Morning (fasting)',
        value: 105,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays backend error message if backend rejects request (e.g. duplicate slot)', async () => {
    api.post.mockRejectedValueOnce(
      new Error('You already have an After lunch reading for this date.')
    );

    render(
      <ReadingModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        prefilledSlot="After lunch"
      />
    );

    const valueInput = screen.getByTestId('input-value');
    fireEvent.change(valueInput, { target: { value: '140' } });

    const submitBtn = screen.getByTestId('submit-reading-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const errorMsg = screen.getByTestId('validation-error-message');
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveTextContent(
        'You already have an After lunch reading for this date.'
      );
    });
  });
});
