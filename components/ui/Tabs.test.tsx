import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

describe('Tabs compound component', () => {
  function renderTabs() {
    return render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab One</TabsTrigger>
          <TabsTrigger value="tab2">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content One</TabsContent>
        <TabsContent value="tab2">Content Two</TabsContent>
      </Tabs>
    );
  }

  it('renders the tabs list and triggers', () => {
    renderTabs();
    expect(screen.getByText('Tab One')).toBeInTheDocument();
    expect(screen.getByText('Tab Two')).toBeInTheDocument();
  });

  it('shows the default tab content on initial render', () => {
    renderTabs();
    expect(screen.getByText('Content One')).toBeVisible();
  });

  it('switches content when a different trigger is clicked', async () => {
    const user = userEvent.setup();
    renderTabs();
    await user.click(screen.getByText('Tab Two'));
    expect(screen.getByText('Content Two')).toBeVisible();
  });

  it('active trigger has data-state="active"', async () => {
    const user = userEvent.setup();
    renderTabs();
    const tab1 = screen.getByText('Tab One');
    const tab2 = screen.getByText('Tab Two');
    expect(tab1).toHaveAttribute('data-state', 'active');
    expect(tab2).toHaveAttribute('data-state', 'inactive');
    await user.click(tab2);
    expect(tab2).toHaveAttribute('data-state', 'active');
    expect(tab1).toHaveAttribute('data-state', 'inactive');
  });

  it('TabsList has the surface-container-low background class', () => {
    renderTabs();
    const list = screen.getByRole('tablist');
    expect(list.className).toContain('surface-container-low');
  });
});
