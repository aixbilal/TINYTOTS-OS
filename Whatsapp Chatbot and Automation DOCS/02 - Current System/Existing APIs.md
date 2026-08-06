# Existing APIs

---

# Purpose

This document describes the APIs currently used by the WhatsApp integration.

---

# Current API Groups

## Webhook

Purpose:

Receive incoming WhatsApp events.

Responsibilities:

- Signature verification
- Payload parsing
- Event processing

---

## Inventory

Current usage:

Product search

Stock lookup

Availability

---

## Orders

Current usage:

Order lookup

Order creation

Order updates

Tracking

---

## Customer

Current usage:

Customer lookup

Phone verification

Profile retrieval

---

## Authentication

Current usage:

Webhook verification

Meta verification

Bearer authentication

---

# Current Data Flow

WhatsApp

↓

Webhook

↓

Next.js

↓

Supabase

↓

Response

---

# Current Issues

Current APIs mix:

Conversation

Business logic

Database logic

The long-term goal is to separate these responsibilities into lightweight APIs.