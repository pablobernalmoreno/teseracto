import { extractAmounts } from "@/lib/receipts/amounts";
import { extractDates } from "@/lib/receipts/dates";

export const parseDates = (pathsArray: string[]): (string | null)[] => extractDates(pathsArray);

export const extractCurrencyValues = (pathsArray: string[]): string[] => extractAmounts(pathsArray);

export const combineDatesAndCurrency = (datesArray: (string | null)[], currencyArray: string[]) => {
  const combinedArray = [];

  for (let i = 0; i < datesArray.length; i++) {
    combinedArray.push({
      date: datesArray[i] ?? "N/A", // Use "N/A" if date is null
      money: currencyArray[i] || "N/A", // Use "N/A" if money is empty string
      id: i,
    });
  }

  return combinedArray;
};

export const isCombinedDataValid = (
  combinedData: { date: string; money: string; id: number }[]
): boolean => {
  return combinedData.every(
    (entry) => entry.date && entry.date !== "N/A" && entry.money && entry.money !== "N/A"
  );
};

export const findInvalidEntries = (combinedData: { date: string; money: string; id: number }[]) => {
  return combinedData.filter(
    (entry) => !entry.date || entry.date === "N/A" || !entry.money || entry.money === "N/A"
  );
};

/**
 * Returns a map of entry IDs to their valid fields (date/money).
 * Useful for pre-populating carousel values with valid data.
 */
export const getValidFieldsFromInvalidEntries = (
  combinedData: { date: string; money: string; id: number }[]
): Map<number, { date: string; money: string }> => {
  const validFields = new Map();

  combinedData.forEach((entry) => {
    const isDateValid = entry.date && entry.date !== "N/A";
    const isMoneyValid = entry.money && entry.money !== "N/A";

    // Only add to map if at least one field is invalid (entry needs fixing)
    if (!isDateValid || !isMoneyValid) {
      validFields.set(entry.id, {
        date: isDateValid ? entry.date : "",
        money: isMoneyValid ? entry.money : "",
      });
    }
  });

  return validFields;
};
