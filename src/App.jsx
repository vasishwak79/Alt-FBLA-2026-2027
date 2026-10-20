import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';

import { Loading } from './components/Feedback.jsx';
import { Layout, RequireAuth } from './components/Layout.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { PreferencesProvider } from './context/PreferencesContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import About from './pages/About.jsx';
import Catalog from './pages/Catalog.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Register from './pages/Register.jsx';
import ResourceDetail from './pages/ResourceDetail.jsx';
import Sources from './pages/Sources.jsx';

// Pages that need a signed-in user are loaded on demand to keep the first download small.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Requests = lazy(() => import('./pages/Requests.jsx'));
const NewRequest = lazy(() => import('./pages/NewRequest.jsx'));
const RequestDetail = lazy(() => import('./pages/RequestDetail.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));

function Protected({ admin = false, children }) {
  return (
    <RequireAuth admin={admin}>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="catalog/:id" element={<ResourceDetail />} />
                <Route path="about" element={<About />} />
                <Route path="sources" element={<Sources />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="dashboard" element={<Protected><Dashboard /></Protected>} />
                <Route path="requests" element={<Protected><Requests /></Protected>} />
                <Route path="requests/new" element={<Protected><NewRequest /></Protected>} />
                <Route path="requests/:id" element={<Protected><RequestDetail /></Protected>} />
                <Route path="admin" element={<Protected admin><Admin /></Protected>} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
