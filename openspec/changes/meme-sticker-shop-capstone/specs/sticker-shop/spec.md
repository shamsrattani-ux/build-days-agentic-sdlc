# Spec Delta

## Purpose

Lets a shopper browse a seeded catalog of meme stickers and spend a virtual
credit balance to purchase one, demonstrating a minimal storefront workflow
end to end.

## ADDED Requirements

### Requirement: Browse the sticker catalog
The system SHALL display the seeded catalog of meme stickers, each with a
name, price in credits, and image, to any visitor without requiring
authentication.

#### Scenario: Catalog loads successfully
- **WHEN** a shopper opens the sticker shop and the catalog has at least one
  sticker
- **THEN** the system displays a grid of stickers, each showing its image,
  name, and price in credits

#### Scenario: Catalog is loading
- **WHEN** the sticker catalog request has not yet completed
- **THEN** the system shows a loading state and does not show stale or
  partial sticker data

#### Scenario: Catalog is empty
- **WHEN** the shopper opens the sticker shop and no stickers are seeded or
  all stickers have been purchased and removed from availability
- **THEN** the system shows an accessible empty-state message instead of an
  empty grid or an error

#### Scenario: Catalog fails to load
- **WHEN** the catalog data cannot be retrieved due to a storage or server
  error
- **THEN** the system shows an accessible failure message and does not crash
  the page

### Requirement: View current credit balance
The system SHALL show the shopper's current virtual credit balance so they
can decide whether they can afford a sticker before purchasing.

#### Scenario: Balance is visible on the shop page
- **WHEN** the shopper opens the sticker shop
- **THEN** the system displays the shopper's current credit balance

#### Scenario: Balance updates after a purchase
- **WHEN** a purchase completes successfully
- **THEN** the displayed credit balance reflects the deducted amount without
  requiring a manual page reload

### Requirement: Purchase a sticker with virtual credits
The system SHALL let the shopper purchase a single sticker from the catalog
by spending virtual credits, debiting the shopper's balance by the sticker's
price and recording the purchase, only when the shopper has a sufficient
balance.

#### Scenario: Successful purchase
- **WHEN** the shopper purchases a sticker whose price is less than or equal
  to their current credit balance
- **THEN** the system debits the balance by the sticker's price, records a
  purchase entry linking the shopper and the sticker, and confirms the
  purchase to the shopper

#### Scenario: Insufficient credits
- **WHEN** the shopper attempts to purchase a sticker whose price exceeds
  their current credit balance
- **THEN** the system rejects the purchase, leaves the balance unchanged,
  and shows an accessible validation message explaining the balance is too
  low

#### Scenario: Sticker no longer available
- **WHEN** the shopper attempts to purchase a sticker that no longer exists
  in the catalog (for example, removed or already purchased in a
  single-stock model)
- **THEN** the system rejects the purchase, leaves the balance unchanged,
  and shows an accessible message that the sticker is unavailable

#### Scenario: Concurrent purchase safety
- **WHEN** two purchase requests for the same limited-availability sticker
  are processed in overlapping order
- **THEN** the system allows at most one of them to succeed against the
  shopper's balance and catalog state, and the other receives a rejection
  consistent with the sticker no longer being available or funds already
  spent

#### Scenario: Purchase request fails unexpectedly
- **WHEN** the purchase cannot be completed due to a storage or server error
  unrelated to balance or availability
- **THEN** the system leaves the balance and catalog state unchanged and
  shows an accessible failure message distinct from the insufficient-credits
  and unavailable messages

### Requirement: View purchase history
The system SHALL let the shopper see the stickers they have already
purchased.

#### Scenario: Purchase history reflects completed purchases
- **WHEN** the shopper has completed one or more successful purchases
- **THEN** the system shows those purchases, including sticker name and
  price paid, on request

#### Scenario: No purchases yet
- **WHEN** the shopper has not completed any purchases
- **THEN** the system shows an accessible empty-state message for purchase
  history instead of an error
