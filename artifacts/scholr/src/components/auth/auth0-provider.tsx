import { Auth0Provider as BaseAuth0Provider } from "@auth0/auth0-react";
import { ReactNode } from "react";

const domain = import.meta.env.VITE_AUTH0_DOMAIN as string;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string;

// Callback URL — must be added to Auth0 dashboard under Allowed Callback URLs
const origin = window.location.origin;
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const redirectUri = `${origin}${base}/callback`;

export function Auth0Provider({ children }: { children: ReactNode }) {
  if (!domain || !clientId) {
    // Auth0 not configured — render children without provider
    return <>{children}</>;
  }
  return (
    <BaseAuth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
    >
      {children}
    </BaseAuth0Provider>
  );
}
