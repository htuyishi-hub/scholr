import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { PublicLayout } from "@/components/layout/public-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StudentAuthProvider } from "@/hooks/use-student-auth";
import { Auth0Provider } from "@/components/auth/auth0-provider";

import { Home } from "@/pages/public/home";
import { Browse } from "@/pages/public/browse";
import { OpportunityDetail } from "@/pages/public/opportunity-detail";
import { About } from "@/pages/public/about";
import { StudentRegister } from "@/pages/public/student-register";
import { StudentLogin } from "@/pages/public/student-login";
import { StudentDashboard } from "@/pages/public/student-dashboard";
import { StudentProfile } from "@/pages/public/student-profile";
import { FindScholarship } from "@/pages/public/find-scholarship";
import { Jobs } from "@/pages/public/jobs";
import { Auth0Callback } from "@/pages/public/auth0-callback";

import { Login } from "@/pages/admin/login";
import { Dashboard } from "@/pages/admin/dashboard";
import { Posts } from "@/pages/admin/posts";
import { PostsForm } from "@/pages/admin/posts-form";
import { Team } from "@/pages/admin/team";
import { Settings } from "@/pages/admin/settings";
import { AdminApplications } from "@/pages/admin/applications";
import { AdminApplicationDetail } from "@/pages/admin/application-detail";
import { JobsPanel } from "@/pages/admin/jobs-panel";
import { EditorialQueue } from "@/pages/admin/editorial-queue";
import { EditorialItem } from "@/pages/admin/editorial-item";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Admin Routes */}
      <Route path="/admin/login" component={Login} />
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>

      <Route path="/admin/dashboard">
        <AuthGuard><AdminLayout><Dashboard /></AdminLayout></AuthGuard>
      </Route>
      <Route path="/admin/posts">
        <AuthGuard><AdminLayout><Posts /></AdminLayout></AuthGuard>
      </Route>
      <Route path="/admin/posts/new">
        <AuthGuard><AdminLayout><PostsForm /></AdminLayout></AuthGuard>
      </Route>
      <Route path="/admin/posts/:id/edit">
        {params => <AuthGuard><AdminLayout><PostsForm id={params.id} /></AdminLayout></AuthGuard>}
      </Route>
      <Route path="/admin/applications">
        <AuthGuard><AdminLayout><AdminApplications /></AdminLayout></AuthGuard>
      </Route>
      <Route path="/admin/applications/:id">
        {params => <AuthGuard><AdminLayout><AdminApplicationDetail id={params.id} /></AdminLayout></AuthGuard>}
      </Route>
      <Route path="/admin/jobs">
        <AuthGuard><AdminLayout><JobsPanel /></AdminLayout></AuthGuard>
      </Route>
      <Route path="/admin/scraper">
        <Redirect to="/admin/editorial" />
      </Route>
      <Route path="/admin/editorial">
        <AuthGuard><AdminLayout><EditorialQueue /></AdminLayout></AuthGuard>
      </Route>
      <Route path="/admin/editorial/:id">
        {params => <AuthGuard><AdminLayout><EditorialItem id={params.id} /></AdminLayout></AuthGuard>}
      </Route>
      <Route path="/admin/team">
        <AuthGuard><AdminLayout><Team /></AdminLayout></AuthGuard>
      </Route>
      <Route path="/admin/settings">
        <AuthGuard><AdminLayout><Settings /></AdminLayout></AuthGuard>
      </Route>

      {/* Auth0 Callback */}
      <Route path="/callback">
        <PublicLayout><Auth0Callback /></PublicLayout>
      </Route>

      {/* Student Auth Routes */}
      <Route path="/register">
        <PublicLayout><StudentRegister /></PublicLayout>
      </Route>
      <Route path="/login">
        <PublicLayout><StudentLogin /></PublicLayout>
      </Route>
      <Route path="/dashboard">
        <PublicLayout><StudentDashboard /></PublicLayout>
      </Route>
      <Route path="/profile">
        <PublicLayout><StudentProfile /></PublicLayout>
      </Route>
      <Route path="/find-my-scholarship">
        <PublicLayout><FindScholarship /></PublicLayout>
      </Route>

      {/* Public Routes */}
      <Route path="/">
        <PublicLayout><Home /></PublicLayout>
      </Route>
      <Route path="/browse">
        <PublicLayout><Browse /></PublicLayout>
      </Route>
      <Route path="/jobs">
        <PublicLayout><Jobs /></PublicLayout>
      </Route>
      <Route path="/opportunity/:slug">
        {params => <PublicLayout><OpportunityDetail slug={params.slug} /></PublicLayout>}
      </Route>
      <Route path="/about">
        <PublicLayout><About /></PublicLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Auth0Provider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <StudentAuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </StudentAuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </Auth0Provider>
  );
}

export default App;
