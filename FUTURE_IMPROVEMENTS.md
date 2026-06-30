# Future Architecture & Structure Improvements

This document tracks planned technical debt and structural improvements to be implemented in the `RixiApp` codebase. 

## 1. Extract Business Logic into `controllers/` (Highest Priority)
Currently, the `routes/` directory handles both routing definitions and business logic (database interactions, data processing).
- **Goal:** Create a `controllers/` directory to hold all business logic.
- **Benefit:** Separation of concerns. Routes become extremely thin, merely mapping HTTP endpoints to controller functions. This significantly improves readability, maintainability, and makes the code testable.

## 2. Implement an Async Error Handler Wrapper
Most routes currently use repetitive `try { ... } catch (err) { ... }` blocks to catch and forward errors.
- **Goal:** Implement an `asyncHandler` middleware utility that automatically catches Promise rejections and forwards them to Express's global error handler.
- **Benefit:** Eliminates boilerplate code across all route/controller files, ensuring uniform error handling without writing `try/catch` repeatedly.

## 3. Implement a Request Validation Layer
Incoming request bodies are currently validated manually using inline `if` statements.
- **Goal:** Introduce a dedicated validation library like **Zod** or **Joi** in a new `validations/` or `schemas/` directory.
- **Benefit:** Allows us to define strict schemas for incoming payloads and validate them via middleware before they even reach the controller logic, preventing bad data from entering the application flow.

## 4. Standardize API Responses
- **Goal:** Create a standardized response utility (e.g., `successResponse`, `errorResponse`) to ensure all API endpoints return JSON in a consistent shape.
- **Benefit:** Makes the frontend integration much smoother as the client can always expect a predictable response structure.
