/**
 * Tests for GraphQLOperationPanel component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { GraphQLOperationPanel } from '../../../components/dev/GraphQLOperationPanel';

describe('GraphQLOperationPanel', () => {
  it('should render title', () => {
    render(<GraphQLOperationPanel />);
    expect(screen.getByText('GraphQL Operations (Dev Mode)')).toBeInTheDocument();
  });

  it('should render empty state when no operations', () => {
    render(<GraphQLOperationPanel />);
    expect(screen.getByText('No operations recorded')).toBeInTheDocument();
  });

  it('should render operations', () => {
    const operations = [
      { operation: 'query GetUser { user { id } }' },
      { operation: 'mutation UpdateUser { updateUser { id } }' },
    ];

    render(<GraphQLOperationPanel operations={operations} />);
    
    // Use getAllByText since there may be multiple instances (in accordion summary and tab content)
    expect(screen.getAllByText(/query getUser/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/mutation updateUser/i).length).toBeGreaterThan(0);
  });

  it('should display query tab content when expanded', () => {
    const operations = [
      { operation: 'query Test { test }' },
    ];

    render(<GraphQLOperationPanel operations={operations} />);
    
    // Get the first accordion button (there's only one operation)
    const accordions = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-expanded') !== null
    );
    fireEvent.click(accordions[0]);
    
    expect(screen.getAllByRole('tab', { name: /query/i }).length).toBeGreaterThan(0);
    // Query text appears in both accordion summary and tab content
    expect(screen.getAllByText(/query test/i).length).toBeGreaterThan(0);
  });

  it('should display variables tab content', () => {
    const operations = [
      { operation: 'query Test', variables: { id: '123' } },
    ];

    render(<GraphQLOperationPanel operations={operations} />);
    
    // Expand the accordion
    const accordions = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-expanded') !== null
    );
    fireEvent.click(accordions[0]);
    
    // Click variables tab
    const variablesTabs = screen.getAllByRole('tab', { name: /variables/i });
    fireEvent.click(variablesTabs[0]);
    
    expect(screen.getByText(/"id":\s*"123"/)).toBeInTheDocument();
  });

  it('should display response tab content', () => {
    const operations = [
      { operation: 'query Test', response: { data: { test: 'result' } } },
    ];

    render(<GraphQLOperationPanel operations={operations} />);
    
    // Expand the accordion
    const accordions = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-expanded') !== null
    );
    fireEvent.click(accordions[0]);
    
    // Click response tab
    const responseTabs = screen.getAllByRole('tab', { name: /response/i });
    fireEvent.click(responseTabs[0]);
    
    expect(screen.getByText(/"test":\s*"result"/)).toBeInTheDocument();
  });

  it('should display error tab when error exists', () => {
    const operations = [
      { operation: 'query Test', error: 'GraphQL Error' },
    ];

    render(<GraphQLOperationPanel operations={operations} />);
    
    // Expand the accordion
    const accordions = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-expanded') !== null
    );
    fireEvent.click(accordions[0]);
    
    // Error tab should be present
    const errorTabs = screen.getAllByRole('tab', { name: /error/i });
    expect(errorTabs.length).toBeGreaterThan(0);
    
    // Click error tab
    fireEvent.click(errorTabs[0]);
    
    expect(screen.getByText('GraphQL Error')).toBeInTheDocument();
  });
});
