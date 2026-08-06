# Existing Architecture

> Version: 1.0 (Pre-Hybrid Architecture)

---

# Purpose

This document describes the existing WhatsApp architecture before the migration to the Hybrid Meta Business Agent + n8n architecture.

It serves as historical documentation and a baseline for migration planning.

---

# Overview

The current implementation is based on a custom-built conversational chatbot developed inside the TinyTots codebase.

Most conversational logic, routing, and business logic are handled inside the Next.js application.

The application is responsible for:

- Receiving webhook events
- Parsing customer messages
- Detecting customer intent
- Managing conversation state
- Searching products
- Creating chat-based orders
- Tracking orders
- Sending WhatsApp responses

This means the application acts as both the AI layer and the business logic layer.

---

# High-Level Architecture

```
Customer

↓

WhatsApp

↓

Webhook

↓

Next.js

↓

Intent Parser

↓

Conversation State Machine

↓

Business Logic

↓

Supabase

↓

Response

↓

WhatsApp
```

---

# Major Components

## Webhook Layer

Receives incoming WhatsApp messages.

Responsibilities:

- Verify Meta webhook
- Parse payload
- Forward messages to chatbot

---

## Intent Detection

Attempts to understand customer requests using:

- Regex
- Keyword matching
- Switch statements

Example:

- order
- stock
- buy
- price
- hello

---

## Conversation State Machine

Maintains customer conversation progress.

Example:

Greeting

↓

Search Product

↓

Ask Size

↓

Ask Quantity

↓

Ask Address

↓

Confirm

↓

Create Order

---

## Business Logic

The chatbot directly performs:

- Product lookup
- Stock lookup
- Order creation
- Order updates
- Customer session handling

---

## Database Layer

The chatbot communicates directly with Supabase.

Operations include:

- Product search
- Stock queries
- Order creation
- Session persistence

---

# Current Advantages

- Full control over chatbot behavior.
- Fully customizable conversation flow.
- Direct integration with business logic.

---

# Current Limitations

- Large conversational state machine.
- High maintenance cost.
- Duplicate checkout logic.
- Complex testing.
- Tight coupling between conversation and business logic.
- Difficult to scale.