/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as chatSearch from "../chatSearch.js";
import type * as chatUsage from "../chatUsage.js";
import type * as coupons from "../coupons.js";
import type * as dataExport from "../dataExport.js";
import type * as dicas from "../dicas.js";
import type * as email from "../email.js";
import type * as favorites from "../favorites.js";
import type * as helpers from "../helpers.js";
import type * as hosting from "../hosting.js";
import type * as http from "../http.js";
import type * as itineraries from "../itineraries.js";
import type * as itineraryGen from "../itineraryGen.js";
import type * as itineraryHelpers from "../itineraryHelpers.js";
import type * as media from "../media.js";
import type * as nightlife from "../nightlife.js";
import type * as notifications from "../notifications.js";
import type * as osmCache from "../osmCache.js";
import type * as osmPlaces from "../osmPlaces.js";
import type * as otp from "../otp.js";
import type * as praias from "../praias.js";
import type * as push from "../push.js";
import type * as pushQueries from "../pushQueries.js";
import type * as reactions from "../reactions.js";
import type * as restaurants from "../restaurants.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as seedAdmin from "../seedAdmin.js";
import type * as siteContent from "../siteContent.js";
import type * as tours from "../tours.js";
import type * as tripReminders from "../tripReminders.js";
import type * as tripRemindersData from "../tripRemindersData.js";
import type * as trips from "../trips.js";
import type * as users from "../users.js";
import type * as usersAdmin from "../usersAdmin.js";
import type * as weather from "../weather.js";
import type * as weatherInternal from "../weatherInternal.js";
import type * as webhookLog from "../webhookLog.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  categories: typeof categories;
  chatSearch: typeof chatSearch;
  chatUsage: typeof chatUsage;
  coupons: typeof coupons;
  dataExport: typeof dataExport;
  dicas: typeof dicas;
  email: typeof email;
  favorites: typeof favorites;
  helpers: typeof helpers;
  hosting: typeof hosting;
  http: typeof http;
  itineraries: typeof itineraries;
  itineraryGen: typeof itineraryGen;
  itineraryHelpers: typeof itineraryHelpers;
  media: typeof media;
  nightlife: typeof nightlife;
  notifications: typeof notifications;
  osmCache: typeof osmCache;
  osmPlaces: typeof osmPlaces;
  otp: typeof otp;
  praias: typeof praias;
  push: typeof push;
  pushQueries: typeof pushQueries;
  reactions: typeof reactions;
  restaurants: typeof restaurants;
  reviews: typeof reviews;
  seed: typeof seed;
  seedAdmin: typeof seedAdmin;
  siteContent: typeof siteContent;
  tours: typeof tours;
  tripReminders: typeof tripReminders;
  tripRemindersData: typeof tripRemindersData;
  trips: typeof trips;
  users: typeof users;
  usersAdmin: typeof usersAdmin;
  weather: typeof weather;
  weatherInternal: typeof weatherInternal;
  webhookLog: typeof webhookLog;
  webhooks: typeof webhooks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
