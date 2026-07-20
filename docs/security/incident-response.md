# Incident response

Public outline of how HoodStack responds to a security incident. Contact trees,
runbook specifics, infrastructure detail, and past incident records are
operational and are not published.

## What counts as an incident

Any of the following is an incident until proven otherwise:

- suspected or confirmed unauthorized access to systems or data
- credential exposure - API keys, provider credentials, encryption keys
- cross-tenant data exposure
- unauthorized transaction submission or sponsorship
- gas sponsorship drain beyond configured policy
- a vulnerability report indicating active exploitation
- integrity loss in audit logs or the credit ledger

Ambiguity resolves toward "incident". The cost of over-declaring is an hour of
work; the cost of under-declaring is discovering the problem later from someone
else.

## Severity

| Level    | Meaning                                                    | Examples                                                          |
| -------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| **SEV1** | Active exploitation, fund loss, or cross-tenant exposure   | Sponsorship drain in progress; one project reading another's data |
| **SEV2** | Confirmed exploitable vulnerability, no known exploitation | Auth bypass found in review; leaked key with no observed use      |
| **SEV3** | Security-relevant defect, bounded impact                   | Missing rate limit; over-verbose error                            |
| **SEV4** | Hardening gap                                              | Missing header; dependency advisory with no reachable path        |

## Response phases

### 1. Declare

Anyone may declare. Declaring is explicitly not a judgement about whether the
declarer was right. An incident lead is assigned and owns coordination and
decisions; the lead does not do all the work.

### 2. Contain

Stop ongoing harm before understanding it fully. Diagnosis can wait; an active
drain cannot.

Containment tools built for this purpose:

- per-project sponsorship kill switch
- API key revocation
- session revocation, individually or in bulk
- feature flags to disable an affected module
- rate-limit tightening at the edge
- provider credential rotation

Containment actions are themselves audited.

### 3. Assess

Determine what happened, what was accessed, which tenants are affected, whether
it is ongoing, and whether funds moved. Preserve evidence - logs, database
state, provider records - before remediation destroys it.

### 4. Remediate

Fix the cause, not the symptom. Rotate anything possibly exposed; when in doubt,
rotate. Verify the fix actually closes the path, including variants.

### 5. Communicate

Affected users are notified with what we know, what we do not yet know, what we
have done, and what they should do. We do not wait for complete understanding
before the first notification, and we do not speculate about cause.

Where a vulnerability was reported to us, we coordinate disclosure timing with
the reporter.

### 6. Review

Every SEV1 and SEV2 gets a written post-incident review covering timeline, root
cause, why existing controls did not prevent or detect it, and concrete follow-up
work with owners.

Reviews are blameless. An incident that is treated as a personal failure is an
incident that gets hidden next time. The question is always which control was
missing, not who erred.

## Credential exposure

The most common real incident. Standing procedure:

1. Revoke or rotate immediately. Do not wait to confirm the exposure was real.
2. Review logs for use of the credential.
3. Determine the exposure path and close it.
4. Notify affected parties if their data or funds were reachable.

Rotation is designed to be non-disruptive precisely so this can happen fast -
multiple active API keys, overlapping webhook secrets, and adapters that read
credentials at use rather than at process start.

## Chain-specific considerations

Onchain actions cannot be undone. Response focuses on stopping further action:
revoke session keys and delegated permissions, halt sponsorship, disable
affected policies, and, where a smart account supports it, invoke its emergency
controls.

Where funds have moved, we assist affected users with information - transaction
hashes, timelines, addresses. We cannot reverse transactions and will not
suggest otherwise.

A reorganization is not automatically an incident. It becomes one if
reorg-unsafe processing produced incorrect state, such as double-counted credits
or entitlements derived from an orphaned block.

## What we will not do

- quietly patch a cross-tenant exposure without telling affected users
- describe an incident as a "service disruption" when it was a breach
- claim data was not accessed when we only know it was not _known_ to be accessed
- publish another user's data in a post-mortem
- retaliate against a good-faith reporter

## Reporting

Suspected incident or vulnerability: **security@hoodstack.io**. See
[SECURITY.md](../../SECURITY.md) and
[responsible-disclosure.md](responsible-disclosure.md).
