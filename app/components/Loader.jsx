"use client"
// Loader.js
import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center h-full ">
      <div className="loader flex flex-col justify-center items-center">
        <div className="border-t-4 border-b-4 border-indigo-600 rounded-full w-16 h-16 animate-spin"></div>
        <p className="text-white mt-4 animate-pulse">Loading, please wait...</p>
      </div>
    </div>
  );
}

export default Loader;
