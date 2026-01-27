import { test, expect } from '@playwright/test';

test.describe('Claim Adjudication', () => {
  test('reviewer can accept a claim with evidence', async ({ page }) => {
    await page.goto('/claims/claim-review-001');

    await expect(page.getByTestId('claim-text')).toBeVisible();
    await expect(page.getByTestId('claim-state')).toHaveText(/review/i);

    const evidenceItems = page.getByTestId('evidence-item');
    await expect(evidenceItems).toHaveCount(1);

    await expect(
      evidenceItems.first().getByTestId('evidence-document-title')
    ).toBeVisible();

    await expect(
      evidenceItems.first().getByTestId('evidence-snippet')
    ).toBeVisible();

    const acceptButton = page.getByRole('button', { name: /accept/i });
    await expect(acceptButton).toBeEnabled();

    await acceptButton.click();

    await expect(page.getByTestId('claim-state')).toHaveText(/accepted/i);

    await expect(acceptButton).toBeDisabled();
    await expect(
      page.getByRole('button', { name: /reject/i })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: /flag/i })
    ).toBeDisabled();
  });
});

