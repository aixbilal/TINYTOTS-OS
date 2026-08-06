# Test Environment

> Version: 1.0

---

# Purpose

This document defines the testing environments used throughout the TinyTots WhatsApp platform development lifecycle.

It ensures that all developers, testers, and future contributors use consistent environments, credentials, and test data without affecting production systems.

---

# Environment Overview

The TinyTots platform consists of multiple interconnected services:

- Next.js Website
- Electron POS
- Supabase Backend
- Meta Business Platform
- WhatsApp Cloud API
- Meta Business Agent
- n8n Automation
- GitHub Repository

Each service may have separate Development and Production configurations.

---

# Environment Types

## Development

Purpose

Local development and feature implementation.

Components

- Local Next.js server
- Local Electron POS
- Development Supabase Project
- Development n8n Instance
- Test WhatsApp Number
- Test Meta App

Safe for:

- Feature development
- Debugging
- API testing

---

## Staging (Optional)

Purpose

Production-like environment for integration testing.

Components

- Deployed Website
- Staging Database
- Staging n8n
- Test WhatsApp Number

Safe for:

- End-to-end testing
- Performance validation
- QA testing

---

## Production

Purpose

Live customer environment.

Components

- Production Website
- Production Supabase
- Production n8n
- Production WhatsApp Business Account
- Live Business Agent

Only production-approved changes should be deployed here.

---

# Service Configuration

## Website

Environment

Development

Example

http://localhost:3000

Production

https://tinytots.pk

---

## Electron POS

Development

Local Electron Build

Production

Released Installer

---

## Supabase

Development Project

Used for testing only.

Production Project

Contains live customer and order data.

Never mix environments.

---

## Meta Business Platform

Development

Test Business App

Sandbox WhatsApp Number

Production

Verified Business Account

Official WhatsApp Number

---

## n8n

Development

Local Docker Instance

or

Local Desktop Instance

Production

Cloud or Self-hosted Server

---

# Test Accounts

## Customer Account

Purpose

General customer testing.

Used For

- Login
- Orders
- Order Tracking
- Notifications

---

## Cashier Account

Purpose

Electron POS testing.

Used For

- Sales
- Receipts
- Inventory Updates

---

## Administrator Account

Purpose

System management.

Used For

- Dashboard
- Monitoring
- Configuration

---

# Test Data

Maintain reusable testing data.

Examples

Products

- Denim Trouser
- Kids Hoodie
- Cotton Shirt

Orders

- Pending
- Confirmed
- Packed
- Dispatched
- Delivered
- Cancelled

Customers

- Existing Customer
- New Customer

Phone Numbers

Use dedicated testing numbers whenever possible.

---

# API Testing

Recommended Tools

- Postman
- Bruno
- Insomnia
- curl

Verify

- Authentication
- Response Time
- Error Handling
- Invalid Requests
- Edge Cases

---

# WhatsApp Testing

Verify

- Greeting
- Product Search
- Inventory Lookup
- Order Tracking
- Website Redirect
- Human Escalation

Never test using customer phone numbers.

---

# n8n Testing

Verify

- Workflow Trigger
- Data Processing
- API Calls
- Template Delivery
- Retry Logic
- Failure Handling

---

# Deployment Validation

Before every deployment verify:

- Environment Variables
- Database Connection
- API Authentication
- Business Agent Connection
- n8n Credentials
- WhatsApp Integration

---

# Environment Variables

Each environment must have its own configuration.

Examples

Development

.env.local

Production

Platform Secret Manager

Never copy production secrets into development.

---

# Test Data Cleanup

After testing:

- Remove temporary orders.
- Remove temporary products.
- Clear test workflows.
- Archive logs if required.
- Verify no test data remains in production.

---

# Ownership

Environment Owner

Development Team

Review Frequency

Before every major release

Document Version

1.0