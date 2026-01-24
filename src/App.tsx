import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts'
import { AppShell } from '@/components/layout'
import { SignupPage, LoginPage, SettingsPage, ResetPasswordPage, ResetPasswordConfirmPage, AddItemPage, ItemEditorPage, DashboardPage, InventoryPage, ItemDetailPage, EditItemPage, SearchPage } from '@/pages'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes - outside AppShell (no bottom nav) */}
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/reset-password/confirm" element={<ResetPasswordConfirmPage />} />

            {/* Protected routes - inside AppShell (with bottom nav) */}
            <Route
              path="/*"
              element={
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/add" element={<AddItemPage />} />
                    <Route path="/add/edit" element={<ItemEditorPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/item/:id" element={<ItemDetailPage />} />
                    <Route path="/item/:id/edit" element={<EditItemPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/search" element={<SearchPage />} />
                  </Routes>
                </AppShell>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
