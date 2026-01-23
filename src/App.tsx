import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts'
import { AppShell } from '@/components/layout'

const queryClient = new QueryClient()

// Placeholder pages - will be replaced with actual implementations
function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
      <p className="text-gray-600">Welcome to Clekee!</p>
    </div>
  )
}

function AddItemPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Add Item</h1>
      <p className="text-gray-600">Add a new item to your inventory.</p>
    </div>
  )
}

function InventoryPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">My Inventory</h1>
      <p className="text-gray-600">Your inventory items will appear here.</p>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
      <p className="text-gray-600">Configure your preferences.</p>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/add" element={<AddItemPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
