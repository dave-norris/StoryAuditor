# Clerk User Information Reference

All properties available from the Clerk user object (via `useUser()` client-side or `currentUser()` server-side).

---

## Identity

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique Clerk user identifier (e.g. `user_2x7kFh...`) |
| `username` | string \| null | Username if enabled |
| `firstName` | string \| null | First name |
| `lastName` | string \| null | Last name |
| `fullName` | string \| null | Computed full name |
| `imageUrl` | string | Profile image URL (always present, may be default avatar) |
| `hasImage` | boolean | Whether user uploaded a custom image |
| `profileImageUrl` | string | Alias for imageUrl |

---

## Email

| Property | Type | Description |
|----------|------|-------------|
| `primaryEmailAddress` | EmailAddress \| null | Primary email object |
| `primaryEmailAddress.emailAddress` | string | The actual email string |
| `emailAddresses` | EmailAddress[] | All associated email addresses |
| `hasVerifiedEmailAddress` | boolean | At least one email is verified |

### EmailAddress object

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique ID for this email |
| `emailAddress` | string | The email string |
| `verification` | object | Verification status and strategy |
| `linkedTo` | object[] | OAuth accounts linked to this email |

---

## Phone

| Property | Type | Description |
|----------|------|-------------|
| `primaryPhoneNumber` | PhoneNumber \| null | Primary phone object |
| `phoneNumbers` | PhoneNumber[] | All associated phone numbers |
| `hasVerifiedPhoneNumber` | boolean | At least one phone is verified |

---

## External / OAuth Accounts

| Property | Type | Description |
|----------|------|-------------|
| `externalAccounts` | ExternalAccount[] | Linked OAuth providers (Google, GitHub, etc.) |
| `externalAccounts[].provider` | string | Provider name (e.g. `google`, `github`) |
| `externalAccounts[].emailAddress` | string | Email from the OAuth provider |
| `externalAccounts[].firstName` | string | First name from provider |
| `externalAccounts[].lastName` | string | Last name from provider |
| `externalAccounts[].imageUrl` | string | Avatar from provider |
| `externalAccounts[].username` | string | Username from provider |

---

## Web3 Wallets

| Property | Type | Description |
|----------|------|-------------|
| `web3Wallets` | Web3Wallet[] | Connected wallet addresses |

---

## Metadata (custom data)

| Property | Type | Description |
|----------|------|-------------|
| `publicMetadata` | Record<string, unknown> | Public metadata (readable client & server, writable server/dashboard only) |
| `privateMetadata` | Record<string, unknown> | Private metadata (server-side only, never exposed to client) |
| `unsafeMetadata` | Record<string, unknown> | Metadata writable from the client (use with caution) |

---

## Timestamps

| Property | Type | Description |
|----------|------|-------------|
| `createdAt` | Date | When the user was created in Clerk |
| `updatedAt` | Date | Last update to the user record |
| `lastSignInAt` | Date \| null | Most recent sign-in |

---

## Session & Auth (from `auth()` server-side)

| Property | Type | Description |
|----------|------|-------------|
| `userId` | string \| null | Clerk user ID |
| `sessionId` | string \| null | Current session ID |
| `sessionClaims` | object | JWT claims for the session |
| `orgId` | string \| null | Active organization ID (if using Orgs) |
| `orgRole` | string \| null | User's role in the active org |
| `orgSlug` | string \| null | Active org slug |

---

## Flags & Status

| Property | Type | Description |
|----------|------|-------------|
| `banned` | boolean | Whether user is banned |
| `locked` | boolean | Whether user is locked |
| `twoFactorEnabled` | boolean | 2FA enabled |
| `totpEnabled` | boolean | TOTP specifically enabled |
| `backupCodeEnabled` | boolean | Backup codes enabled |
| `passwordEnabled` | boolean | User has a password set |
| `createOrganizationEnabled` | boolean | User can create orgs |
| `deleteSelfEnabled` | boolean | User can delete their own account |

---

## Methods (client-side user object)

| Method | Description |
|--------|-------------|
| `user.update({...})` | Update user fields (firstName, lastName, username, etc.) |
| `user.setProfileImage({file})` | Upload a new profile image |
| `user.delete()` | Delete the user account |
| `user.createEmailAddress({email})` | Add a new email |
| `user.createPhoneNumber({phoneNumber})` | Add a new phone number |
| `user.reload()` | Refresh user data from Clerk |

---

## What We Use in StoryAuditor

| Clerk Property | Stored As | Purpose |
|----------------|-----------|---------|
| `user.id` | `story_auditor.users.auth_id` | Links Clerk identity to local DB |
| `user.firstName` | `story_auditor.users.name` | Display name in title bar |
| `user.emailAddresses[0].emailAddress` | `story_auditor.users.email` | Contact email |
