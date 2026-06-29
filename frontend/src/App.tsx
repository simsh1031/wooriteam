import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PostListPage from './pages/PostListPage';
import PostDetailPage from './pages/PostDetailPage';
import PostFormPage from './pages/PostFormPage';
import ApplyPage from './pages/ApplyPage';
import ApplicantsPage from './pages/ApplicantsPage';
import MyPage from './pages/MyPage';
import SearchResultPage from './pages/SearchResultPage';
import ProfilesPage from './pages/ProfilesPage';
import ProfileDetailPage from './pages/ProfileDetailPage';
import ReportPage from './pages/ReportPage';
import GroupListPage from './pages/GroupListPage';
import GroupDetailPage from './pages/GroupDetailPage';
import GroupFormPage from './pages/GroupFormPage';
import GroupApplyPage from './pages/GroupApplyPage';

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
          <Route path="/search" element={<SearchResultPage />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/profiles/:userId" element={<ProfileDetailPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/groups" element={<GroupListPage />} />
          <Route path="/groups/new" element={<GroupFormPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />
          <Route path="/groups/:id/apply" element={<GroupApplyPage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}