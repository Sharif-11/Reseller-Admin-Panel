import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AddProduct from './Components/AddProduct'
import AdminLayout from './Components/AdminLayout'
import AdminLogin from './Components/AdminLogin'
import AdminManagement from './Components/AdminManagement'
import AnnouncementManagement from './Components/Announcement'
import AdminBalanceStatement from './Components/BalanceStatement'
import CategoryManagement from './Components/CategoryManagement'
import ChangePassword from './Components/ChangePassword'
import CommissionTable from './Components/CommissionTable'
import ConfigurationSettings from './Components/Configuration'
import DashboardStats from './Components/Dashboard'
import DashboardTracker from './Components/DashboardTracker'
import ForgotPassword from './Components/ForgotPassword'
import AdminOrders from './Components/Orders'
import AdminPaymentVerification from './Components/PaymentVerification'
import ProductListing from './Components/ProductListing'
import AdminProfile from './Components/Profile'
import { ProtectedRoute } from './Components/ProtectedRoute'
import RoleManagement from './Components/RoleManagement'
import SellerManagement from './Components/SellerManagement'
import SellerWalletManagementPage from './Components/SellerWallet'
import ShopManagement from './Components/ShopManagement'
import AdminTicketDetail from './Components/Support Ticket/TicketDetail'
import AdminSupportTickets from './Components/Support Ticket/TicketList'
import SystemWalletPage from './Components/SystemWallet'
import AdminWithdrawRequests from './Components/WithdrawRequest'
import { UserProvider } from './Context/userContext'
import './index.css'
import CustomerManagement from './Components/CustomerManagement'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes - only accessible when not logged in */}

          {/* Protected routes - only accessible when logged in */}
          <Route>
            <Route path='/' element={<AdminLogin />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route
              path='/dashboard'
              element={
                <ProtectedRoute>
                  <AdminLayout />
                  <DashboardTracker />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <QueryClientProvider client={queryClient}>
                    <DashboardStats />
                  </QueryClientProvider>
                }
              />
              <Route path='change-password' element={<ChangePassword />} />
              <Route path='profile' element={<AdminProfile />} />
              <Route path='seller-management' element={<SellerManagement />} />
              <Route path='customer-management' element={<CustomerManagement />} />
              <Route path='admin-management' element={<AdminManagement />} />
              <Route path='order-management' element={<AdminOrders />} />
              <Route path='role-permission' element={<RoleManagement />} />
              <Route path='system-wallet' element={<SystemWalletPage />} />
              <Route path='seller-wallet' element={<SellerWalletManagementPage />} />
              <Route path='payment-verification' element={<AdminPaymentVerification />} />
              <Route path='shops' element={<ShopManagement />} />
              <Route path='add-product' element={<AddProduct />} />
              <Route path='products' element={<ProductListing />} />
              <Route path='categories' element={<CategoryManagement />} />
              <Route path='withdraw-requests' element={<AdminWithdrawRequests />} />
              <Route path='balance-statement' element={<AdminBalanceStatement />} />
              <Route path='commission-management' element={<CommissionTable />} />
              <Route path='announcement-management' element={<AnnouncementManagement />} />
              <Route
                path='support-tickets'
                element={
                  <QueryClientProvider client={new QueryClient()}>
                    <AdminSupportTickets />
                  </QueryClientProvider>
                }
              />
              <Route
                path='support-tickets/:ticketId'
                element={
                  <QueryClientProvider client={new QueryClient()}>
                    <AdminTicketDetail />
                  </QueryClientProvider>
                }
              />
              <Route path='configuration-settings' element={<ConfigurationSettings />} />
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  </StrictMode>
)
