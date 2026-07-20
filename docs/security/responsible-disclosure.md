# Responsible disclosure

We want to hear about security problems in HoodStack, and we would rather hear
about them from you than from an incident.

## How to report

- Email **security@hoodstack.io**, or
- Use GitHub's private vulnerability reporting on the affected repository.

Do not open a public issue for a security problem. Do not disclose publicly
before a fix is available.

Include what you can:

- a description of the issue and where it lives
- reproduction steps, ideally minimal
- what an attacker gains
- preconditions - network position, role, configuration
- any proof-of-concept code

Reports in any language are fine. A rough report sent promptly is worth more
than a polished one sent late.

## What to expect

HoodStack is a small, pre-release project. We will not promise a response time
we cannot reliably meet, so instead of an SLA, here is our commitment:

- We acknowledge reports as quickly as we are able.
- We tell you honestly whether we consider it in scope, and why.
- We keep you updated as we work on a fix.
- We tell you when it is fixed, and coordinate on timing before any public
  disclosure.
- We credit you in the changelog and advisory unless you prefer otherwise.

There is **no funded bug bounty at this time.** We will not imply otherwise to
attract reports. If a bounty is established, this document will say so.

## Safe harbour

If you make a good-faith effort to follow this policy, we will not pursue or
support legal action against you for your research.

Good faith means:

- you only access data that is yours, or test accounts you created
- you stop as soon as you have confirmed a vulnerability, and do not pivot
  further into systems or data
- you do not exfiltrate, retain, or share data belonging to others
- you do not degrade service for others - no volumetric denial of service, no
  spam, no destructive testing against shared infrastructure
- you give us reasonable opportunity to fix before disclosing
- you do not use a finding for extortion

Test against testnet. If a finding genuinely requires mainnet to demonstrate,
tell us and we will work out how to reproduce it safely.

## Scope

**In scope:** the HoodStack platform application, the HoodStack API, published
`@hoodstack/*` packages, the CLI, and this repository.

**Out of scope:**

- Robinhood Chain itself, and the shared public RPC, sequencer, faucet, and
  explorer endpoints - HoodStack does not operate these
- third-party providers behind our adapters; report those to the provider, and
  tell us so we can mitigate
- findings requiring a compromised developer machine or a malicious browser
  extension
- missing hardening on endpoints documented as unimplemented - every module is
  currently `preview`, so please focus on what is actually built
- social engineering of staff or users
- physical attacks
- volumetric denial of service
- automated scanner output with no demonstrated impact

## A note on the current state

HoodStack has not been audited and is not production-ready. Findings that amount
to "this is incomplete" are expected and documented rather than secret. The
findings we most want are the ones where something we _claim_ to do - tenant
isolation, chain validation, redaction, fail-closed gating, non-custody - does
not actually hold.
