# Domain Model — Review Platform

**Status:** Foundational domain specification
**Product:** Review / Evaluation Platform
**Initial subject:** Video games
**Future subjects:** Movies and other cultural works
**Implementation target:** Production-ready web application with responsive desktop/mobile support

---

# 1. Purpose

This document defines the conceptual domain model of the Review Platform.

It establishes:

* what the important objects in the system are
* what those objects mean
* how they relate to one another
* what information belongs to each object
* what rules govern those relationships
* what information is canonical
* what information is derived
* what the system deliberately does **not** model

This document is intentionally written at the domain level.

It is not a Prisma schema.

It is not a UI specification.

It is not an API specification.

The Prisma model, application services, API boundaries, and UI should implement this model rather than redefine it.

---

# 2. Core Product Concept

The platform exists to help people understand the experience and quality of a work through structured evaluations from people who actually experienced it.

The fundamental unit is therefore not:

> a score

and not even:

> a written review.

The fundamental unit is:

> **an Evaluation made by a person about a Work, under a particular context, lens, and standard.**

A written review is one component of that evaluation.

Structured judgments are another.

The platform preserves those components separately so they can be examined individually and collectively.

---

# 3. Domain Vocabulary

The following terms have precise meanings throughout the application.

## Work

A cultural work being evaluated.

Initially this means a video game.

Eventually it may include:

* movie
* television series
* book
* album
* other cultural work

---

## User

A person with an account on the platform.

A User may or may not publicly participate as a reviewer.

---

## Reviewer Profile

The public identity through which a User participates in the evaluation system.

A User can have a Reviewer Profile without the two concepts being identical.

---

## Evaluation

A person's structured assessment of a Work.

An Evaluation contains:

* context
* evaluation lens
* evaluation standard
* structured judgments
* observations/topics
* written review content
* publication state

---

## Review

The written portion of an Evaluation.

A Review is not synonymous with the entire Evaluation.

---

## Dimension

A named aspect of a Work that can be evaluated.

Examples:

* Gameplay
* Story
* Music
* Tutorial
* Technical Quality
* Performance
* Writing

---

## Judgment

A structured assessment of a Dimension.

The initial vocabulary is:

* Positive
* Mixed
* Negative

---

## Topic

A recurring subject or issue identified in an Evaluation.

Examples:

* Tutorial
* Difficulty
* Pacing
* Controls
* Performance
* Bugs

A Topic is not necessarily a Dimension.

---

## Observation

A specific statement or piece of evidence associated with a Topic.

Example:

> The tutorial introduces too many mechanics before the player understands the basic control scheme.

The Topic is:

> Tutorial

The Observation is:

> The tutorial introduces too many mechanics...

---

## Lens

The primary way the reviewer approaches the evaluation.

Initial examples:

* Experience
* Execution
* Mixed

---

## Standard

The standard against which the reviewer evaluates the Work.

Initial examples:

* Absolute
* Contextual
* Mixed

Lens and Standard are separate concepts.

---

## Evaluation Context

The circumstances under which the reviewer experienced the Work.

Examples:

* platform
* ownership/access
* approximate playtime
* completion status

---

## Release

A particular release of a Work.

A Work may have many Releases.

---

## Platform

A hardware/software platform on which a Work or Release is available.

---

## Creator

A person or organization associated with creating, publishing, or otherwise contributing to a Work.

---

## Media Asset

A visual or media resource associated with a Work or other domain object.

Examples:

* cover art
* screenshot
* poster
* trailer

---

# 4. Domain Boundary

The domain is:

> **Structured evaluation and discovery of cultural works.**

The platform is concerned with:

* works
* releases
* creators
* evaluation
* review context
* reviewer identity
* structured judgments
* disagreement
* discovery
* aggregation

The platform is not initially concerned with:

* tracking every minute of a person's behavior
* measuring mood
* social-credit systems
* psychological profiling
* determining objective artistic truth
* declaring a single objectively correct score
* replacing professional critics
* replacing storefronts

---

# 5. Domain Map

The major relationships are:

```text
User
 │
 ├── Authentication Identity
 │
 ├── Preferences
 │
 └── Reviewer Profile
          │
          └──────────────┐
                         │
                         ▼
                     Evaluation
                         │
              ┌──────────┼──────────┐
              │          │          │
           Context      Lens      Standard
              │
              │
              ▼
            Work ◄───────────────────────┐
              │                          │
       ┌──────┼──────┬──────────┐        │
       │      │      │          │        │
   Creator Release Platform   Genre     Media
       │
       │
       └──────── Work Relationships ─────┘

Evaluation
   │
   ├── Review
   ├── Judgments
   ├── Topics
   └── Observations
```

---

# 6. Work

## Meaning

A Work is the central cultural object being evaluated.

Examples:

```text
Unbeatable
Hades
The Legend of Zelda: Breath of the Wild
```

The Work is not a particular purchase, copy, installation, or session.

It is the underlying cultural object.

---

## Work identity

Every Work must have an immutable internal identity.

It should also have a human-readable public slug.

Conceptually:

```text
id: immutable internal identifier

type: GAME

slug: unbeatable

title: UNBEATABLE
```

Public identity should be based on:

```text
Work Type + Slug
```

rather than title alone.

This allows future namespaces such as:

```text
/games/unbeatable
/movies/unbeatable
```

without ambiguity.

---

# 7. Work Lifecycle

A Work can exist in several states.

Initial conceptual states:

```text
DRAFT
PUBLISHED
UNLISTED
ARCHIVED
```

A Work should not be physically deleted simply because it is no longer publicly visible.

The distinction between:

> not publicly discoverable

and:

> no longer exists

must remain explicit.

---

# 8. Work Type

Every Work has a Work Type.

Initial:

```text
GAME
```

Future:

```text
MOVIE
TV_SERIES
BOOK
ALBUM
```

Work Type determines which domain concepts are applicable.

For example:

```text
Game
 ├── Gameplay
 ├── Controls
 └── Performance

Movie
 ├── Cinematography
 ├── Acting
 └── Editing
```

The domain should not assume every Work has every possible Dimension.

---

# 9. Work Title

The canonical title belongs to Work.

Alternate titles should be modeled separately when needed rather than repeatedly modifying the canonical title.

Possible alternate-title reasons:

* regional title
* localized title
* historical title
* subtitle variation
* abbreviation

---

# 10. Work Relationships

A Work can be related to another Work.

Initial relationship vocabulary:

```text
PREQUEL
SEQUEL
SAME_SERIES
ADAPTATION
REMAKE
REMASTER
SPIRITUAL_SUCCESSOR
RELATED
```

Relationships are directional where appropriate.

For example:

```text
Work A
   └── SEQUEL OF → Work B
```

The system should be able to represent the reverse relationship when queried without requiring duplicate conceptual facts.

---

# 11. Creator

Creator represents a person or organization associated with a Work.

Examples:

* developer
* publisher
* director
* writer
* composer
* actor

Creator is deliberately broader than:

> Developer.

This allows the same domain model to support additional Work Types.

---

# 12. Creator Roles

The relationship between Creator and Work has a role.

Examples:

```text
DEVELOPER
PUBLISHER
DIRECTOR
WRITER
COMPOSER
ARTIST
ACTOR
PRODUCER
```

The applicable roles depend on Work Type.

A Creator should not be duplicated merely because they have multiple roles.

---

# 13. Release

A Release represents a particular release of a Work.

A Work can have multiple Releases.

For example:

```text
Work:
Hades

Releases:
PC — September 2020
Switch — September 2020
PlayStation — August 2021
Xbox — August 2021
```

Release information should not be flattened into Work.

---

# 14. Platform

Platform is a first-class concept.

Examples:

```text
PC
PlayStation 5
PlayStation 4
Xbox Series X|S
Xbox One
Nintendo Switch
```

A Platform may participate in:

* Releases
* Evaluation Context
* availability information

---

# 15. Region

Region represents a standardized geographic market context.

Examples:

```text
US
CA
GB
JP
EU
WORLDWIDE
```

Region should not be represented as arbitrary free text where normalization matters.

---

# 16. Genre

Genre is a reusable classification.

Examples:

```text
Action
RPG
Rhythm
Adventure
Strategy
Simulation
```

A Work can belong to multiple Genres.

Genre is classification metadata, not a judgment.

---

# 17. Media Asset

A Media Asset represents media associated with a domain object.

Examples:

```text
Cover Artwork
Screenshot
Trailer
Poster
Logo
```

Media ownership should be associated with the relevant domain object rather than embedded as arbitrary URLs throughout the system.

---

# 18. User

A User represents an account holder.

A User is an account-level identity rather than a public reviewer identity.

A User can:

* authenticate
* manage preferences
* save works
* follow works
* submit evaluations
* manage their Reviewer Profile

A User does not have to publish an evaluation.

---

# 19. Authentication Identity

Authentication identity answers:

> How does this User authenticate?

It is separate from User identity.

This permits multiple authentication mechanisms without changing the underlying User.

Potential providers include:

```text
EMAIL
GOOGLE
APPLE
DISCORD
STEAM
```

The initial implementation may support fewer.

The domain must not assume that email is the only authentication mechanism.

---

# 20. Session

A Session represents an authenticated login session.

Sessions belong to Users.

A User may have multiple concurrent sessions.

For example:

```text
User
 ├── Desktop session
 ├── Laptop session
 └── Mobile session
```

This is intentional.

The platform is not device-bound.

---

# 21. Reviewer Profile

Reviewer Profile represents the public evaluation identity of a User.

It may contain:

* display name
* public slug
* biography
* avatar
* visibility
* reviewer preferences

A Reviewer Profile belongs to a User.

A Reviewer Profile cannot exist independently of a User.

---

# 22. Public Reviewer Identity

Public evaluation pages should reference the Reviewer Profile.

They should not expose:

* email
* authentication provider
* internal account identifier
* private account metadata

The public system sees:

```text
Reviewer Profile
```

not:

```text
Authentication Account
```

---

# 23. Evaluation

Evaluation is the central domain object.

An Evaluation answers:

> What did this person think about this Work, and under what circumstances and standards did they arrive at that judgment?

Every Evaluation belongs to:

```text
one Reviewer Profile
one Work
```

A Reviewer Profile can have many Evaluations.

A Work can have many Evaluations.

---

# 24. Evaluation Identity

Every Evaluation has an immutable identity.

The identity is independent of:

* its written review
* its current publication state
* its score/judgments
* its URL

Editing an Evaluation must not create an entirely new conceptual Evaluation.

---

# 25. Evaluation Context

Evaluation Context describes how the reviewer experienced the Work.

Initial fields/concepts:

```text
Platform
Ownership / Access
Approximate Playtime
Completion Status
```

Potential future context:

```text
Release Version
Difficulty Setting
Multiplayer / Single Player
Accessibility Configuration
```

Only information that materially affects interpretation should be captured.

---

# 26. Ownership / Access

Initial conceptual values may include:

```text
OWNED
SUBSCRIPTION
BORROWED
GIFTED
REVIEW_COPY
FREE
OTHER
```

This field describes how the reviewer obtained access.

It is contextual information, not a judgment.

---

# 27. Playtime

Playtime is approximate.

The system should not imply false precision.

Possible conceptual values:

```text
LESS_THAN_1_HOUR
1–5_HOURS
5–10_HOURS
10–20_HOURS
20–50_HOURS
50+_HOURS
UNKNOWN
```

The precise representation can evolve.

The important rule is:

> The platform is not a surveillance system.

It does not require minute-by-minute tracking.

---

# 28. Completion Status

Completion describes how far the reviewer experienced the Work.

Initial conceptual vocabulary:

```text
JUST_STARTED
EARLY
SUBSTANTIAL
COMPLETED
ENDGAME
POST_GAME
ABANDONED
UNKNOWN
```

Completion is preferable to maintaining multiple overlapping booleans.

Do not create:

```text
completed = true
experiencedFullWork = true
finishedStory = true
```

as independent competing truths.

---

# 29. Evaluation Lens

Lens answers:

> What was the reviewer primarily evaluating?

Initial vocabulary:

```text
EXPERIENCE
EXECUTION
MIXED
```

The Lens does not determine the evaluation.

It describes the reviewer's approach.

---

# 30. Evaluation Standard

Standard answers:

> What standard did the reviewer use when making the judgment?

Initial vocabulary:

```text
ABSOLUTE
CONTEXTUAL
MIXED
```

These concepts must remain independent from Lens.

Example:

```text
Lens:
EXECUTION

Standard:
CONTEXTUAL
```

means the reviewer primarily evaluates execution while consciously considering the context in which the work was created.

---

# 31. Enjoyment

Enjoyment is a structured judgment about the reviewer's personal experience.

Initial vocabulary:

```text
POSITIVE
MIXED
NEGATIVE
```

Enjoyment is not the same as quality.

A reviewer can legitimately report:

```text
Enjoyment: POSITIVE
Execution: NEGATIVE
```

or:

```text
Enjoyment: NEGATIVE
Execution: POSITIVE
```

The platform must preserve this distinction.

---

# 32. Execution

Execution is a structured judgment about how successfully the Work accomplishes what it attempts to do.

Initial vocabulary:

```text
POSITIVE
MIXED
NEGATIVE
```

Execution is not automatically equivalent to technical quality.

A Work can be:

* technically polished but poorly designed
* technically rough but creatively successful
* enjoyable but mechanically weak

The domain must preserve those distinctions.

---

# 33. Dimension

A Dimension is a specific aspect of a Work that can be evaluated.

Examples for games:

```text
Gameplay
Story
Writing
Music
Art Direction
Controls
Tutorial
Level Design
Difficulty
Performance
Technical Quality
```

Dimensions are reusable.

A Dimension is not synonymous with a Review.

---

# 34. Dimension Applicability

Not every Dimension applies to every Work Type.

For example:

```text
GAME → Gameplay
MOVIE → Cinematography
BOOK → Prose
ALBUM → Production
```

The system should therefore allow Dimensions to be associated with Work Types.

This prevents the domain from becoming a giant collection of nullable fields.

---

# 35. Judgment

A Judgment evaluates one Dimension within one Evaluation.

Conceptually:

```text
Evaluation
   │
   └── Judgment
          ├── Dimension: Tutorial
          └── Value: NEGATIVE
```

Initial values:

```text
POSITIVE
MIXED
NEGATIVE
```

Judgments are structured evidence.

They are not independent reviews.

---

# 36. Topic

A Topic identifies a recurring subject discussed within an Evaluation.

Examples:

```text
Tutorial
Difficulty
Pacing
Controls
Performance
Bugs
Music
Story
```

A Topic may overlap conceptually with a Dimension, but the two concepts serve different purposes.

A Dimension asks:

> How did this aspect perform?

A Topic asks:

> What subject is this observation about?

---

# 37. Observation

An Observation is a concrete statement made by a reviewer.

Example:

```text
Topic:
Tutorial

Observation:
The tutorial introduces several systems simultaneously
without adequately explaining the basic combat loop.
```

Observations are particularly important because they provide the evidence underneath structured judgments.

---

# 38. Review

Review represents the written prose attached to an Evaluation.

It may include:

* title
* body
* excerpt
* publication date
* edit date
* source/provenance

The Review is subordinate to Evaluation conceptually.

It should never become the only representation of an Evaluation.

---

# 39. Review Provenance

A Review can originate:

```text
INTERNAL
IMPORTED
MIGRATED
```

An imported Review should preserve provenance where available.

Potential provenance information:

```text
source platform
source URL
original publication date
import date
original author identity
```

The system must never imply that imported content was originally written on this platform.

---

# 40. Evaluation Revision

An Evaluation may change over time.

A revision can affect:

* written Review
* judgments
* observations
* contextual information

The system should preserve the distinction between:

```text
Evaluation identity
```

and:

```text
current Evaluation content
```

This leaves room for historical revisions and editorial/moderation auditability.

---

# 41. Evaluation Publication State

An Evaluation has a lifecycle.

Initial states:

```text
DRAFT
PUBLISHED
UNLISTED
HIDDEN
REMOVED
```

Meaning:

### DRAFT

Visible only to the reviewer.

### PUBLISHED

Publicly available and eligible for aggregate calculations.

### UNLISTED

Accessible through a direct route but excluded from normal discovery.

### HIDDEN

Not publicly visible.

### REMOVED

No longer publicly available because of deletion/moderation/policy.

---

# 42. Aggregate Eligibility

Not every Evaluation should affect public Review Landscape calculations.

The default rule is:

> **Only eligible published evaluations contribute to public aggregates.**

Eligibility may eventually exclude:

* removed evaluations
* fraudulent evaluations
* spam
* duplicate submissions
* invalid imported records

The aggregate system must therefore query canonical evaluation state rather than blindly counting rows.

---

# 43. Duplicate Evaluations

A reviewer should generally have one active Evaluation for a Work.

If the reviewer changes their opinion, they edit/revise the existing Evaluation rather than creating multiple simultaneous evaluations.

Historical versions can remain available internally.

The platform should avoid allowing:

```text
Bob → Unbeatable → Positive
Bob → Unbeatable → Negative
Bob → Unbeatable → Mixed
```

to simultaneously distort the public aggregate.

---

# 44. Review Landscape

Review Landscape is a derived domain representation.

It summarizes the distribution of evaluations.

It may include:

```text
Enjoyment distribution
Execution distribution
Dimension distributions
Lens distribution
Standard distribution
Completion distribution
Topic frequency
Sample size
```

It is not itself a user's judgment.

---

# 45. No Canonical Global Score

The domain does not define a single:

```text
0–100 score
```

for a Work.

The platform must not imply that all evaluations can be reduced to one objectively meaningful number.

If a future feature introduces a numerical representation, that becomes a separately specified product decision.

It must not silently become the platform's canonical truth.

---

# 46. Disagreement

Disagreement is a first-class analytical concept.

Example:

```text
Execution:

Positive  42%
Mixed     21%
Negative  37%
```

This is meaningful.

A single average would conceal that distribution.

The Review Landscape should therefore preserve distributions and sample size.

---

# 47. Sample Size

Every derived aggregate should retain its sample size.

A result based on:

```text
3 evaluations
```

must not be presented as though it represents:

```text
3,000 evaluations
```

The UI may eventually use thresholds for how much detail is displayed at different sample sizes.

The domain must preserve the underlying count.

---

# 48. Genre Is Not Evaluation

Genre is descriptive metadata.

It does not determine:

* quality
* execution
* enjoyment
* consensus

For example:

```text
RPG
```

is a classification.

```text
Execution: Negative
```

is an evaluation.

They must remain separate.

---

# 49. Work Metadata vs Evaluation Data

This distinction is fundamental.

## Work metadata

Describes the Work:

* title
* creators
* genres
* releases
* platforms
* media

## Evaluation data

Describes someone's experience of the Work:

* playtime
* completion
* lens
* standard
* enjoyment
* execution
* dimensions
* observations
* review

Never put reviewer-specific information into Work metadata.

---

# 50. User Data vs Public Reviewer Data

Similarly:

## User data

* email
* authentication
* sessions
* preferences
* account status

## Reviewer data

* display name
* public profile
* evaluations
* public biography
* avatar

Do not expose account data simply because the person has a public reviewer profile.

---

# 51. Moderation

Any publicly submitted evaluation can potentially be reported.

The domain therefore requires a moderation concept separate from Evaluation.

A Report identifies:

* who reported something
* what was reported
* why
* current status
* resolution

A moderation action should not automatically destroy the underlying domain object.

---

# 52. Roles

The platform distinguishes account roles from reviewer identity.

Initial conceptual roles:

```text
USER
MODERATOR
EDITOR
ADMIN
```

A person can be a reviewer without being a moderator.

A moderator does not automatically receive a special public reviewer identity.

---

# 53. Auditability

Important administrative actions should be auditable.

Examples:

```text
Evaluation published
Evaluation hidden
Evaluation removed
Work metadata changed
Reviewer suspended
Report resolved
```

Audit history is administrative information, not public review content.

---

# 54. Saved Works

A User may save a Work.

Saved status is personal.

It does not affect public Work metadata.

Example:

```text
Bob saved Hades.
```

does not mean:

```text
Hades has been publicly endorsed.
```

---

# 55. Followed Works

A User may follow a Work.

Following can eventually drive:

* notifications
* update feeds
* new evaluation alerts
* release information

Following is private user state unless explicitly exposed.

---

# 56. User Preferences

Preferences belong to User.

Examples:

```text
Theme
Color mode
Notification preferences
Content preferences
Privacy preferences
```

Preferences should not alter canonical Work or Evaluation data.

---

# 57. Cross-Device Consistency

The domain has no concept of:

```text
Desktop User
Mobile User
Tablet User
```

There is only:

> User.

A User can access the same account from multiple devices.

The same Evaluation, Saved Work, Followed Work, and Preferences must resolve to the same persistent state.

---

# 58. URL Identity

Public objects have stable route identities.

Conceptually:

```text
Work:
 /games/unbeatable

Reviewer:
 /reviewers/example-name

Evaluation:
 /games/unbeatable/reviews/example-name
```

The exact URL structure is an application routing concern, but the domain objects must have stable identifiers independent of URL.

---

# 59. URL Rules

Internal URLs must never be stored in the domain as full localhost URLs.

The domain should store:

```text
slug
id
relationship
```

The application generates routes.

Never store:

```text
http://localhost:3000/games/unbeatable
```

as the canonical identity of a Work.

---

# 60. Internal vs External Links

The application distinguishes:

### Internal resource

Generated from domain identity.

Example:

```text
/games/unbeatable
```

### External resource

Explicit external URL.

Example:

```text
https://store.steampowered.com/...
```

An external URL may be stored when provenance or source requires it.

An internal URL should generally be generated rather than stored.

---

# 61. Responsive Presentation

Desktop and mobile are presentation contexts, not domain contexts.

The same:

```text
Work
Evaluation
Reviewer
Review Landscape
```

must be available to both.

There must not be separate mobile-domain records.

---

# 62. Domain Invariants

The following rules are mandatory.

## Work

* Every Work has one Work Type.
* Every Work has one canonical title.
* Every Work has one stable identity.
* Public Work slugs are unique within Work Type.

## User

* Every User has one immutable identity.
* Authentication identities belong to Users.
* A User may have multiple Sessions.
* A User may have zero or one Reviewer Profile.

## Reviewer

* Every Reviewer Profile belongs to exactly one User.
* A Reviewer Profile may own many Evaluations.

## Evaluation

* Every Evaluation belongs to exactly one Work.
* Every Evaluation belongs to exactly one Reviewer Profile.
* One Reviewer should not have multiple simultaneously active evaluations for the same Work.
* Only eligible published evaluations contribute to public aggregates.

## Review

* Review content belongs to an Evaluation.
* Imported Reviews preserve provenance where available.

## Judgment

* A Judgment belongs to one Evaluation.
* A Judgment applies to one Dimension.
* An Evaluation should not have duplicate active Judgments for the same Dimension.

## Work Relationships

* Relationships must connect valid Works.
* A Work must not relate to itself.
* Directional relationship semantics must remain consistent.

---

# 63. Things We Deliberately Do Not Model

The platform does not initially require persistent models for:

```text
Mood
Time of day
Sleep
Caffeine
Emotional state
Exact play session history
Keystrokes
Controller usage
Minute-by-minute activity
```

These were considered during earlier conceptual discussions but are deliberately outside the production domain model.

The platform seeks useful evaluation context without turning reviewing into behavioral surveillance.

---

# 64. Things We Should Not Add Merely Because They Sound Sophisticated

Do not create domain objects simply because they sound architecturally impressive.

Examples:

```text
EvaluationContextAggregate
ReviewerPsychology
ConsensusScore
QualityIndex
EmotionalProfile
AttentionProfile
ExperienceFingerprint
```

unless a real product requirement eventually establishes them.

The domain model should represent meaningful concepts, not architectural ornament.

---

# 65. Domain vs Implementation

The following are implementation concerns rather than domain concepts:

```text
Prisma
PostgreSQL
Next.js
React
Docker
Redis
API routes
Server Actions
React components
CSS
Tailwind
```

They must implement this domain rather than alter its meaning.

---

# 66. Domain vs UI

The following are presentation decisions:

```text
card
table
chart
badge
button
color
font
spacing
mobile layout
desktop layout
```

A Work does not become a different Work because its UI representation changes.

An Evaluation does not become a different Evaluation because it is displayed in a card on mobile instead of a two-column layout on desktop.

---

# 67. Domain vs Aggregation

The domain contains canonical evaluations.

Aggregation produces derived information.

```text
Canonical:

Evaluation
    ↓
Judgment
    ↓
Topic
    ↓
Review


Derived:

Review Landscape
    ↓
Distribution
    ↓
Disagreement
    ↓
Recurring Topics
```

The derived layer must always be reproducible from canonical data.

---

# 68. Domain vs Search

Search indexes are derived representations.

The searchable representation of a Work may include:

* title
* alternate titles
* creators
* genres
* review text
* topics

But search indexes do not become the canonical Work record.

---

# 69. Domain vs External Data

External services may provide:

* game metadata
* artwork
* release dates
* platform information
* external reviews

Imported information must be distinguishable from internally authored information.

External data should never silently overwrite a human evaluation.

---

# 70. Data Ownership

Conceptually:

```text
Work metadata
→ Platform / editorial domain

Evaluation
→ Reviewer

Review
→ Reviewer

Reviewer Profile
→ User

Aggregate
→ Platform-derived

External source metadata
→ External provenance
```

This distinction becomes important for editing, moderation, attribution, and deletion.

---

# 71. Production Data Lifecycle

The expected lifecycle is:

```text
External / Editorial Work
          ↓
        Work
          ↓
      Discovery
          ↓
       Reviewer
          ↓
      Evaluation
          ↓
       Review
          ↓
    Publication
          ↓
     Aggregation
          ↓
   Review Landscape
          ↓
     Discovery
```

The system therefore creates a feedback loop:

```text
Discovery
   ↓
Evaluation
   ↓
Evidence
   ↓
Aggregation
   ↓
Better Discovery
```

This is a central product mechanism.

---

# 72. Future Expansion to Movies

The model should support:

```text
WorkType = MOVIE
```

without redesigning:

* User
* Reviewer
* Evaluation
* Review
* Lens
* Standard
* Judgment
* Topic
* Aggregation

Only Work-specific concepts and applicable Dimensions should change.

For example:

```text
GAME
 ├── Gameplay
 ├── Controls
 └── Level Design

MOVIE
 ├── Acting
 ├── Cinematography
 └── Editing
```

The evaluation engine remains conceptually the same.

---

# 73. Future Expansion to Other Media

The same principle applies to:

```text
BOOK
ALBUM
TV_SERIES
```

The platform should not become:

> A game review database that later happens to contain movies.

It should remain:

> A structured evaluation platform whose first major Work Type is games.

That distinction is architectural.

---

# 74. Schema Design Rule

When converting this domain model into Prisma:

> **Do not create a database table for every noun in this document.**

Some concepts are:

* entities
* attributes
* enumerations
* value-like concepts
* relationships
* derived concepts

The Prisma model must reflect their actual persistence requirements.

---

# 75. Reconciliation Rule for the Existing Prisma Model

The existing Prisma model is an implementation draft.

It must be reconciled against this domain model.

For every existing model, classify it as:

```text
KEEP
RENAME
MERGE
SPLIT
MOVE
REMOVE
DEFER
```

For every missing domain concept, classify it as:

```text
ADD NOW
ADD LATER
INTENTIONALLY OMIT
```

Do not preserve an existing model simply because code already exists for it.

Do not delete a model simply because it is not required for the first screen.

The question is:

> Does this model correctly represent the production domain?

---

# 76. Reconciliation Questions

Before finalizing the Prisma model, answer:

1. Does every persistent model correspond to a meaningful domain concept?
2. Does every important domain concept have an appropriate persistence representation?
3. Are account identity and reviewer identity separated?
4. Are Work and Evaluation clearly separated?
5. Are Review and Evaluation clearly separated?
6. Are Lens and Standard independent?
7. Are Enjoyment and Execution independent?
8. Are Dimensions extensible?
9. Are Topics distinct from Dimensions?
10. Is completion represented without redundant booleans?
11. Are Releases distinct from Works?
12. Are Creators reusable?
13. Are Platforms reusable?
14. Is provenance preserved?
15. Is moderation possible without destructive deletion?
16. Can one User use multiple devices?
17. Can mobile and desktop access exactly the same domain objects?
18. Can aggregates be reconstructed from canonical evaluations?
19. Are internal URLs independent of deployment hostnames?
20. Can the system eventually support movies without rebuilding the evaluation system?

If the answer to any of these is no, the schema is not finished.

---

# 77. Domain Model North Star

The entire model can be reduced to one sentence:

> **A person experiences a cultural Work, evaluates it under a stated context, lens, and standard, records structured judgments and observations, and optionally expresses those judgments through written Review content; the platform preserves those individual evaluations and derives aggregate understanding without pretending that one score represents the whole truth.**

Everything else exists to support that model.
