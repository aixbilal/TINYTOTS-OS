# Migration Plan

> Version: 2.0 (Hybrid Architecture Migration)

---

# Purpose

This document defines the migration strategy for transitioning the TinyTots WhatsApp platform from a custom conversational chatbot to a Hybrid Architecture using Meta Business Agent, n8n, Next.js APIs, and Supabase.

The migration prioritizes reducing complexity, improving maintainability, and separating responsibilities across specialized systems.

---

# Migration Objectives

- Eliminate the custom conversational state machine.
- Replace manual intent parsing with Meta Business Agent.
- Move automation workflows to n8n.
- Keep Next.js focused on secure business APIs.
- Retain Supabase as the Single Source of Truth.
- Keep website checkout as the only purchasing channel.

---

# Current Architecture

Customer

↓

WhatsApp

↓

Webhook

↓

Custom Chatbot

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

---

# Target Architecture

Customer

↓

WhatsApp

↓

Meta Business Agent

↓

Secure Next.js APIs

↓

Supabase

↓

n8n Automation

↓

WhatsApp Templates

---

# Migration Phases

## Phase 1

Complete Offline Cache

Status: Current Development

---

## Phase 2

Prepare WhatsApp documentation.

Complete repository audit.

Identify deprecated components.

---

## Phase 3

Create secure APIs.

Inventory

Order Status

Promotions

Store Information

---

## Phase 4

Configure Meta Business Agent.

Train knowledge base.

Connect APIs.

Test conversations.

---

## Phase 5

Build n8n workflows.

Order confirmation

Shipping

OTP

Promotions

Admin notifications

---

## Phase 6

Remove deprecated chatbot components.

Verify application builds.

Regression testing.

---

## Phase 7

Production rollout.

Monitor logs.

Monitor workflows.

Monitor Business Agent.

---

# Success Criteria

Migration is complete when:

- No custom conversational logic remains.
- Meta Business Agent handles conversations.
- n8n handles automation.
- Website handles checkout.
- APIs remain lightweight.
- Customers experience uninterrupted service.