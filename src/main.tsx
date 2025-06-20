import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AddProduct from './Components/AddProduct'
import AdminLayout from './Components/AdminLayout'
import AdminLogin from './Components/AdminLogin'
import AdminManagement from './Components/AdminManagement'
import CategoryManagement from './Components/CategoryManagement'
import ChangePassword from './Components/ChangePassword'
import ForgotPassword from './Components/ForgotPassword'
import ProductListing from './Components/ProductListing'
import AdminProfile from './Components/Profile'
import { AuthRoute, ProtectedRoute } from './Components/ProtectedRoute'
import RoleManagement from './Components/RoleManagement'
import SellerManagement from './Components/SellerManagement'
import SellerWalletManagementPage from './Components/SellerWallet'
import ShopManagement from './Components/ShopManagement'
import SystemWalletPage from './Components/SystemWallet'
import { UserProvider } from './Context/userContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes - only accessible when not logged in */}
          <Route element={<AuthRoute />}>
            <Route path='/' element={<AdminLogin />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
          </Route>

          {/* Protected routes - only accessible when logged in */}
          <Route element={<ProtectedRoute />}>
            <Route path='/dashboard' element={<AdminLayout />}>
              <Route index element={<h1>Dashboard</h1>} />
              <Route path='change-password' element={<ChangePassword />} />
              <Route path='profile' element={<AdminProfile />} />
              <Route path='seller-management' element={<SellerManagement />} />
              <Route path='admin-management' element={<AdminManagement />} />
              <Route path='role-permission' element={<RoleManagement />} />
              <Route path='system-wallet' element={<SystemWalletPage />} />
              <Route path='seller-wallet' element={<SellerWalletManagementPage />} />
              <Route path='shops' element={<ShopManagement />} />
              <Route path='add-product' element={<AddProduct />} />
              <Route path='products' element={<ProductListing />} />
              <Route path='categories' element={<CategoryManagement />} />
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  </StrictMode>
)
