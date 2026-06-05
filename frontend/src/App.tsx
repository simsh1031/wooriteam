import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PostListPage from './pages/PostListPage';
import PostDetailPage from './pages/PostDetailPage';
import PostFormPage from './pages/PostFormPage';
import ApplyPage from './pages/ApplyPage';
import ApplicantsPage from './pages/ApplicantsPage';
import MyPage from './pages/MyPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/posts" element={<PostListPage />} />
          <Route path="/posts/new" element={<PostFormPage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
          <Route path="/posts/:id/edit" element={<PostFormPage />} />
          <Route path="/posts/:id/apply" element={<ApplyPage />} />
          <Route path="/posts/:id/applicants" element={<ApplicantsPage />} />
          <Route path="/my" element={<MyPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}