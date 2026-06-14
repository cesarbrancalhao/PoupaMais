import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '../sidebar';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/app/terminology/LanguageContext', () => ({
  useLanguage: () => ({
    t: (obj: { pt: string; en: string; es: string }) => obj.pt,
    language: 'pt',
  }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: 'Test User', currency: 'EUR' },
      isAuthenticated: true,
      loading: false,
      logout: jest.fn(),
    });
  });

  it('should render the Finance dropdown header', () => {
    render(<Sidebar />);
    expect(screen.getByText('Finanças')).toBeInTheDocument();
  });

  it('should render the Life dropdown header', () => {
    render(<Sidebar />);
    expect(screen.getByText('Vida')).toBeInTheDocument();
  });

  it('should show Finance items after clicking the Finance header', async () => {
    render(<Sidebar />);
    await userEvent.click(screen.getByText('Finanças'));

    await waitFor(() => {
      expect(screen.getByText('Painel')).toBeInTheDocument();
    });
    expect(screen.getByText('Metas')).toBeInTheDocument();
    expect(screen.getByText('Análise')).toBeInTheDocument();
    expect(screen.getByText('Lista de Desejos')).toBeInTheDocument();
    expect(screen.getByText('Relatórios')).toBeInTheDocument();
  });

  it('should show the Soon label after clicking the Life header', async () => {
    render(<Sidebar />);
    await userEvent.click(screen.getByText('Vida'));

    await waitFor(() => {
      expect(screen.getByText('Em breve')).toBeInTheDocument();
    });
  });

  it('should toggle Finance dropdown closed when clicked again', async () => {
    render(<Sidebar />);
    const financeHeader = screen.getByText('Finanças');

    await userEvent.click(financeHeader);
    await waitFor(() => {
      expect(screen.getByText('Painel')).toBeInTheDocument();
    });

    await userEvent.click(financeHeader);
    await waitFor(() => {
      expect(screen.queryByText('Painel')).not.toBeInTheDocument();
    });
  });

  it('should toggle Life dropdown closed when clicked again', async () => {
    render(<Sidebar />);
    const lifeHeader = screen.getByText('Vida');

    await userEvent.click(lifeHeader);
    await waitFor(() => {
      expect(screen.getByText('Em breve')).toBeInTheDocument();
    });

    await userEvent.click(lifeHeader);
    await waitFor(() => {
      expect(screen.queryByText('Em breve')).not.toBeInTheDocument();
    });
  });

  it('should have correct hrefs for Finance links', async () => {
    render(<Sidebar />);
    await userEvent.click(screen.getByText('Finanças'));

    await waitFor(() => {
      expect(screen.getByText('Painel')).toBeInTheDocument();
    });

    expect(screen.getByText('Painel').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Metas').closest('a')).toHaveAttribute('href', '/goals');
    expect(screen.getByText('Análise').closest('a')).toHaveAttribute('href', '/analysis');
    expect(screen.getByText('Lista de Desejos').closest('a')).toHaveAttribute('href', '/wishlist');
    expect(screen.getByText('Relatórios').closest('a')).toHaveAttribute('href', '/reports');
  });

  it('should not render Soon as a clickable link', async () => {
    render(<Sidebar />);
    await userEvent.click(screen.getByText('Vida'));

    await waitFor(() => {
      expect(screen.getByText('Em breve')).toBeInTheDocument();
    });

    const soonElement = screen.getByText('Em breve');
    expect(soonElement.closest('a')).toBeNull();
  });

  it('should always show Settings link outside dropdowns', () => {
    render(<Sidebar />);
    const settingsLink = screen.getByText('Configurações').closest('a');
    expect(settingsLink).toHaveAttribute('href', '/settings');
    expect(settingsLink).toBeInTheDocument();
  });

  it('should highlight active link based on current pathname', async () => {
    render(<Sidebar />);
    await userEvent.click(screen.getByText('Finanças'));

    await waitFor(() => {
      expect(screen.getByText('Painel')).toBeInTheDocument();
    });

    const dashboardLink = screen.getByText('Painel').closest('a');
    expect(dashboardLink?.className).toContain('bg-gradient-to-r');
  });

  it('should show user initials in the sidebar', () => {
    render(<Sidebar />);
    expect(screen.getByText('TU')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
