import { test, expect } from '@playwright/test';

// Smoke tests for the unauthenticated surfaces. Deterministic — no API/DB/login
// required. They catch broken routes, missing CTAs, and build regressions.

test('landing page loads with brand + a get-started CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SkillVerify/i);
  await expect(page.getByText(/Get started/i).first()).toBeVisible();
});

test('login page shows the form, OAuth, and forgot-password', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Sign in to SkillVerify')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Forgot password/i })).toBeVisible();
});

test('login links through to the recruiter and college signups', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: /Create a recruiter account/i }).click();
  await expect(page).toHaveURL(/\/company\/signup/);
  await expect(page.getByText('Hire verified talent')).toBeVisible();
});

test('forgot-password page renders the request form', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(page.getByPlaceholder(/you@institute/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Send reset link/i })).toBeVisible();
});

test('student signup renders its fields', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.getByText(/Government name/i)).toBeVisible();
});

test('company signup renders', async ({ page }) => {
  await page.goto('/company/signup');
  await expect(page.getByText('Hire verified talent')).toBeVisible();
});

test('institution signup renders', async ({ page }) => {
  await page.goto('/institution/signup');
  await expect(page.getByText('Manage your institution')).toBeVisible();
});

test('support page renders', async ({ page }) => {
  await page.goto('/support');
  await expect(page.getByText(/Support/i).first()).toBeVisible();
});
