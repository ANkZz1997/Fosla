"use client"; // Ensure this is at the very top

import Pagination from "@/app/components/Pagination";
import SearchBar from "@/app/components/SearchBar";
import Loader from "@/app/components/Loader";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const route = useRouter()

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:3000/api/users?search=${search}&limit=20&page=${page}`
      );
      setUsers(res.data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [search, page]);

  return (
    <div className="backdrop-blur-sm h-full w-full flex flex-col">
      <div className="flex justify-between">
        <Pagination
          totalPages={users.totalPages || 1}
          currentPage={page}
          onPageChange={(newPage) => setPage(newPage)}
        />
        <SearchBar setSearch={setSearch} />
      </div>
      <div className="flex-1 overflow-y-auto mt-6">
        {loading ? (
          <Loader />
        ) : (
          <div className="flex flex-wrap justify-center gap-6 p-6">
            {users.map((user) => (
              <div
                key={user._id}
                onClick={() => {
                  // Use window.location to navigate to the user detail page
                  route.push(`user/${user._id}`);
                }}
                className="bg-[rgba(31,41,55,0.86)] shadow-lg rounded-lg overflow-hidden transition-transform transform hover:scale-105 min-w-[250px] flex flex-col items-center cursor-pointer"
              >
                <img
                  src={user?.photo || "/dummy.png"}
                  alt={user.firstname}
                  className="w-24 h-24 object-cover rounded-full border-4 border-gray-200 mt-4"
                />
                <div className="p-4 text-center">
                  <h2
                    className="text-xl font-semibold overflow-hidden whitespace-nowrap text-ellipsis capitalize"
                    style={{
                      color: "rgb(85, 129, 190)",
                      maxWidth: "170px",
                    }}
                  >
                    {user.firstname || "FirstName"} {user.lastname || "LastName"}
                  </h2>
                  <p
                    className="text-white overflow-hidden whitespace-nowrap text-ellipsis"
                    style={{ maxWidth: "170px" }}
                  >
                    {user.phone || "No contacts"}
                  </p>
                  <p
                    className="text-white overflow-hidden whitespace-nowrap text-ellipsis"
                    style={{ maxWidth: "170px" }}
                  >
                    {user.email || "noEmail@present"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
