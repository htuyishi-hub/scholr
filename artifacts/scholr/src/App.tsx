import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { PublicLayout } from "@/components/layout/public-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { AuthGuard } from "@/components/auth/auth-guard";

// Placeholders for pages that will be created next
import { Home } from "@/pages/public/home";
import { Browse } from "@/pages/public/browse";
import { OpportunityDetail } from "@/pages/public/opportunity-detail";
import { About } from "@/pages/public/about";

import { Login } from "@/pages/admin/login";
import { Dashboard } from "@/pages/admin/dashboard";
import { Posts } from "@/pages/admin/posts";
import { PostsForm } from "@/pages/admin/posts-form";
import { Team } from "@/pages/admin/team";
import { Settings } from "@/pages/admin/settings";

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
        <AuthGuard>
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/posts">
        <AuthGuard>
          <AdminLayout>
            <Posts />
          </AdminLayout>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/posts/new">
        <AuthGuard>
          <AdminLayout>
            <PostsForm />
          </AdminLayout>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/posts/:id/edit">
        {params => (
          <AuthGuard>
            <AdminLayout>
              <PostsForm id={params.id} />
            </AdminLayout>
          </AuthGuard>
        )}
      </Route>
      
      <Route path="/admin/team">
        <AuthGuard>
          <AdminLayout>
            <Team />
          </AdminLayout>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/settings">
        <AuthGuard>
          <AdminLayout>
            <Settings />
          </AdminLayout>
        </AuthGuard>
      </Route>

      {/* Public Routes */}
      <Route path="/">
        <PublicLayout>
          <Home />
        </PublicLayout>
      </Route>
      
      <Route path="/browse">
        <PublicLayout>
          <Browse />
        </PublicLayout>
      </Route>
      
      <Route path="/opportunity/:slug">
        {params => (
          <PublicLayout>
            <OpportunityDetail slug={params.slug} />
          </PublicLayout>
        )}
      </Route>
      
      <Route path="/about">
        <PublicLayout>
          <About />
        </PublicLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
