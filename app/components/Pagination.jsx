"use client";
import React from "react";

const Pagination = ({ totalPages, currentPage, onPageChange }) => {
  const handlePageChange = (page) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    
    if (totalPages <= 5) {
      // Show all pages if total pages are less than or equal to 5
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`px-3 py-2 rounded-md focus:outline-none ${
              currentPage === i
                ? "bg-indigo-700 text-white"
                : "bg-gray-700 text-white hover:bg-indigo-600"
            }`}
          >
            {i}
          </button>
        );
      }
    } else {
      // Show first two pages
      for (let i = 1; i <= 2; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`px-3 py-2 rounded-md focus:outline-none ${
              currentPage === i
                ? "bg-indigo-700 text-white"
                : "bg-gray-700 text-white hover:bg-indigo-600"
            }`}
          >
            {i}
          </button>
        );
      }

      // Show ellipsis if currentPage is more than 3
      if (currentPage > 3) {
        pages.push(
          <span key="ellipsis-start" className="px-3 py-2 text-white">
            ...
          </span>
        );
      }

      // Show current page if it's in between first two and last two
      if (currentPage > 2 && currentPage < totalPages - 1) {
        pages.push(
          <button
            key={currentPage}
            onClick={() => handlePageChange(currentPage)}
            className={`px-3 py-2 rounded-md focus:outline-none bg-indigo-700 text-white`}
          >
            {currentPage}
          </button>
        );
      }

      // Show last two pages
      if (currentPage < totalPages - 2) {
        pages.push(
          <span key="ellipsis-end" className="px-3 py-2 text-white">
            ...
          </span>
        );
        for (let i = totalPages - 1; i <= totalPages; i++) {
          pages.push(
            <button
              key={i}
              onClick={() => handlePageChange(i)}
              className={`px-3 py-2 rounded-md focus:outline-none ${
                currentPage === i
                  ? "bg-indigo-700 text-white"
                  : "bg-gray-700 text-white hover:bg-indigo-600"
              }`}
            >
              {i}
            </button>
          );
        }
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 pr-2 pl-2">
      {renderPageNumbers()}
    </div>
  );
};

export default Pagination;
