# Gestae
**An Imperative, Resource-Based, Event-Driven RESTful Framework**

## Why Gestae?

Traditional API gateways, business process automation (BPA) platforms, and AI-driven orchestration tools fall short in scalability, context-awareness, and event coupling. API gateways lack robust orchestration capabilities, while classical BPM/BPA systems struggle with granular control and real-time responsiveness. Even AI-powered bots fail to contextually link business services, events, and processes with the flexibility required for enterprise-scale automation.

**Gestae** is designed to fill this gap by bringing together:

* **Resource-first modeling**, where namespaces, resources, and tasks are the core concepts—not paths and function signatures.
* **Imperative execution**, ensuring that APIs are designed through code and decorators, not declarative configurations.
* **Event-driven architecture**, where every interaction with namespaces, resources, and tasks operates through events.

## Resource-First Architecture
Unlike traditional REST frameworks that revolve around paths and services, Gestae treats resources as first-class objects. Resources exist independent of their URL representation, focusing instead on hierarchical, object-oriented, and runtime-defined structures.

This means that:

* **Resources exist as runtime objects**, not predefined routes.
* **Relationships** between resources are dynamically structured, rather than assumed through URL nesting.
* Tasks are **intrinsic to resources**, allowing them to execute domain-specific business logic imperatively.


## Imperative by Design

Gestae is built around imperative programming principles, where:

* Developers explicitly **define resources**, relationships, and tasks using decorators.
* APIs are **designed through code**, not static configuration files.
* Resources and tasks are **instantiated and resolved dynamically at runtime**, enabling flexible and scalable composition.

This approach ensures:

* **Explicit control over API logic**, avoiding hidden behaviors.
* **Modular composability**, where resources and tasks can be reused.
* **Predictable execution flows**, making debugging and testing easier.

Gestae doesn’t force developers to conform to predefined URI signatures—instead, it lets them build APIs around the domain model, making relationships between resources explicit and enforceable.

## Event-Driven Interactions

At its core, Gestae is an event-driven framework. All operations—whether interacting with resources, namespaces, or tasks—are performed via events rather than direct function calls or RPC-style service endpoints.

* **Resources trigger and listen** for events rather than relying on synchronous RPC calls.
* Tasks are executed through an **event system**, allowing both synchronous and asynchronous workflows.
* Events allow **loose coupling between services**, making APIs more resilient and scalable.

This event-based model removes unnecessary tight coupling between API endpoints, making it easier to integrate with message queues, async job processing, and event-driven microservices.

## Strict RESTful Enforcement
To ensure interoperability and maintain a clear separation of concerns, Gestae enforces strict RESTful constraints:

* **Resources** only support: GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS.
* **Task**s are restricted to GET (status checks) and POST (execution triggers).

This approach ensures that:

* **Resources handle CRUD operations**, keeping them stateless and consistent.
* **Tasks handle business logic execution**, allowing message-driven workflows to be properly modeled.

By enforcing clear separation between resources and tasks, Gestae ensures that API designs remain scalable, maintainable, and predictable—without falling into RPC-over-REST anti-patterns.

## Task-Based Process Execution
Business APIs are often task-driven, where resources must perform operations that are non-idempotent and asynchronous. Unlike simple CRUD APIs, business processes:

* **Are often message-based**, requiring workflows that involve approvals, state transitions, and cross-service dependencies.
* **Aren’t always idempotent**, meaning executing the same request twice may yield different outcomes.
* **Require orchestration**, since they involve multiple steps and dependencies that cannot be handled as atomic operations.

To accommodate this, Gestae allows:

* **Tasks to be explicitly defined on resources**, mapping business processes to API interactions.
* **Tasks to execute asynchronously or synchronously**, depending on the use case.
* **Verbs in URIs for task execution**, such as POST /business/company/:companyId/employee/:employeeId/terminate, while still adhering to REST constraints.

Since business processes do not fit neatly into a pure event-driven model, Gestae bridges the gap between RESTful API design and task-based workflows, making process automation more scalable and maintainable.