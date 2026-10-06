# receipt-ocr Specification

## Purpose

Lets a user turn photographed receipts into ledger entries by reading dates and amounts in the browser, without sending images to any server.

## Requirements

### Requirement: OCR-1 In-browser image reading

A user SHALL be able to select one or more images. Each SHALL be read in the browser by an OCR worker that is loaded on demand and terminated afterwards. Images SHALL NOT leave the browser. (`src/features/dashboard/model/useItemCardModel.ts:226-272`)

#### Scenario: Multiple images

- **WHEN** a user selects three receipt images
- **THEN** each is read locally and no image is uploaded

### Requirement: OCR-2 Date extraction

The date SHALL be extracted from text as `d de <mes> de 20yy`, `d <mes> 20yy` (Spanish month names or abbreviations, including "sep" and "sept", with or without a trailing period) or `dd/mm/20yy`, and normalised to `dd/MM/yyyy`. The space between the day and the month MAY be missing in the text. A date whose day is not a real day of that month SHALL be treated as no date found, never returned as an invalid date. (`src/lib/receipts/dates.ts:23-25`, `:41-48`, `:60-78`)

#### Scenario: Written month

- **WHEN** the text contains "5 de marzo de 2026"
- **THEN** the date is "05/03/2026"

#### Scenario: Abbreviated September

- **WHEN** the text contains "23 sept 2026 - 3:35 p.m."
- **THEN** the date is "23/09/2026"

#### Scenario: Impossible day

- **WHEN** the text contains "45 sept 2026"
- **THEN** no date is found for that image

### Requirement: OCR-3 Amount extraction

The amount SHALL be, when the text has a labelled value ("Valor del pago" or "Valor de la transferencia" followed by a `$` amount), that amount. Otherwise it SHALL be the largest number of at least 1.000 and at most 9 digits. In both cases it SHALL be read in Colombian format (`.` for thousands, `,` for decimals) and re-formatted as `es-CO`. (`src/lib/receipts/amounts.ts:6-10`, `:32-40`)

#### Scenario: Thousands separator

- **WHEN** the text contains "12.500" and "300"
- **THEN** the amount is 12.500

#### Scenario: Labelled amount beats a larger number

- **WHEN** the text contains "Valor del pago $ 21.500" and a business code "009288065"
- **THEN** the amount is 21.500

### Requirement: OCR-5 Unreadable amount

An image with no readable amount SHALL be flagged on its own so the user can type the amount in. Other images in the same upload SHALL NOT be affected. (`src/features/dashboard/model/reviewEntries.ts:50-66`, `src/features/dashboard/model/useItemCardModel.ts:197-214`)

#### Scenario: No amount

- **WHEN** an image yields a date but no amount of at least 1.000
- **THEN** that image is flagged for manual amount entry

### Requirement: OCR-6 Manual-entry fallback

If an image yields no date, it SHALL be flagged for manual entry of its date. If the OCR worker fails, every image SHALL be flagged for manual entry of date and amount. These failure paths fail open to manual entry: the user can still save. (`src/features/dashboard/model/useItemCardModel.ts:197-214`, `:259-266`)

#### Scenario: Image without a date

- **WHEN** one of three images yields no date
- **THEN** only that image is flagged for a typed date, and the user can still save

#### Scenario: Worker failure

- **WHEN** the OCR worker throws
- **THEN** each image is flagged for manual date and amount, and the user can still save

### Requirement: OCR-7 Per-entry dates

Each image SHALL keep its own date. Images with different dates in the same upload SHALL all be kept; none SHALL be excluded because of its date. (`src/features/dashboard/model/useItemCardModel.ts:226-258`)

#### Scenario: Mixed dates

- **WHEN** an upload holds images dated 23/09/2026, 24/09/2026 and 25/09/2026
- **THEN** all three entries are kept, each with its own date

### Requirement: OCR-8 Date outlier flag

After dates are read or typed, an entry whose date is more than 7 days before or after the median date of the upload SHALL be flagged, whether OCR read the date or the user typed it. For an upload with fewer than 3 dated entries, the comparison SHALL be against the nearest other date instead of the median. A flagged entry SHALL stay in the upload and the user SHALL confirm or correct it before saving. A lone dated entry SHALL NOT be flagged. (`src/lib/receipts/dateOutliers.ts:4`, `:29-48`, `src/features/dashboard/model/reviewEntries.ts:50-66`)

#### Scenario: Misread year

- **WHEN** an upload has dates 23/09/2026, 24/09/2026, 25/09/2026 and 24/09/2062
- **THEN** the 2062 entry is flagged and the user must confirm or correct it before saving

#### Scenario: Typed date far from the rest

- **WHEN** the user types 10/09/2026 for an image in an upload whose median date is 24/09/2026
- **THEN** that entry is flagged

#### Scenario: Small upload

- **WHEN** an upload has two dated entries 10 days apart
- **THEN** both are flagged, because each is more than 7 days from its nearest other date

#### Scenario: Date at the limit

- **WHEN** a date is exactly 7 days from the median
- **THEN** it is not flagged

### Requirement: OCR-9 Retry before flagging

An image that yields no date or no amount on the first read SHALL be read again with other page-reading modes and, if still incomplete, with alternative image treatments, before it is flagged for manual entry. A retry SHALL fill only the missing fields and SHALL NOT replace a value already found. The retry SHALL run in the browser and images SHALL NOT leave it. If the retry still yields nothing, the image is flagged as in `OCR-5` and `OCR-6`. (`src/lib/receipts/readReceipt.ts:25-48`, `src/lib/receipts/readPasses.ts:24-45`, `src/features/dashboard/model/useItemCardModel.ts:226-258`)

#### Scenario: Large amount missed by the first reading mode

- **WHEN** the first read finds the date but drops the large bold amount, and another reading mode finds "$ 51.600"
- **THEN** the amount is 51.600 and the image is not flagged

#### Scenario: Dark-mode screenshot

- **WHEN** the reads of the image as it is find no amount but a treated read finds "$ 41.500"
- **THEN** the amount is 41.500 and the image is not flagged

#### Scenario: Retry does not overwrite

- **WHEN** the first read finds the date 23/09/2026 and a retry reads a different date
- **THEN** the date stays 23/09/2026

### Requirement: OCR-10 File names are ignored

Dates and amounts SHALL NOT be derived from the file name of an uploaded image. Two uploads of the same image under different names SHALL give the same result. (`eslint.config.mjs:20-38` bans importing the filename oracle into app code; nothing under `src/` reads `File.name`)

#### Scenario: Misleading name

- **WHEN** an image of a receipt for 51.600 on 24/09/2026 is named "01-01-2020-1.000.jpeg"
- **THEN** its date and amount come only from the image content
