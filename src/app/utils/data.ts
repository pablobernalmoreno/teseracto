import { parse, isValid, format } from "date-fns";
import { es } from "date-fns/locale";

export const parseDates = (pathsArray: string[]): (string | null)[] => {
  return pathsArray.map((entry) => {
    const match =
      entry.match(/(\d{1,2})\s+de\s+([a-zA-ZñÑ]+)\s+de\s+(2025)/i) ||
      entry.match(/(\d{1,2})\s+([a-zA-ZñÑ]+)\s+(2025)/i);

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

    return null; // Keep position if no match
  });
};

export const extractCurrencyValues = (pathsArray: string[]): string[] => {
  const currencyRegex = /\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d{4,}(?:,\d{2})?/g;

  const formatToCOP = (num: number): string => {
    return num.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return pathsArray.map((str) => {
    const matches = str.match(currencyRegex);
    if (!matches) return ""; // Preserve position

    const candidates = matches.filter((m) => {
      const numericString = m.replace(/\./g, "").replace(",", ".");
      const digitsOnly = m.replace(/[.,]/g, "");
      if (digitsOnly.length > 9) return false;
      const num = parseFloat(numericString);
      return num >= 1000;
    });

    if (candidates.length === 0) return ""; // Preserve position

    const sorted = candidates.sort((a, b) => {
      const toNumber = (s: string) =>
        parseFloat(s.replace(/\./g, "").replace(",", "."));
      return toNumber(b) - toNumber(a);
    });

    const top = sorted[0];
    const topNum = parseFloat(top.replace(/\./g, "").replace(",", "."));
    return formatToCOP(topNum);
  });
};

export const combineDatesAndCurrency = (
  datesArray: (string | null)[],
  currencyArray: string[]
) => {
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
    (entry) =>
      entry.date && entry.date !== "N/A" && entry.money && entry.money !== "N/A"
  );
};

export const findInvalidEntries = (
  combinedData: { date: string; money: string; id: number }[]
) => {
  return combinedData.filter(
    (entry) =>
      !entry.date || entry.date === "N/A" ||
      !entry.money || entry.money === "N/A"
  );
};
