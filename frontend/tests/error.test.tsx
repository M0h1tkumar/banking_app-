import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../src/app/error';

// Mock the Next.js Link component
jest.mock('next/link', () => {
  return ({ children }: { children: React.ReactNode }) => {
    return <a>{children}</a>;
  };
});

describe('Global Error Boundary', () => {
  it('renders the error message and buttons', () => {
    const mockError = new Error('Test error');
    const mockReset = jest.fn();

    render(<ErrorBoundary error={mockError} reset={mockReset} />);

    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Return Home')).toBeInTheDocument();
  });
});
