import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CustomerForm } from '@/components/booking/CustomerForm';
import { MerchCheckoutModal } from '@/components/merch/MerchCheckoutModal';

describe('payment options', () => {
  it('does not offer an online payment option in the haircut booking form', () => {
    render(<CustomerForm onSubmit={() => undefined} onBack={() => undefined} />);

    expect(screen.getByRole('button', { name: /cash/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /card/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pay online/i })).not.toBeInTheDocument();
  });

  it('does not show Yoco in the merch checkout confirmation step', () => {
    render(
      <MerchCheckoutModal
        isOpen
        onClose={() => undefined}
        item={{
          id: '1',
          name: 'Test Tee',
          price: 200,
          description: 'Test',
          longDescription: 'Test',
          src: '',
          thumbnails: [],
          features: [],
        }}
        size="M"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByPlaceholderText('0821234567'), { target: { value: '0821234567' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByRole('heading', { name: /confirm order/i })).toBeInTheDocument();
    expect(screen.queryByText(/online \(yoco\)/i)).not.toBeInTheDocument();
  });
});
