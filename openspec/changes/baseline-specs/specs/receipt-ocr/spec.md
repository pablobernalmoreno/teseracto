# Spec Delta

## Purpose

Lets a user turn photographed receipts into ledger entries by reading dates and amounts in the browser, without sending images to any server.

## ADDED Requirements

### Requirement: OCR-1 In-browser image reading

A user SHALL be able to select one or more images. Each SHALL be read in the browser by an OCR worker that is loaded on demand and terminated afterwards. Images SHALL NOT leave the browser. (`src/features/dashboard/model/useItemCardModel.ts:261-330`)

#### Scenario: Multiple images

- **WHEN** a user selects three receipt images
- **THEN** each is read locally and no image is uploaded

### Requirement: OCR-2 Date extraction

The date SHALL be extracted from text as `d de <mes> de 20yy`, `d <mes> 20yy` (Spanish month names or abbreviations) or `dd/mm/20yy`, and normalised to `dd/MM/yyyy`. (`src/lib/data.ts:4-32`)

#### Scenario: Written month

- **WHEN** the text contains "5 de marzo de 2026"
- **THEN** the date is "05/03/2026"

### Requirement: OCR-3 Amount extraction

The amount SHALL be the largest number of at least 1.000 and at most 9 digits, read in Colombian format (`.` for thousands, `,` for decimals) and re-formatted as `es-CO`. (`src/lib/data.ts:34-67`)

#### Scenario: Thousands separator

- **WHEN** the text contains "12.500" and "300"
- **THEN** the amount is 12.500

### Requirement: OCR-4 One upload is one day

The first date found SHALL become the reference date. An image showing a different date SHALL be excluded, with a message naming both dates. (`src/features/dashboard/model/useItemCardModel.ts:128-150`)

#### Scenario: Mixed dates

- **WHEN** the first image is dated 05/03/2026 and the second 06/03/2026
- **THEN** the second is excluded and the message names both dates

### Requirement: OCR-5 Unreadable amount

An image with no readable amount SHALL be flagged so the user can type the amount in. (`src/features/dashboard/model/useItemCardModel.ts:155-163`)

#### Scenario: No amount

- **WHEN** an image yields a date but no amount of at least 1.000
- **THEN** it is flagged for manual amount entry

### Requirement: OCR-6 Manual-entry fallback

If no date is found in any image, or the OCR worker fails, every image SHALL be flagged for manual entry of date and amount. This failure path fails open to manual entry: the user can still save. (`src/features/dashboard/model/useItemCardModel.ts:175-185`, `:311-326`)

#### Scenario: Worker failure

- **WHEN** the OCR worker throws
- **THEN** each image is flagged for manual date and amount, and the user can still save
