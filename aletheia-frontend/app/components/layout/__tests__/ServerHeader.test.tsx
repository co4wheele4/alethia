/**
 * Tests for ServerHeader component
 */

import { render, screen } from '@testing-library/react';
import { ServerHeader } from '../ServerHeader';

describe('ServerHeader', () => {
  it('should render Aletheia text', () => {
    render(<ServerHeader />);
    expect(screen.getByText('Aletheia')).toBeInTheDocument();
  });
});
