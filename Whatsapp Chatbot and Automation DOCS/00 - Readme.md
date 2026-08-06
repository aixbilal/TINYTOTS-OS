# TinyTots WhatsApp System Documentation

> **Project:** TinyTots Omnichannel OS  
> **Module:** WhatsApp Business Platform  
> **Status:** 🚧 In Development (Hybrid Migration)  
> **Version:** 2.0 (Hybrid Architecture)  
> **Last Updated:** August 2026

---

# Overview

This documentation contains everything related to the TinyTots WhatsApp ecosystem.

The purpose of this documentation is to record:

- Why the WhatsApp system exists.
- How it integrates with the TinyTots ecosystem.
- How the original system worked.
- Why the architecture changed.
- The migration strategy.
- Meta Business Agent configuration.
- n8n automation workflows.
- API specifications.
- Security decisions.
- Testing procedures.
- Future improvements.

This folder serves as the **single source of truth** for all WhatsApp-related architecture, implementation, and operational documentation.

---

# Project Context

TinyTots is an omnichannel retail platform consisting of three major customer touchpoints.

- 🌐 Website (Next.js)
- 💻 Electron POS
- 💬 WhatsApp

All three communicate with a shared backend powered by Supabase.

The objective is to provide customers with a consistent shopping and support experience across every platform.

---

# Current Project Status

| Module | Status |
|----------|----------|
| Electron POS | ✅ Feature Complete (UI redesign pending) |
| Website | 🚧 Almost Complete (Premium redesign pending) |
| Offline Cache | 🚧 Currently under development |
| WhatsApp System | 🚧 Hybrid migration in progress |

Current development priority:

1. Finish Offline Cache
2. Build Hybrid WhatsApp System
3. Website Premium Redesign
4. Electron POS Premium Redesign

---

# Original WhatsApp Vision

The original plan was to build a fully custom WhatsApp chatbot capable of:

- Understanding customer messages
- Maintaining conversation state
- Product searching
- Interactive ordering
- Cart management
- Checkout
- Address collection
- Payment flow
- Order tracking
- Customer support

The chatbot would implement its own conversational state machine inside the Next.js application.

---

# Why the Architecture Changed

As development progressed, it became clear that implementing an entire shopping experience inside WhatsApp significantly increased system complexity.

Major concerns included:

- Large conversational state machines
- Intent parsing
- Session persistence
- Quiz ordering logic
- Duplicate checkout logic
- Increased maintenance
- Higher testing effort
- Technical debt

After evaluating the long-term maintenance cost, the project shifted toward a hybrid architecture.

---

# Current Architecture Strategy

The WhatsApp system is now designed around three independent responsibilities.

## 1. Website

Responsible for:

- Product browsing
- Cart
- Checkout
- Payments
- Customer account
- Order management

---

## 2. Meta Business Agent

Responsible for:

- Natural language conversations
- Frequently asked questions
- Product discovery
- Product recommendations
- Store information
- Size guidance
- Promotions
- Order tracking
- Redirecting customers to the website

The Business Agent **does not create orders**.

---

## 3. n8n Automation

Responsible for:

- Order confirmations
- Shipping updates
- Delivery notifications
- OTP messages
- Welcome messages
- Promotional campaigns
- Birthday campaigns
- Low stock alerts
- Admin notifications
- Scheduled workflows

n8n performs automation only.

It does not replace the conversational AI.

---

# High-Level Architecture

```
Customer
      │
      ▼
WhatsApp
      │
      ▼
Meta Business Agent
      │
      ▼
Next.js Secure APIs
      │
      ▼
Supabase Database
      ▲
      │
n8n Automation
```

---

# Documentation Structure

## 00 - README

General overview of the WhatsApp documentation.

---

## 01 - Vision

Defines:

- Product vision
- Goals
- Scope

---

## 02 - Current System

Documents:

- Existing implementation
- Repository audit
- Existing APIs
- Current flow

---

## 03 - Hybrid Architecture

Documents:

- Target architecture
- Meta Business Agent
- n8n architecture
- API layer
- System diagrams

---

## 04 - Migration

Documents:

- Migration plan
- Files to keep
- Files to refactor
- Files to delete
- Rollback strategy

---

## 05 - Business Agent

Contains:

- System prompt
- Capabilities
- Restrictions
- Knowledge sources
- Human escalation

---

## 06 - n8n

Contains:

- Workflow documentation
- Order automation
- Shipping automation
- Promotions
- Retry logic
- Notification flows

---

## 07 - APIs

Contains complete documentation for every WhatsApp-related endpoint.

---

## 08 - Security

Documents:

- Authentication
- Webhook verification
- Rate limiting
- Secret management

---

## 09 - Testing

Contains:

- Test cases
- Manual testing
- Acceptance checklist
- Edge cases

---

## 10 - Roadmap

Contains:

- Development roadmap
- Milestones
- Future improvements

---

## 11 - Reports

Contains:

- Architecture reports
- Migration reports
- Lessons learned
- Final reviews

---

# Design Principles

The WhatsApp system follows these principles.

- Keep business logic outside conversations.
- Keep checkout on the website.
- Keep automation inside n8n.
- Keep customer conversations inside Meta Business Agent.
- Keep Supabase as the single source of truth.
- Keep APIs lightweight and secure.
- Avoid duplicated logic.
- Minimize maintenance effort.
- Prefer modular architecture over monolithic workflows.

---

# Long-Term Objectives

The WhatsApp platform should:

- Reduce customer support workload.
- Improve customer experience.
- Provide accurate real-time information.
- Deliver automated transactional notifications.
- Integrate seamlessly with the TinyTots ecosystem.
- Scale without introducing unnecessary complexity.

---

# Document Maintenance

Whenever the WhatsApp system changes:

- Update the relevant documentation.
- Record major architectural decisions.
- Document new APIs.
- Document new workflows.
- Update migration status.
- Update testing procedures.

Documentation should evolve together with the implementation.

---

# Author

Project: TinyTots Omnichannel OS

Documentation Owner: TinyTots Development Team

This documentation is intended to serve as the long-term technical reference for the WhatsApp integration within TinyTots.