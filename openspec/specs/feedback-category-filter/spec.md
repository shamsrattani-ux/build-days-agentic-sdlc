# feedback-category-filter Specification

## Purpose

Lets workshop users narrow the feedback board to one category, or return to
the full board, without changing any stored feedback, vote, or ordering data.

## Requirements

### Requirement: Category-scoped feedback listing
The system SHALL return feedback items scoped to a requested, validated
category, and SHALL return every current item when no category filter or the
`all` value is supplied. Filtering SHALL NOT change the relative order or
content of returned items compared to the unfiltered list, and SHALL NOT
create, update, delete, or reorder stored feedback.

#### Scenario: All categories selected
- **WHEN** a client requests the feedback list with no category filter or
  with the `all` value
- **THEN** the response includes every feedback item currently in storage

#### Scenario: A single category selected
- **WHEN** a client requests the feedback list with a supported category
  value
- **THEN** the response includes only the feedback items whose `category`
  matches that value, in the existing list order

#### Scenario: Filter cleared after selection
- **WHEN** a client that previously requested a single category now requests
  the list with no filter or the `all` value
- **THEN** the response includes the complete current list

### Requirement: Category filter validation
The system SHALL accept only the existing feedback categories or the `all`
value as a category filter, matched by exact case-sensitive comparison with
no automatic trimming or normalization, and SHALL reject any other value
without creating, updating, deleting, or reordering stored feedback.

#### Scenario: Unsupported category value rejected
- **WHEN** a client requests the feedback list with a category value that is
  not one of the existing feedback categories or `all`
- **THEN** the system rejects the request with a validation error response
  and the stored feedback and vote data remain unchanged

#### Scenario: A storage failure occurs while a category filter is applied
- **WHEN** the underlying storage is unavailable while a client requests the
  feedback list with a valid category filter
- **THEN** the system returns the same error response it would return for an
  unfiltered request under the same failure, and no partial or filtered data
  is exposed

### Requirement: Accessible empty states
The board SHALL present an accessible empty state whenever the currently
displayed list has zero items, and the state SHALL be distinguishable from
the loading and error states. The wording SHALL also distinguish "no feedback
exists in any category" from "no feedback matches the selected category" so
a user cannot mistake one for the other.

#### Scenario: Selected category has no items
- **WHEN** a user selects a supported category that currently has zero
  matching feedback items, while other categories still have items
- **THEN** the board shows an accessible empty state naming the selected
  category, distinct from the no-feedback-at-all state

#### Scenario: No feedback exists in any category
- **WHEN** the board loads and storage currently has zero feedback items,
  regardless of the selected category
- **THEN** the board shows the existing "no feedback yet" empty state rather
  than the category-specific empty state

### Requirement: Client recovery from an invalid URL category value
If the client reads a category value from its own URL that is not one of the
existing feedback categories or `all`, it SHALL treat the filter as `all`
instead of forwarding the invalid value to the API or presenting a load
failure for a problem the user did not cause.

#### Scenario: Page loads with an unsupported category in the URL
- **WHEN** the board loads and the URL's category value is not one of the
  existing feedback categories or `all`
- **THEN** the board requests and displays the unfiltered list as if `all`
  had been selected, and does not display the load-failure state solely
  because of the invalid URL value

### Requirement: Discoverable and operable filter control
The board SHALL expose the category filter as a native form control whose
currently selected category is operable by keyboard and programmatically
determinable by assistive technology through the control's own semantics
(matching the existing create-feedback category control already used in
`App.tsx`). The visible count of items matching the current selection SHALL
be exposed through an existing live-updating region so assistive technology
users are informed when the count changes.

#### Scenario: Selecting a category via keyboard
- **WHEN** a keyboard-only user operates the category filter control and
  chooses a category
- **THEN** the control reflects the newly selected category, keyboard focus
  remains on the control, and the board updates to the matching items
  without requiring a pointer device

#### Scenario: Item count is announced after filtering
- **WHEN** a user changes the selected category and the displayed item count
  changes as a result
- **THEN** the updated count is exposed through the same live-updating
  region assistive technology already relies on elsewhere on the board
