import { expect, test } from '@playwright/test'

test('Link Hub loads in the browser', async ({ page }) => {
  const response = await page.goto('/')

  expect(response, 'homepage should respond').toBeTruthy()
  expect(
    response!.ok(),
    `homepage returned ${response!.status()} ${response!.url()}`,
  ).toBe(true)

  await expect(
    page.getByRole('heading', { level: 1, name: 'Devvrat' }),
  ).toBeVisible()
})
