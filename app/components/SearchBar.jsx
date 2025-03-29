"use client";
import React, { useEffect, useState } from "react";

export default function SearchBar({ setSearch }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Handle the form submission (for now, just log the search query)
  const handleSubmit = () => {
    setSearch(searchQuery);
  };

  // Handle key down event
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Use effect to set debounced query
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchQuery);
    }, 800); // Adjust debounce time as needed (300ms)

    // Cleanup the timer on component unmount or when searchQuery changes
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  return (
    <div className="flex items-center space-x-4 p-1 justify-end">
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onKeyDown={handleKeyDown} // Add the key down event
        onChange={(e) => setSearchQuery(e.target.value)}
        className="bg-gray-700 text-white px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <button
        onClick={handleSubmit}
        type="submit"
        className="bg-[rgb(31,41,55)] text-white px-3 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300"
      >
        Search
      </button>
    </div>
  );
}
