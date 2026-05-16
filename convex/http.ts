import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Convex Auth registers its own HTTP routes (JWKS, token refresh, etc.)
auth.addHttpRoutes(http);

export default http;
