export default {
  providers: [
    {
      // Convex Auth serves its own JWKS at the deployment's site URL.
      // CONVEX_SITE_URL is a built-in env var in the Convex runtime.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
