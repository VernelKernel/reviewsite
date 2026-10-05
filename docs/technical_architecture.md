# Technical Architecture — Review Website

**Status:** Foundational technical architecture
**Product:** Review / Evaluation Platform
**Primary launch subject:** Video games
**Future subjects:** Movies and other cultural works
**Primary development environment:** Windows + Cursor + Docker Desktop
**Application stack:** Next.js + TypeScript + PostgreSQL + Prisma

---

# 1. Purpose

This document defines the technical architecture for the review and evaluation platform.

The product's database, application architecture, UI, and APIs must support the central product idea:

> **A review is not merely a score. It is a judgment produced by a particular experience, evaluation lens, standard, and set of observations.**

The technical architecture therefore needs to preserve structured evaluation information rather than collapsing everything into a single rating.

This document exists so that implementation decisions remain consistent as the application grows.

It is especially important because AI-assisted development can otherwise cause the codebase to evolve feature-by-feature without preserving the underlying architecture.

---

# 2. Architectural Principle

The most important architectural principle is:

> **The system stores evidence and context; the application derives interpretations and aggregates.**

The database should preserve:

* what work was evaluated
* who evaluated it
* what the reviewer experienced
* how much of the work they experienced
* what evaluation lens they used
* whether they adjusted their standards
* their judgments about individual dimensions
* their written review
* recurring topics and observations

The application can then derive:

* Review Landscape
* distributions
* percentages
* recurring praise
* recurring criticism
* disagreement
* comparisons
* discovery
* editorial insights

Do not store derived aggregate scores as the primary truth.

---

# 3. Technology Stack

## Application

### Next.js

Use Next.js with TypeScript as the primary application framework.

Next.js provides:

* application routing
* server-side rendering
* static rendering where appropriate
* server components
* server actions / API endpoints where appropriate
* metadata and SEO infrastructure
* frontend and backend application logic in one project

We are deliberately avoiding a separate frontend and backend application at the beginning.

There is no current requirement for:

* separate Express server
* NestJS server
* separate REST API project
* microservices

The application should remain a coherent monolith until there is a demonstrated reason to separate services.

---

# 4. Language

Use:

> **TypeScript**

Do not introduce JavaScript-only modules unless there is a compelling dependency reason.

Use strict TypeScript settings.

Prefer explicit domain types over loose objects.

Avoid `any` unless there is a documented reason.

The database model, domain model, API boundaries, and UI should all have strong type relationships.

---

# 5. Database

Use:

> **PostgreSQL**

PostgreSQL is the primary persistent data store.

The data is inherently relational:

```text
Work
 ├── Creators
 ├── Releases
 ├── Platforms
 ├── Genres
 ├── Media
 └── Evaluations
       ├── Reviewer
       ├── Review
       ├── Lens
       ├── Standard
       ├── Completion
       ├── Dimensions
       └── Topics
```

Do not replace PostgreSQL with a document database merely because some records contain flexible metadata.

The relational structure is an important part of the product.

---

# 6. ORM

Use:

> **Prisma**

Prisma is the application's database access layer.

Application code should not normally contain raw SQL.

Raw SQL is permitted when there is a demonstrated performance or database-specific requirement, but it should be isolated and documented.

Prisma migrations are the authoritative mechanism for schema evolution.

Do not modify the production database manually.

---

# 7. Local Development Infrastructure

Use:

> **Docker Desktop**

PostgreSQL should run locally in Docker rather than requiring a native PostgreSQL installation on Windows.

The repository should eventually contain a Docker Compose configuration capable of starting the development database.

Conceptually:

```text
Docker Desktop
    │
    └── PostgreSQL container
             │
             └── persistent Docker volume

Next.js application
        │
        └── Prisma
                │
                └── PostgreSQL
```

The database should be reproducible on another development machine.

---

# 8. Environment Configuration

Secrets and environment-specific values must not be hard-coded.

Use environment variables for:

* database connection
* authentication secrets
* external API credentials
* storage credentials
* email credentials
* analytics credentials
* other deployment-specific configuration

Maintain:

```text
.env.example
```

with placeholder values.

Never commit:

```text
.env
```

or real credentials.

---

# 9. Initial Repository Structure

The exact structure may evolve with the framework, but the architecture should conceptually resemble:

```text
project/
│
├── app/
│   ├── ...
│
├── components/
│   ├── ui/
│   ├── navigation/
│   ├── works/
│   ├── reviews/
│   ├── evaluations/
│   ├── discovery/
│   └── media/
│
├── lib/
│   ├── db/
│   ├── domain/
│   ├── evaluation/
│   ├── search/
│   ├── aggregation/
│   └── validation/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│
├── design-system/
│   ├── themes/
│   ├── tokens/
│   └── ...
│
├── docs/
│   ├── NORTH_STAR.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   └── ...
│
├── public/
│
├── docker-compose.yml
├── .env.example
├── package.json
└── tsconfig.json
```

The exact directory names can be adjusted to match the chosen Next.js conventions.

The separation of responsibilities should remain.

---

# 10. Domain Architecture

The application should distinguish between:

## Domain data

Facts stored in PostgreSQL.

Examples:

* Work
* Creator
* Release
* Reviewer
* Evaluation
* Dimension
* Topic

## Derived application data

Calculated from domain data.

Examples:

* Review Landscape
* percentage positive
* percentage negative
* disagreement
* recurring topics
* comparison results

## Presentation

How the information is displayed.

Examples:

* cards
* charts
* work pages
* review pages
* filters
* navigation

Do not allow presentation components to become responsible for database logic.

---

# 11. Database Is Not the UI

Do not design the database around the appearance of a particular page.

For example, do not add:

```text
homepageScore
heroRating
reviewLandscapeColor
```

to database models simply because the current UI needs them.

Instead:

```text
Database
   ↓
Domain logic
   ↓
Derived result
   ↓
UI
```

The UI should consume meaningful domain results.

---

# 12. Work Is the Primary Content Object

The fundamental content object is:

> **Work**

A Work represents the cultural object being evaluated.

Initially:

```text
Video game
```

Eventually:

```text
Movie
TV series
Book
Album
Other cultural work
```

Do not hard-code game-specific assumptions into the core Work abstraction unless they genuinely belong to games.

Use typed categories where appropriate.

---

# 13. Evaluation Is the Core Product Object

The fundamental judgment object is:

> **Evaluation**

An Evaluation represents a person's structured assessment of a Work.

An Evaluation may include:

* reviewer
* work
* platform
* ownership context
* playtime
* completion status
* evaluation lens
* evaluation standard
* enjoyment
* execution
* dimensional judgments
* written review
* topic observations

The written Review is part of the Evaluation rather than the entire evaluation itself.

---

# 14. Review Is Supporting Evidence

A written review is important, but it should not be treated as the entire review model.

Conceptually:

```text
Evaluation
    │
    ├── Structured judgments
    │
    ├── Context
    │
    └── Written review
```

This allows the system to have meaningful evaluations even when a reviewer provides relatively little prose.

It also allows existing prose to be imported and then structured.

---

# 15. Do Not Introduce a Conventional Global Score

There should be no architectural requirement for:

```text
score: 84
```

as the canonical representation of a Work.

If the product later displays numerical summaries, they must be derived from structured evaluation evidence.

Do not create a database field simply called:

```text
score
rating
overallScore
metacriticScore
```

unless a future product decision explicitly requires a separate external or user-defined rating.

The platform's identity depends on avoiding premature reduction to one number.

---

# 16. Evaluation Dimensions

Dimensions should be data-driven rather than hard-coded throughout the application.

Examples for games:

* Gameplay
* Story
* Music
* Art Direction
* Technical Quality
* Performance
* Tutorial
* Controls
* Level Design
* Atmosphere
* Writing

Future works may use different dimensions.

Therefore the application should be able to ask:

```text
Which dimensions apply to this WorkType?
```

rather than assuming every work has Gameplay.

---

# 17. Evaluation Lens

The system should preserve how the reviewer approached the work.

Examples:

```text
EXECUTION
EXPERIENCE
MIXED
```

The exact enumeration may evolve.

The important architectural principle is:

> The evaluation lens is data, not merely prose.

This allows users to filter and compare evaluations based on approach.

---

# 18. Evaluation Standard

The system should separately capture whether the reviewer consciously adjusted expectations based on context.

Examples:

```text
ABSOLUTE
CONTEXTUAL
MIXED
```

Do not automatically interpret contextual evaluation as either more generous or less legitimate.

The database records the reviewer's declared approach.

The application presents it.

The user decides how much weight to give it.

---

# 19. Reviewer Context

Useful contextual information includes:

* platform
* approximate playtime
* completion status
* ownership context
* review date
* evaluation lens
* evaluation standard

Do not implement unnecessary psychological tracking.

The platform is not designed to measure:

* mood
* emotional state
* sleep
* time of day
* caffeine
* detailed session history

unless a future product decision explicitly establishes a compelling reason.

---

# 20. Completion

Completion status should be represented explicitly.

Possible states:

```text
JUST_STARTED
EARLY
SUBSTANTIAL
COMPLETED
ENDGAME
POST_GAME
```

The exact taxonomy may evolve.

Do not maintain redundant boolean fields when the status already communicates the information.

For example, avoid simultaneously storing:

```text
completion = COMPLETED
experiencedFullWork = true
```

unless there is a demonstrably different semantic meaning.

---

# 21. Aggregation Architecture

The Review Landscape is derived.

Conceptually:

```text
PostgreSQL
     ↓
Evaluation queries
     ↓
Aggregation functions
     ↓
Review Landscape
     ↓
UI visualization
```

Example:

```text
1,000 evaluations
       ↓
Gameplay judgments
       ↓
Positive: 42%
Mixed:    31%
Negative: 27%
```

The percentages should be calculated from underlying evaluations.

Do not store these numbers as permanent facts unless there is a future caching/performance reason.

If caching is introduced, the cache must remain derivable from canonical evaluation data.

---

# 22. Aggregation Must Preserve Disagreement

Do not reduce a distribution to an average if doing so destroys useful information.

For example:

```text
50% Positive
50% Negative
```

contains a very different signal from:

```text
100% Mixed
```

even if a simplistic numerical average could make them appear similar.

The Review Landscape should therefore preserve distributions and sample size.

Where useful, display:

* distribution
* number of evaluations
* completion context
* evaluation lens
* evaluation standard

---

# 23. Sample Size

Never present a tiny sample as if it were a definitive consensus.

The application should know:

```text
evaluationCount
```

for every aggregate.

A Work with:

```text
3 evaluations
```

should not visually imply the same confidence as:

```text
1,300 evaluations
```

Do not manufacture statistical certainty.

---

# 24. Topic Architecture

Topics represent recurring observations within evaluations.

Examples:

```text
Tutorial
Controls
Performance
Difficulty
Pacing
Writing
Music
Technical Issues
```

Topics should eventually behave as controlled vocabulary rather than arbitrary strings.

For example, avoid uncontrolled duplication such as:

```text
Tutorial
Tutorials
Bad Tutorial
Tutorial Problems
Tutorial System
```

Normalization can be introduced as the corpus grows.

---

# 25. Work Relationships

Works can have relationships.

Examples:

```text
SEQUEL
PREQUEL
SAME_SERIES
SPIRITUAL_SUCCESSOR
SAME_CREATOR
ADAPTATION
RELATED
```

These relationships should support discovery.

Do not build recommendation AI around them initially.

The relational data itself is sufficient to establish useful navigation.

---

# 26. Media Architecture

Media should be represented separately from textual Work data.

A Work can have:

* primary artwork
* screenshots
* posters
* trailers
* other media

The media layer should not dictate the Work model.

Media URLs should not be treated as application identity.

Avoid tying the application permanently to a single media provider.

---

# 27. Search

Do not introduce Elasticsearch, OpenSearch, Algolia, or another dedicated search service initially.

Start with PostgreSQL-compatible search capabilities and application-level indexing where appropriate.

Only introduce a separate search system when real usage demonstrates a need.

Search should initially support:

* Work titles
* Creators
* Genres
* Review content where appropriate
* Topics
* discovery

The search architecture must not become an infrastructure project before the product requires it.

---

# 28. Caching

Do not introduce Redis simply because the site may eventually need caching.

Initial approach:

```text
PostgreSQL
   ↓
Next.js server/data layer
   ↓
Rendered result
```

Use framework-supported caching and revalidation mechanisms where appropriate.

Add Redis or another dedicated cache only after a concrete performance requirement exists.

---

# 29. API Architecture

The application should use the simplest appropriate server-side interface.

Prefer:

* Server Components for server-rendered reads where appropriate
* Server Actions for mutations where appropriate
* Route handlers for endpoints that genuinely need HTTP APIs

Do not build a complete public REST API before there is a consumer for it.

A future mobile app, external integration, or partner may justify a formal API.

Until then, unnecessary API abstraction creates maintenance cost.

---

# 30. Validation

Validate data at the application boundary.

Use a schema validation library such as Zod where appropriate.

Never trust client-side validation alone.

For example:

```text
Browser
   ↓
Validation
   ↓
Server
   ↓
Domain rules
   ↓
Prisma
   ↓
PostgreSQL
```

The server is authoritative.

---

# 31. Domain Logic

Business rules should not be scattered across React components.

For example, the rule:

> “A Review Landscape calculation only includes published evaluations.”

belongs in the data/domain layer.

Not:

```tsx
if (evaluation.status === ...)
```

repeated across five different UI components.

Centralize important domain rules.

---

# 32. Authentication

Do not overbuild authentication before it is required.

The eventual architecture should distinguish:

```text
User Account
      ↓
Reviewer Profile
      ↓
Evaluations
```

However, if the MVP is initially seeded without public accounts, do not create a complex identity system merely for theoretical future requirements.

When authentication is introduced, use an established authentication solution rather than inventing password/session infrastructure.

---

# 33. Authorization

Authorization must be server-side.

At minimum, eventually distinguish:

```text
Anonymous visitor
Registered user
Reviewer
Moderator
Administrator
```

Do not rely on UI hiding to enforce permissions.

---

# 34. Moderation

The system should eventually support moderation without destroying canonical data.

This is one reason evaluations should have explicit lifecycle state.

Potential states:

```text
DRAFT
PUBLISHED
HIDDEN
REMOVED
```

A moderation action should not automatically require physical deletion from the database.

Auditability can be added later.

---

# 35. Data Deletion

Do not casually cascade-delete entire review histories when a user or reviewer account is removed.

The product may eventually need to preserve aggregated evidence while respecting account deletion requirements.

The exact retention policy must be designed before public launch.

Do not invent a permanent policy through accidental database cascade behavior.

---

# 36. Seed Data

The application should have a repeatable seed process.

Seed data should include enough works and evaluations to demonstrate:

* positive reviews
* negative reviews
* mixed reviews
* execution-focused evaluations
* experience-focused evaluations
* contextual standards
* absolute standards
* disagreement
* multiple dimensions
* topic observations

The seed dataset is not merely fake placeholder content.

It should demonstrate the product.

---

# 37. Migrations

All schema changes must use Prisma migrations.

Development workflow:

```text
Modify schema
      ↓
Review migration
      ↓
Run migration
      ↓
Run application
      ↓
Run tests
```

Never silently change the database schema outside the migration system.

Before significant schema changes:

> Understand what existing data would mean under the new schema.

---

# 38. Testing Strategy

Testing should focus first on domain correctness.

Priority:

### 1. Domain / aggregation tests

Examples:

* evaluation distributions
* filtering
* completion handling
* contextual vs absolute grouping
* dimension aggregation
* sample size

### 2. Database integration tests

Verify Prisma queries and relationships.

### 3. UI tests

Verify important user workflows.

### 4. End-to-end tests

Verify critical paths such as:

```text
Visitor
 → Work
 → Evaluation
 → Submission
 → Review Landscape
```

Do not chase arbitrary percentage coverage.

Test the product's important behavior.

---

# 39. Error Handling

Errors should be meaningful to users and useful to developers.

Do not expose raw database errors to users.

Example:

Bad:

> PrismaClientKnownRequestError P2002

Better:

> We couldn't save this evaluation because that review already exists.

Log technical detail server-side.

---

# 40. Performance Philosophy

Optimize based on evidence.

Do not prematurely introduce:

* microservices
* Redis
* message queues
* Elasticsearch
* Kubernetes
* distributed databases
* complex background-job infrastructure

The first version should be a well-structured monolith.

A modular monolith is the intended architecture.

---

# 41. SEO Architecture

Because search discovery is part of the business model, SEO is an architectural concern.

Work pages should have:

* stable canonical URLs
* meaningful titles
* metadata
* Open Graph metadata
* structured data where appropriate
* indexable content
* server-rendered meaningful content

Do not generate thousands of thin programmatic pages.

A Work page should become more useful as real evaluations accumulate.

---

# 42. URL Architecture

Prefer human-readable stable URLs.

Conceptually:

```text
/games/unbeatable
/games/hades
/games/baldurs-gate-3
```

Future:

```text
/movies/example-movie
/books/example-book
```

Reviewer pages may eventually use:

```text
/reviewers/reviewer-name
```

Individual reviews can have their own URLs if useful, but the Work page remains the primary discovery object.

---

# 43. Design-System Architecture

The visual system is also modular.

The application has:

```text
Core
Editorial Observatory
Cinematic Archive
Modern Cultural Index
Slightly Game-Native
```

These are themes, not separate applications.

Components must consume semantic design tokens.

Do not hard-code theme-specific colors or spacing inside feature components.

Conceptually:

```text
Theme
  ↓
Design Tokens
  ↓
Components
  ↓
Pages
```

not:

```text
Page
  ↓
Random styling decisions
```

The full visual system is governed by the separate North Star document.

---

# 44. Accessibility

Accessibility is not a later polish phase.

The system should provide:

* semantic HTML
* keyboard navigation
* visible focus states
* sufficient contrast
* meaningful alt text
* labels for controls
* accessible form errors
* appropriate heading hierarchy
* reduced-motion support where appropriate

Color must not be the sole carrier of evaluation meaning.

---

# 45. Analytics

Analytics should answer product questions rather than merely maximize page views.

Useful measurements include:

* Work page visits
* Evaluation starts
* Evaluation completions
* Review submission completion
* Search usage
* Work discovery
* Returning reviewers
* Share-driven visits
* contribution conversion

Do not build invasive behavioral tracking without a product reason.

---

# 46. External Services

Keep external services replaceable.

Do not let the domain model depend directly on:

* one image provider
* one analytics provider
* one email provider
* one authentication provider
* one search provider

Use small integration boundaries where external services are required.

The core product must remain portable.

---

# 47. Deployment Philosophy

The deployment environment should be as close as practical to development.

Target architecture:

```text
Internet
   ↓
Next.js application
   ↓
PostgreSQL
```

The initial production deployment should remain simple.

Do not create a multi-service deployment merely because the application might eventually scale.

Scale architecture in response to actual demand.

---

# 48. Security Baseline

At minimum:

* secrets only in environment configuration
* server-side authorization
* input validation
* parameterized database access through Prisma
* secure authentication when introduced
* rate limiting for abuse-prone actions when public
* protection against malicious user-generated content
* safe handling of uploaded/external media
* dependency updates
* production error messages that do not expose internals

User-generated review text must be treated as untrusted input.

---

# 49. AI-Assisted Development Rules

Cursor is an implementation assistant, not the architect.

Cursor may:

* inspect the codebase
* propose implementation
* create components
* create migrations
* run tests
* refactor code
* identify implementation issues

Cursor must not casually change:

* the domain model
* evaluation philosophy
* architectural boundaries
* theme architecture
* authentication model
* database semantics

without first identifying the architectural consequence.

For significant changes:

> **Explain the architectural reason before implementing the change.**

When a request conflicts with this document, stop and surface the conflict rather than silently choosing a new architecture.

---

# 50. Cursor Implementation Rule

The project should maintain a persistent Cursor instruction derived from this document.

Core rule:

```text
TECHNICAL ARCHITECTURE RULE

This project is a modular monolith built with:

- Next.js
- TypeScript
- PostgreSQL
- Prisma
- Docker Desktop for local PostgreSQL

The domain model is the foundation of the product.

Do not treat Review as merely a score and text field.

Evaluation is the core judgment object.

The database stores canonical evidence and context.

Aggregates such as Review Landscape are derived from canonical data.

Do not introduce global scores unless explicitly required by a future product decision.

Do not prematurely introduce:
- microservices
- Redis
- Elasticsearch
- separate backend services
- message queues
- Kubernetes
- dedicated API infrastructure

Prefer simple, strongly typed, testable modules inside one application.

Use Prisma migrations for schema changes.

Keep domain logic out of presentation components.

Use semantic design tokens for visual styling.

When an architectural change is proposed, identify its consequences before implementing it.

The North Star product document and Technical Architecture document are authoritative project context.
```

---

# 51. Development Sequence

The intended implementation order is:

```text
1. North Star
        ↓
2. Technical Architecture
        ↓
3. Domain / Prisma Schema
        ↓
4. Design System / Theme Architecture
        ↓
5. Seed Data
        ↓
6. Application Shell
        ↓
7. Work Pages
        ↓
8. Evaluation Flow
        ↓
9. Review Landscape
        ↓
10. Search / Discovery
        ↓
11. Authentication
        ↓
12. Community / Contribution
        ↓
13. Moderation
        ↓
14. SEO / Growth
```

This order can change when implementation teaches us something, but major deviations should be deliberate.

---

# 52. Current Situation: Existing Schema

A Prisma schema has already been generated before this technical architecture was formally established.

That schema should be treated as:

> **An implementation draft, not the architectural authority.**

Do not automatically discard it.

Do not automatically preserve it.

The next step is to compare:

```text
Technical Architecture
        +
North Star
        ↓
Existing schema.prisma
        ↓
Schema reconciliation
```

The goal is to identify:

* what is already correct
* what is redundant
* what is missing
* what should be renamed
* what should be removed
* what should remain deliberately flexible

Only after this reconciliation should the initial migration be considered authoritative.

---

# 53. Technical North Star

The technical architecture can be summarized as:

> **Build a boring, reliable, strongly typed modular monolith around a relational domain model that preserves the evidence behind reviews.**

The sophistication of the product should come from:

* the evaluation model
* the Review Landscape
* the discovery experience
* the quality of structured evidence

—not from unnecessary infrastructure.

If a simple PostgreSQL query can solve the problem, use it.

If a Next.js server function can solve the problem, use it.

If a Prisma relation can represent the concept, use it.

Only introduce additional infrastructure when the product has demonstrated that it needs it.
