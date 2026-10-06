// The upload dialog makes exactly two browser-side calls: it reads the current profile before
// saving, and it creates the book. Everything else (login, the /main server render, Supabase) is
// not part of a component test, so those two are stubbed and the created book's request body is
// captured for assertions. See design.md in the change for what this does not cover.
export const CREATE_BOOK_ALIAS = "createBook";

export interface CreatedBookBody {
  title: string;
  creationTime?: string;
  bookId?: string;
  content: { id: number; date: string; money: string }[];
}

/**
 * Stubs the dashboard API and returns the list of every non-GET request the page makes, as
 * "METHOD /path". The language data the OCR worker downloads is a GET; anything that could upload
 * an image would be a POST, PUT or PATCH, so this is how OCR-1 ("images never leave the browser")
 * is checked.
 */
export function stubDashboardApi(): string[] {
  const nonGetRequests: string[] = [];

  cy.intercept("GET", "**/api/dashboard/profile/current", {
    statusCode: 200,
    body: { data: { id: "user-1", book_id: "owner-1" } },
  });

  cy.intercept("POST", "**/api/dashboard/books", (request) => {
    request.reply({
      statusCode: 200,
      body: {
        data: {
          id: "book-1",
          title: request.body.title,
          content: request.body.content,
          creationTime: request.body.creationTime,
        },
      },
    });
  }).as(CREATE_BOOK_ALIAS);

  // Registered last, so it sees every request first and then lets it continue to the stubs above.
  cy.intercept({ url: "**" }, (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      nonGetRequests.push(`${request.method} ${new URL(request.url).pathname}`);
    }
  });

  return nonGetRequests;
}
