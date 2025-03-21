# Gestae
**An Imperative, Resource-Based, Event-Driven RESTful Web Framework**

## Why Gestae?

Most popular frameworks like Express.js, Next.js, and Nest.js use explicit, path-first, URI declaration - missing the point of HTTP and REST by treating endpoints as mere function calls rather than as direct representations of resources. Gestae takes a resource-first approach, making a resource in a URI a first-class object that you explicitly define. This design reverses the traditional approach by letting the inherent relationships between entities dictate the URI structure. Gestae is also event-driven, with the traversal of namespaces, processing of resources, and execution of tasks emitting events while the request is being processed. 

The event framework in Gestae is asyn and leverages regular expressions and filters, allowing developers to intercept events at any level of granualrity desired. This coupled with a simple plugin framework, allows third-party developers to easily provide add-on services to Gesate.

Combining first-class resources, events and a plugin framework allows developers to simply declare namespaces, resources, and tasks in-code or with decorators, bind those resources to data using you prefered ORM plugin, and starting the server. Resources are resolved as part of the framework follow well-accepted REST patters for GET, PUT, POST, PATCH, DELETE, HEAD, and OPTIONS. The significantly reduces boiler-plate code of mapping JSON payloads to ORM and transforming requests.

## Hello Wrold!
``` 
```
