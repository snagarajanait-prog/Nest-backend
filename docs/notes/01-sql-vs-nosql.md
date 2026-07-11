# MySQL (SQL) vs MongoDB (NoSQL)

## The one-line difference
- **SQL (MySQL, PostgreSQL):** data lives in **tables** with a fixed **schema** (columns + types). Relationships via **foreign keys** + **JOINs**.
- **NoSQL document DB (MongoDB):** data lives in **collections** of **documents** (JSON/BSON). Schema is **flexible** — each document can differ. Related data is often **embedded** or referenced.

## Vocabulary map
| SQL (MySQL) | MongoDB |
|-------------|---------|
| Database | Database |
| Table | Collection |
| Row / record | Document (a JSON-like object) |
| Column | Field |
| Primary key | `_id` (ObjectId, auto-generated) |
| JOIN | `$lookup` (aggregation) or embedding |
| Schema (rigid) | Schema (flexible; enforced in app via Mongoose) |

## When to use which
- **Use SQL** when data is highly relational, you need multi-row **ACID transactions**, and the schema is stable (banking, orders + line items, reporting with complex JOINs).
- **Use MongoDB** when the shape of data varies or evolves fast, you want to store a whole object together (a product with its images/specs), and you scale by **horizontal sharding**. Great for content, catalogs, user profiles, event logs.

## Modelling: embed vs reference
- **Embed** (store child inside parent) when the child is always read with the parent and doesn't grow unbounded — e.g. a product's `images: []`.
- **Reference** (store an ObjectId pointing to another document) when the child is large, shared, or queried on its own — e.g. a user's `role` → `roles` collection (what we did in this project).

## Trade-offs to remember
- MongoDB gives flexibility but **you** are now responsible for consistency of shape → we enforce it with **Mongoose schemas** + **class-validator DTOs**.
- SQL gives strong guarantees but migrations are heavier and horizontal scaling is harder.
- MongoDB **does** support multi-document transactions (since v4.0) but they cost more; the common pattern is to design so you rarely need them (embed related data).

## In this project
We use **MongoDB via Mongoose**. See `src/modules/*/schemas/*.schema.ts` for how a "table + columns" idea becomes a Mongoose schema, and how `user.role` references the `roles` collection instead of a SQL foreign key.
