import { parse, format, isValid } from "date-fns";
import { es } from "date-fns/locale";

export const parseDates = (pathsArray: string[]): string[] => {
  return pathsArray
    .map((entry) => {
      let match = entry.match(/(\d{1,2})\s+de\s+([a-zA-ZñÑ]+)\s+de\s+(2025)/i);

      if (!match) {
        match = entry.match(/(\d{1,2})\s+([a-zA-ZñÑ]+)\s+(2025)/i);
      }

      if (match) {
        const rawDate = `${match[1]} ${match[2]} ${match[3]}`;

        let parsed = parse(rawDate, "d MMMM yyyy", new Date(), { locale: es });
        if (!isValid(parsed)) {
          parsed = parse(rawDate, "d MMM yyyy", new Date(), { locale: es });
        }

        if (isValid(parsed)) {
          return format(parsed, "dd/MM/yyyy");
        }
      }
      const slashDateMatch = entry.match(/(\d{2})\/(\d{2})\/(2025)/);
      if (slashDateMatch) {
        return `${slashDateMatch[1]}/${slashDateMatch[2]}/${slashDateMatch[3]}`;
      }

      return null;
    })
    .filter((date) => date !== null); // Filter out null values
};


export const extractCurrencyValues = (pathsArray: string[]): string[] => {
  // Match currency values like: 61.500,00 or 144.000,00 or even 17000
  const currencyRegex = /\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d{4,}(?:,\d{2})?/g;

  const formatToCOP = (num: number): string => {
    return num.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return pathsArray.map((str) => {
    const matches = str.match(currencyRegex);
    if (!matches) return ""; // Return an empty string if no matches

    const candidates = matches.filter((m) => {
      // Remove the dots and replace the comma with a dot to parse the number
      const numericString = m.replace(/\./g, "").replace(",", ".");

      // Strip everything that's not a digit or dot (useful for checking if it's an actual number)
      const digitsOnly = m.replace(/[.,]/g, "");

      // Skip if it's absurdly long (likely a reference number)
      if (digitsOnly.length > 9) return false;

      const num = parseFloat(numericString);

      // Keep values from 1,000 and above
      return num >= 1000;
    });

    if (candidates.length === 0) return ""; // Return an empty string if no valid candidates

    // Sort by the numeric value
    const sorted = candidates.sort((a, b) => {
      const toNumber = (s: string) =>
        parseFloat(s.replace(/\./g, "").replace(",", "."));
      return toNumber(b) - toNumber(a);
    });

    // Get the top candidate and format it
    const top = sorted[0];
    const topNum = parseFloat(top.replace(/\./g, "").replace(",", "."));
    return formatToCOP(topNum);
  });
};

export const combineDatesAndCurrency = (
  datesArray: string[],
  currencyArray: string[]
) => {
  const combinedArray = [];

  for (let i = 0; i < datesArray.length; i++) {
    // Skip if currency is missing (empty string)
    if (currencyArray[i] !== "") {
      combinedArray.push({
        date: datesArray[i],
        money: currencyArray[i],
        id: i,
      });
    } else {
      // Optionally add an empty string for missing currency values
      combinedArray.push({
        date: datesArray[i],
        money: "",
        id: i,
      });
    }
  }

  return combinedArray;
};
