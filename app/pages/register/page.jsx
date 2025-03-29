"use client";
import axios from "axios";
import React, { useState } from "react";
import BACKEND_URL from "@/app/utils/server"

export default function RegistrationPage() {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    photo: null, // For profile photo
    documents: [], // To store selected document files
  });

  const [imgUrl, setImgUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState({});

  // Commonly used Tailwind CSS classes
  const styles = {
    inputField:
      "min-w-96 bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500",
    label: "block text-white",
    error: "text-red-400 text-sm mt-1",
    container:
      "flex-1 flex flex-col gap-5 bg-[rgba(31,41,55,0.86)] p-6 rounded-lg shadow-lg",
    fileInputWrapper:
      "flex items-center justify-center max-w-96 bg-gray-700 text-white relative h-10 w-full border border-dotted border-white",
    fileInput:
      "max-w-96 bg-gray-700 text-white px-4 py-2 rounded-md opacity-0 cursor-pointer absolute w-full top-0 bottom-0",
    removeButton:
      "text-red-400 hover:text-red-600 cursor-pointer ml-2 focus:outline-none",
    submitButton:
      "bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 max-w-96",
  };

  // Validate form fields
  const validate = () => {
    let errors = {};

    if (!formData.firstname) {
      errors.firstname = "First name is required";
    }
    if (!formData.lastname) {
      errors.lastname = "Last name is required";
    }
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email address is invalid";
    }
    if (!formData.phone) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = "Phone number must be 10 digits";
    }

    setErrors(errors);
    return Object.keys(errors).length === 0; // Returns true if no errors
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle file selection (photo)
  const handlePhotoChange = (e) => {
    setFormData({
      ...formData,
      photo: e.target.files[0],
    });
    if (e.target.files.length > 0) {
      setImgUrl(URL.createObjectURL(e.target.files[0]));
    } else {
      setImgUrl("");
    }
  };

  // Handle document selection
  const handleDocumentsChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  // Remove selected document locally
  const removeSelectedFile = (indexToRemove) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return; // Stop form submission if validation fails
    }

    const form = new FormData();
    form.append("firstName", formData.firstname);
    form.append("lastName", formData.lastname);
    form.append("email", formData.email);
    form.append("phone", formData.phone);

    if (formData.photo) {
      form.append("photo", formData.photo);
    }

    selectedFiles.forEach((file) => {
      form.append("documents", file);
    });

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/users`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status !== 201) {
        throw new Error("Failed to register user");
      }
      alert("User registered successfully!");
      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        phone: "",
        photo: null, // For profile photo
        documents: [], // To store selected document files
      });
    } catch (error) {
      console.error(error);
      alert("There was an error registering the user.");
    }
  };

  return (
    <div className="backdrop-blur-sm flex justify-center items-center p-6">
      <div className={styles.container}>
        <div className="flex">
          {/* Form Section */}
          <div className="flex-1 flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white mb-6">
              Register User
            </h2>

            {/* Firstname */}
            <div>
              <label className={styles.label}>First Name</label>
              <input
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleInputChange}
                required
                className={styles.inputField}
                placeholder="Enter first name"
              />
              {errors.firstname && (
                <p className={styles.error}>{errors.firstname}</p>
              )}
            </div>

            {/* Lastname */}
            <div>
              <label className={styles.label}>Last Name</label>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleInputChange}
                required
                className={styles.inputField}
                placeholder="Enter last name"
              />
              {errors.lastname && (
                <p className={styles.error}>{errors.lastname}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={styles.inputField}
                placeholder="Enter email address"
              />
              {errors.email && <p className={styles.error}>{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className={styles.label}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className={styles.inputField}
                placeholder="Enter phone number"
              />
              {errors.phone && <p className={styles.error}>{errors.phone}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              onClick={handleSubmit}
            >
              Register
            </button>
          </div>

          {/* File Upload Section */}
          <div className="flex-1 flex flex-col items-center w-full gap-5">
            {/* Profile Photo */}
            <div className="flex justify-center items-center flex-col">
              <div className="h-40 w-40 relative m-2 border border-white p-2">
                <img
                  className="h-full w-full"
                  src={imgUrl ? imgUrl : "/dummy.png"}
                  alt="image"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full top-0 bottom-0 bg-gray-700 text-white px-4 py-2 rounded-md opacity-0 absolute cursor-pointer"
                />
              </div>
              {!imgUrl && <label className={styles.label}>Select photo</label>}
            </div>

            {/* Documents */}
            <div className={styles.fileInputWrapper}>
              <label className="block text-white text-center">
                Click to select Documents
              </label>
              <input
                type="file"
                multiple
                onChange={handleDocumentsChange}
                className={styles.fileInput}
              />
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 &&
              selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-gray-700 p-3 rounded-md max-w-md w-full"
                >
                  <ul className="list-disc list-inside text-gray-300">
                    <li className="flex justify-between">
                      {file.name}
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className={styles.removeButton}
                      >
                        Remove
                      </button>
                    </li>
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
