import { PageWithMetadata } from "types";

/**
 * Service responsible for assigning only page number metadata to pages.
 */
export class PageMetadataService {
  /**
   * Assigns metadata (book id, title, page number, etc.) to each page.
   *
   * @param bookId - Unique identifier for the book
   * @param pages - Array of cleaned page strings
   * @param title - Title of the book
   * @param className - Optional curriculum level (e.g., Grade 10, Algebra)
   * @returns Array of `PageWithMetadata` objects
   */
  public assignPageNumbers(bookId: string, pages: string[], title: string, className?: string): PageWithMetadata[] {
    return pages.map((page, idx) => {
      const pageNumber = idx + 1;
      return {
        id: bookId,
        title,
        pageNumber,
        className,
        text: page,
      };
    });
  }
}
