import { useEffect, useMemo, useState } from "react";
import "./bookfinder.css"; // 👈 Import CSS

export default function BookFinder() {
  // ✅ State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  // ✅ Fetch books
  async function search(e) {
    e.preventDefault();
    if (!title && !author) return;

    setLoading(true);
    setError(null);

    try {
      const url = new URL("https://openlibrary.org/search.json");
      if (title) url.searchParams.set("title", title);
      if (author) url.searchParams.set("author", author);
      url.searchParams.set("limit", 30);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const data = await res.json();

      if (!data.docs || data.docs.length === 0) {
        setBooks([]);
        setError("No books found 😔"); // Friendly message
      } else {
        setBooks(data.docs);
        setError(null);
      }
      setPage(1);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Filter + sort
  const filteredBooks = useMemo(() => {
    let results = books;
    if (minYear)
      results = results.filter((b) => b.first_publish_year >= Number(minYear));
    if (maxYear)
      results = results.filter((b) => b.first_publish_year <= Number(maxYear));

    if (sortBy === "year_asc")
      results = [...results].sort(
        (a, b) => (a.first_publish_year || 9999) - (b.first_publish_year || 9999)
      );
    if (sortBy === "year_desc")
      results = [...results].sort(
        (a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0)
      );
    if (sortBy === "title")
      results = [...results].sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    return results;
  }, [books, minYear, maxYear, sortBy]);

  // ✅ Pagination
  const pageSize = 10;
  const pageCount = Math.ceil(filteredBooks.length / pageSize);
  const pageItems = filteredBooks.slice((page - 1) * pageSize, page * pageSize);

  // ✅ Reset page when filters change
  useEffect(() => setPage(1), [minYear, maxYear, sortBy]);

  return (
    <div className="bookfinder-container">
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>📚 Book Finder</h1>
      <p style={{ color: "#4b5563", marginBottom: 20 }}>
        Search the Open Library for books by title and author. Filter by year, sort results, and open
        the book page on OpenLibrary.
      </p>

      {/* Search Form */}
      <div className="bookfinder-card" style={{ marginBottom: 16 }}>
        <form onSubmit={search}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div className="bookfinder-label">Title</div>
              <input
                id="title"
                className="bookfinder-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The Hobbit"
              />
            </div>
            <div>
              <div className="bookfinder-label">Author</div>
              <input
                id="author"
                className="bookfinder-input"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g., Tolkien"
              />
            </div>
            <div style={{ alignSelf: "end" }}>
              <button type="submit" className="bookfinder-button" disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <div className="bookfinder-label">Min Year</div>
              <input
                inputMode="numeric"
                className="bookfinder-input"
                value={minYear}
                onChange={(e) => setMinYear(e.target.value)}
                placeholder="e.g., 1990"
              />
            </div>
            <div>
              <div className="bookfinder-label">Max Year</div>
              <input
                inputMode="numeric"
                className="bookfinder-input"
                value={maxYear}
                onChange={(e) => setMaxYear(e.target.value)}
                placeholder="e.g., 2020"
              />
            </div>
            <div>
              <div className="bookfinder-label">Sort By</div>
              <select
                className="bookfinder-input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="year_asc">Year ↑</option>
                <option value="year_desc">Year ↓</option>
                <option value="title">Title (A→Z)</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="bookfinder-grid">
        {error ? (
          <div className="bookfinder-card" style={{ padding: 20, textAlign: "center", color: "red" }}>
            {error}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="bookfinder-card" style={{ padding: 20, textAlign: "center", color: "#4b5563" }}>
            No books to display. Try searching something else.
          </div>
        ) : (
          pageItems.map((b, idx) => (
            <article key={`${b.key}-${idx}`} className="bookfinder-card" style={{ padding: 12 }}>
              <div style={{ display: "flex", gap: 12 }}>
                {b.cover_i ? (
                  <img
                    className="bookfinder-cover"
                    src={`https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`}
                    alt={b.title || "Book cover"}
                  />
                ) : (
                  <div className="bookfinder-cover">No cover</div>
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    {b.title || "Untitled"}
                  </h3>
                  <div style={{ color: "#4b5563", fontSize: 13, marginTop: 4 }}>
                    <div>
                      <strong>Author:</strong>{" "}
                      {Array.isArray(b.author_name) ? b.author_name.join(", ") : b.author_name || "Unknown"}
                    </div>
                    <div>
                      <strong>Year:</strong> {b.first_publish_year ?? "N/A"}
                    </div>
                  </div>
                  {b.key && (
                    <a
                      href={`https://openlibrary.org${b.key}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-block", marginTop: 8, fontSize: 13 }}
                    >
                      Open on OpenLibrary ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            className="bookfinder-ghost"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className="bookfinder-badge">Page {page} / {pageCount}</span>
          <button
            className="bookfinder-ghost"
            disabled={page === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next → 
          </button>
        </div>
      )}

      <footer className="bookfinder-footer">
        Data from Open Library • This is a demo app for the challenge
      </footer>
    </div>
  );
}
