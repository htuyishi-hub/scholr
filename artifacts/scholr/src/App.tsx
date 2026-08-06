import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, type ComponentType } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { PublicLayout } from "@/components/layout/public-layout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StudentAuthProvider } from "@/hooks/use-student-auth";
import { Auth0Provider } from "@/components/auth/auth0-provider";

// The landing page is the most common entry point, so it stays in the main
// bundle. Everything else is code-split so first paint ships far less JS.
import { Home } from "@/pages/public/home";

/** Turn a named export into a lazy default-export component. */
function lazyNamed<T extends string>(
  loader: () => Promise<Record<string, unknown>>,
  name: T,
) {
  return lazy(async () => ({
    default: (await loader())[name] as ComponentType<any>,
  }));
}

const AdminLayout = lazyNamed(() => import("@/components/layout/admin-layout"), "AdminLayout");

const Browse = lazyNamed(() => import("@/pages/public/browse"), "Browse");
const OpportunityDetail = lazyNamed(
  () => import("@/pages/public/opportunity-detail"),
  "OpportunityDetail",
);
const About = lazyNamed(() => import("@/pages/public/about"), "About");
const StudentRegister = lazyNamed(() => import("@/pages/public/student-register"), "StudentRegister");
const StudentLogin = lazyNamed(() => import("@/pages/public/student-login"), "StudentLogin");
const StudentDashboard = lazyNamed(
  () => import("@/pages/public/student-dashboard"),
  "StudentDashboard",
);
const StudentProfile = lazyNamed(() => import("@/pages/public/student-profile"), "StudentProfile");
const FindScholarship = lazyNamed(() => import("@/pages/public/find-scholarship"), "FindScholarship");
const Jobs = lazyNamed(() => import("@/pages/public/jobs"), "Jobs");
const Auth0Callback = lazyNamed(() => import("@/pages/public/auth0-callback"), "Auth0Callback");

const Login = lazyNamed(() => import("@/pages/admin/login"), "Login");
const Dashboard = lazyNamed(() => import("@/pages/admin/dashboard"), "Dashboard");
const Posts = lazyNamed(() => import("@/pages/admin/posts"), "Posts");
const PostsForm = lazyNamed(() => import("@/pages/admin/posts-form"), "PostsForm");
const Team = lazyNamed(() => import("@/pages/admin/team"), "Team");
const Settings = lazyNamed(() => import("@/pages/admin/settings"), "Settings");
const AdminApplications = lazyNamed(() => import("@/pages/admin/applications"), "AdminApplications");
const AdminApplicationDetail = lazyNamed(
  () => import("@/pages/admin/application-detail"),
  "AdminApplicationDetail",
);
const JobsPanel = lazyNamed(() => import("@/pages/admin/jobs-panel"), "JobsPanel");
const EditorialQueue = lazyNamed(() => import("@/pages/admin/editorial-queue"), "EditorialQueue");
const EditorialItem = lazyNamed(() => import("@/pages/admin/editorial-item"), "EditorialItem");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid the refetch storms Lighthouse flagged: cached data stays fresh
      // for a minute and failed (e.g. 401) requests are not retried.
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function RouteFallback() {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

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
              <Suspense fallback={<RouteFallback />}>
                <Router />
              </Suspense>
            </WouterRouter>
            <Toaster />
          </StudentAuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </Auth0Provider>
  );
}

export default App;
