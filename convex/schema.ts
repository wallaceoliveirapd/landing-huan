import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Override the auth `users` table with our extra profile fields
  // (whatsapp is required for signup; trips count is derived from the trips table).
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Set once after the welcome email is sent (post-OTP verification).
    welcomedAt: v.optional(v.number()),
    // RBAC role, "admin" can access /admin pages. Defaults to "customer".
    role: v.optional(v.string()),
  }).index("email", ["email"]),


  // ── Passeios (Tours) ─────────────────────────────────────────
  tours: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    image: v.string(),
    duration: v.string(), // "4 horas", "Dia inteiro"
    rating: v.number(),
    reviewCount: v.number(),
    url: v.string(), // link externo (Civitatis, GetYourGuide, etc.)
    tags: v.array(v.string()),
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_featured", ["featured"])
    .index("by_active", ["active"]),

  // ── Restaurantes ─────────────────────────────────────────────
  restaurants: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.string(),
    cuisine: v.string(), // "Frutos do mar", "Nordestino"
    priceRange: v.string(), // "$", "$$", "$$$"
    image: v.string(),
    photos: v.array(v.string()),
    rating: v.number(),
    reviewCount: v.number(),
    address: v.string(),
    phone: v.optional(v.string()),
    instagram: v.optional(v.string()),
    website: v.optional(v.string()),
    hours: v.array(
      v.object({ day: v.string(), open: v.string(), close: v.string() })
    ),
    tags: v.array(v.string()),
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
    // TripAdvisor import
    tripAdvisorUrl: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_featured", ["featured"])
    .index("by_active", ["active"]),

  // ── Dicas (Blog) ─────────────────────────────────────────────
  dicas: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(), // Markdown
    cover: v.string(),
    category: v.string(), // "dica", "noticia", "roteiro"
    tags: v.array(v.string()),
    city: v.optional(v.string()),
    publishedAt: v.number(), // timestamp ms
    featured: v.boolean(),
    active: v.boolean(),
    // Cowork metadata
    source: v.optional(v.string()), // "cowork" | "manual"
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["publishedAt"])
    .index("by_featured", ["featured"])
    .index("by_active", ["active"]),

  // ── Praias ───────────────────────────────────────────────────
  praias: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.string(),
    image: v.string(),
    photos: v.array(v.string()),
    location: v.string(),
    features: v.array(v.string()), // ["Águas calmas", "Kite surf"]
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_featured", ["featured"])
    .index("by_active", ["active"]),

  // ── Vida Noturna ─────────────────────────────────────────────
  nightlife: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.string(),
    type: v.string(), // "Bar", "Balada", "Show ao Vivo"
    image: v.string(),
    photos: v.array(v.string()),
    address: v.string(),
    phone: v.optional(v.string()),
    instagram: v.optional(v.string()),
    hours: v.array(
      v.object({ day: v.string(), open: v.string(), close: v.string() })
    ),
    tags: v.array(v.string()),
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_featured", ["featured"])
    .index("by_active", ["active"]),

  // ── Roteiros ─────────────────────────────────────────────────
  itineraries: defineTable({
    title: v.string(),
    slug: v.string(),
    subtitle: v.string(),
    durationDays: v.number(),
    cover: v.string(),
    days: v.array(
      v.object({
        day: v.number(),
        title: v.string(),
        description: v.string(),
        stops: v.array(
          v.union(
            v.object({ type: v.literal("tour"), tourId: v.string() }),
            v.object({
              type: v.literal("place"),
              name: v.string(),
              address: v.optional(v.string()),
              description: v.optional(v.string()),
              time: v.optional(v.string()),
            })
          )
        ),
      })
    ),
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_featured", ["featured"])
    .index("by_active", ["active"]),

  // ── Hospedagem ───────────────────────────────────────────────
  hosting: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.string(),
    type: v.string(), // "Hotel", "Pousada", "Airbnb"
    stars: v.optional(v.number()),
    image: v.string(),
    photos: v.array(v.string()),
    address: v.string(),
    priceFrom: v.number(),
    affiliateUrl: v.string(),
    amenities: v.array(v.string()),
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_featured", ["featured"])
    .index("by_active", ["active"]),

  // ── Cupons ───────────────────────────────────────────────────
  coupons: defineTable({
    title: v.string(),                     // "8% off em passeios"
    description: v.string(),              // "Use na GetYourGuide"
    code: v.string(),                      // "HUAN10"
    image: v.string(),                     // background image URL
    discountType: v.string(),             // "percent" | "fixed"
    discountValue: v.number(),            // 8  ou  50.00
    partner: v.optional(v.string()),      // "GetYourGuide"
    partnerUrl: v.optional(v.string()),   // link do botão "Detalhes"
    conditions: v.optional(v.string()),   // texto de condições
    rules: v.optional(v.string()),        // regras de uso
    maxUses: v.optional(v.number()),      // limite de usos (0 = ilimitado)
    firstPurchaseOnly: v.boolean(),
    validUntil: v.optional(v.number()),   // timestamp ms (undefined = sem validade)
    active: v.boolean(),
    featured: v.boolean(),
    order: v.optional(v.number()),
  })
    .index("by_active", ["active"])
    .index("by_featured", ["featured"]),

  // ── Conteúdo do site ─────────────────────────────────────────
  siteContent: defineTable({
    key: v.string(), // "hero_title", "coupon_code", "coupon_banner_image", etc.
    value: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // ── Viagens dos usuários ─────────────────────────────────────
  trips: defineTable({
    userId: v.string(),            // auth user id
    title: v.string(),             // "Minha viagem pra Fortaleza"
    destination: v.string(),       // city name e.g. "Fortaleza, CE"
    lat: v.number(),               // coordinates
    lng: v.number(),
    type: v.string(),              // "praia" | "historica" | "natureza" | etc.
    duration: v.optional(v.number()), // days
    groupSize: v.optional(v.number()),
    budget: v.optional(v.string()), // "baixo" | "medio" | "alto"
    notes: v.optional(v.string()),
    status: v.string(),            // "planejando" | "confirmada" | "realizada"
    startDate: v.optional(v.number()), // timestamp
    createdAt: v.number(),
    // Generated day-by-day itinerary (filled by AI after creation)
    itinerary: v.optional(
      v.array(
        v.object({
          day: v.number(),
          theme: v.string(),
          activities: v.array(
            v.object({
              source: v.string(), // "db" | "osm" | "suggestion" | "custom"
              kind: v.string(), // "tour" | "restaurant" | "praia" | "nightlife" | "dica" | "activity" | "custom"
              timeOfDay: v.string(), // "morning" | "afternoon" | "evening" | "fullday"
              title: v.string(),
              note: v.optional(v.string()),
              itemId: v.optional(v.string()), // db: Convex id; osm: osmId
              icon: v.optional(v.string()), // when source = "suggestion"
              // User-set precise time (HH:MM) overrides the AI's timeOfDay.
              time: v.optional(v.string()),
              // Custom (source = "custom") fields
              customUrl: v.optional(v.string()),
              // OSM enrichment (only present when source = "osm")
              osmLat: v.optional(v.number()),
              osmLng: v.optional(v.number()),
              osmAddress: v.optional(v.string()),
              osmWebsite: v.optional(v.string()),
            }),
          ),
        }),
      ),
    ),
    itineraryGeneratedAt: v.optional(v.number()),
    // Weather snapshot, fetched from Open-Meteo. `mode` is "forecast" when
    // the trip starts within 16 days (precise) and "historical" otherwise
    // (3-year average of the same date window). Snapshot is auto-refreshed
    // when stale and at the 7-day-before mark for far-future trips.
    weatherSnapshot: v.optional(
      v.object({
        mode: v.string(), // "forecast" | "historical"
        fetchedAt: v.number(),
        days: v.array(
          v.object({
            date: v.string(), // YYYY-MM-DD
            tempMax: v.number(),
            tempMin: v.number(),
            precipitationSum: v.number(),
            precipitationProbabilityMax: v.optional(v.number()),
            weatherCode: v.number(),
          }),
        ),
        summary: v.optional(
          v.object({
            avgTempMax: v.number(),
            avgTempMin: v.number(),
            rainyDayCount: v.number(),
            dominantCode: v.number(),
          }),
        ),
      }),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ── Favoritos dos usuários ───────────────────────────────────
  favorites: defineTable({
    userId: v.string(),
    itemId: v.string(),            // Convex ID string
    kind: v.string(),              // "tour" | "restaurant" | "dica" | "praia" etc.
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_item", ["userId", "itemId"]),

  // ── Avaliações de restaurantes ───────────────────────────────
  restaurantReviews: defineTable({
    userId: v.string(),
    restaurantId: v.id("restaurants"),
    rating: v.number(), // 1..5
    comment: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_restaurant", ["restaurantId"])
    .index("by_user_restaurant", ["userId", "restaurantId"]),

  // ── Reações em dicas ─────────────────────────────────────────
  dicaReactions: defineTable({
    userId: v.string(),
    dicaId: v.id("dicas"),
    reaction: v.string(), // "like" | "love" | "wow" | "fire"
    createdAt: v.number(),
  })
    .index("by_dica", ["dicaId"])
    .index("by_user_dica", ["userId", "dicaId"]),

  // ── Push subscriptions (Web Push API) ────────────────────────
  pushSubscriptions: defineTable({
    userId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  // ── Inbox de notificações por usuário ────────────────────────
  // Tudo que aparece pra ele no sino do header: push broadcasts,
  // eventos do sistema (viagem criada, OTP confirmado, etc.).
  userNotifications: defineTable({
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    icon: v.optional(v.string()),
    // "broadcast" | "trip" | "welcome" | "system"
    kind: v.string(),
    read: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_user_read", ["userId", "read"]),

  // ── Histórico de broadcasts enviados (admin) ─────────────────
  pushBroadcasts: defineTable({
    sentByUserId: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    segment: v.string(), // "all" | "planning" | "with-favorites"
    delivered: v.number(),
    failed: v.number(),
    sentAt: v.number(),
  }).index("by_sentAt", ["sentAt"]),

  // ── Eventos do webhook n8n ───────────────────────────────────
  webhookEvents: defineTable({
    event: v.string(), // "trip.created" | "user.signedUp" | etc.
    payload: v.string(), // JSON.stringify(payload)
    status: v.string(), // "pending" | "sent" | "failed"
    response: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_status_createdAt", ["status", "createdAt"]),

  // ── Exclusões de conta (feedback para melhorar produto) ──────
  accountDeletions: defineTable({
    // Snapshot identifying info (the actual user row is deleted).
    userId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    reason: v.string(), // "nao-uso" | "privacidade" | "bugs" | "duplicidade" | "outro"
    feedback: v.optional(v.string()),
    deletedAt: v.number(),
  }).index("by_reason", ["reason"]),

  // ── Cache de lugares OSM (Overpass API) ──────────────────────
  // Evita refazer a mesma busca toda vez. TTL ~ 7 dias.
  osmCache: defineTable({
    cacheKey: v.string(), // e.g. "restaurant:-7.1195:-34.845:5000"
    places: v.array(
      v.object({
        osmId: v.string(),
        name: v.string(),
        kind: v.string(), // "restaurant" | "praia" | "tour" | "nightlife" | "attraction"
        lat: v.number(),
        lng: v.number(),
        address: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        openingHours: v.optional(v.string()),
        cuisine: v.optional(v.string()),
        tags: v.array(v.string()),
      }),
    ),
    fetchedAt: v.number(),
  }).index("by_key", ["cacheKey"]),

  // ── Mídia (R2) ───────────────────────────────────────────────
  media: defineTable({
    filename: v.string(),
    url: v.string(), // public CDN URL
    mimeType: v.string(),
    size: v.number(),
    uploadedAt: v.number(),
    category: v.optional(v.string()), // "tour", "restaurant", "dica", etc.
  }).index("by_category", ["category"]),

  // ── Chat usage (per-user daily counter for the in-app AI chat) ──
  chatDailyUsage: defineTable({
    userId: v.string(),
    dateKey: v.string(), // YYYY-MM-DD in São Paulo TZ
    count: v.number(),
  })
    .index("by_user_date", ["userId", "dateKey"]),

  // ── Categorias (Home stacked cards) ──────────────────────────
  categories: defineTable({
    key: v.string(),                    // "passeios", "restaurantes", "dicas", etc.
    label: v.string(),                  // display label
    href: v.string(),                   // link href
    mainImage: v.string(),              // main photo URL (R2)
    backImages: v.array(v.string()),    // 2 back fan photos (R2 URLs)
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    primary: v.boolean(),               // shows on home (true) or only bottom sheet (false)
    active: v.boolean(),
  })
    .index("by_active", ["active"])
    .index("by_key", ["key"]),
});
