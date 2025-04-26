import { parse, format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';


export const parseDates = (pathsArray: string[]) => {
  return pathsArray.map(entry => {
    let match = entry.match(/(\d{1,2})\s+de\s+([a-zA-ZñÑ]+)\s+de\s+(2025)/i);
  
    if (!match) {
      match = entry.match(/(\d{1,2})\s+([a-zA-ZñÑ]+)\s+(2025)/i);
    }
  
    if (match) {
      const rawDate = `${match[1]} ${match[2]} ${match[3]}`;
  
      let parsed = parse(rawDate, 'd MMMM yyyy', new Date(), { locale: es });
      if (!isValid(parsed)) {
        parsed = parse(rawDate, 'd MMM yyyy', new Date(), { locale: es });
      }
  
      if (isValid(parsed)) {
        return format(parsed, 'dd/MM/yyyy');
      }
    }
    const slashDateMatch = entry.match(/(\d{2})\/(\d{2})\/(2025)/);
    if (slashDateMatch) {
      return `${slashDateMatch[1]}/${slashDateMatch[2]}/${slashDateMatch[3]}`;
    }
  
    return null;
  }).filter(Boolean);
}

