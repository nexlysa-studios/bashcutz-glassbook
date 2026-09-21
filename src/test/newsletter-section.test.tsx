import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NewsletterSection } from '@/components/sections/NewsletterSection';

const subscribeMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/newsletter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/newsletter')>();
  return { ...actual, subscribeToNewsletter: subscribeMock };
});

describe('NewsletterSection', () => {
  beforeEach(() => subscribeMock.mockReset());

  it('rejects an invalid email without calling the server', () => {
    render(<NewsletterSection />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address.');
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('normalizes the email and displays a duplicate-subscription response', async () => {
    subscribeMock.mockResolvedValue({
      ok: true,
      state: 'already_subscribed',
      message: "You're already subscribed to BashCutz updates.",
    });
    render(<NewsletterSection />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: '  Customer@Example.COM  ' } });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => expect(subscribeMock).toHaveBeenCalledWith('customer@example.com'));
    expect(await screen.findByText("You're already subscribed to BashCutz updates.")).toBeInTheDocument();
  });
});

