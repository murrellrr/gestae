# Gestae
**An Imperative, Resource-Based, Event-Driven RESTful Framework**

## Why Gestae?

Traditional API gateways, business process automation (BPA) platforms, and AI-driven orchestration tools fall short in scalability, context-awareness, and event coupling. API gateways lack robust orchestration capabilities, while classical BPM/BPA systems struggle with granular control and real-time responsiveness. Even AI-powered bots fail to contextually link business services, events, and processes with the flexibility required for enterprise-scale automation.

**Gestae** is designed to fill this gap by bringing together:

* Resource-first modeling (no more treating REST like RPC)
* Imperative execution (code-first, no bloated workflow engines)
* Event-driven interactions (tasks and resources trigger events, not hardcoded services)

## Resource-First Architecture
Unlike traditional REST frameworks that revolve around paths and services, Gestae treats resources as first-class objects. Resources exist independent of their URL representation, focusing instead on hierarchical, object-oriented, and runtime-defined structures.

This means that:

* Resources are not defined by URI paths but by their relationships.
* They maintain state and interact via event-driven operations.
* Instead of manually managing HTTP routes, Gestae dynamically registers and resolves resources at runtime.


## Imperative by Design

Gestae is built with imperative programming principles. Developers explicitly declare resources and tasks using decorators, allowing fine-grained control over execution flows.

Instead of relying on declarative YAML/JSON configs or visual workflow editors, all interactions are defined in TypeScript code, ensuring:


* **Explicitness**: No hidden magic—everything is controlled in code.
* **Composability**: Resources and tasks can be structured in a modular fashion.
* **Predictability**: The execution flow is deterministic and testable.

## Event-Driven Interactions

At its core, Gestae is an event-driven framework. All operations—whether interacting with resources, namespaces, or tasks—are performed via events rather than direct function calls or RPC-style service endpoints.

This decouples business logic from HTTP transport, enabling:

* Loose coupling between services and event-driven subscribers.
* Flexible integration with external event buses and messaging systems.
* Seamless async/sync execution models for different business processes.

## Enforcing RESTful Best Practices
Gestae strictly enforces RESTful principles by:

* **Forcing Resources to support**: GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS.
* **Limiting Tasks to only**: GET and POST.

This ensures maximum interoperability with HTTP standards while still allowing imperative task execution. Tasks are modeled as business processes, where:

* **GET** retrieves task status (useful for async jobs).
* **POST** triggers task execution (asynchronous or synchronous, depending on the process).
By enforcing a clear distinction between resources and tasks, Gestae ensures clean API design, avoiding common anti-patterns like RPC-over-REST or task-specific resource endpoints.

## Task-Based Process Execution
Business processes do not fit neatly into REST because they are:

Non-idempotent (two identical inputs do not always yield the same result).
Stateful and message-driven (involving queues, approvals, and multi-step operations).
Gestae embraces Task-Based Process Execution, allowing business resources to perform tasks through an event-driven, task-oriented API model.

Since process APIs:

* **Are not atomic** like CRUD operations.
* **Require orchestration** across multiple services.
* **Often include synchronous and asynchronous operations**.

Gestae allows verbs in URIs (i.e., POST /business/company/:companyId/employee/:employeeId/terminate) to reflect the real-world complexity of business processes.

This bridges the gap between RESTful design and enterprise process automation, ensuring:

* Consistency in API structure while supporting task-based workflows.
* Event-driven execution models where processes emit events rather than forcing blocking calls.
* Scalability for workflows involving multiple services, approvals, and human-in-the-loop processes.