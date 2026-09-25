import { Outlet } from 'react-router-dom';

/**
 * Root shell. Theme is managed by next-themes ThemeProvider in main.tsx.
 * Renders the matched route via <Outlet />.
 */
export default function App() {
  return (
    <div className="min-h-full bg-background text-foreground page-fade-in">
      <Outlet />
    </div>
  );
}
