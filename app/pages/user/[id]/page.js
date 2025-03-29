"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import mammoth from "mammoth";
import Loader from "@/app/components/Loader";

export default function Page() {
  const { id } = useParams();
  const [userDetails, setUserDetails] = useState(null);
  const [docxContent, setDocxContent] = useState("");
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [documentsToRemove, setDocumentsToRemove] = useState([]);

  // Fetch user details
  useEffect(() => {
    if (id) {
      axios
        .get(`http://localhost:3000/api/users?id=${id}`)
        .then((response) => {
          setUserDetails(response.data.user);
          setDocuments(response.data.user.documents);
        })
        .catch((error) => {
          console.error("Error fetching user details:", error);
        });
    }
  }, [id]);

  const loadDocxFile = async (docUrl) => {
    try {
      const response = await axios.get(docUrl, { responseType: "arraybuffer" });
      const arrayBuffer = response.data;
      const { value } = await mammoth.convertToHtml({ arrayBuffer });
      setDocxContent(value);
    } catch (error) {
      console.error("Error loading DOCX file:", error);
    }
  };

  useEffect(() => {
    if (documents.length > 0) {
      const firstDoc = documents[0];
      const fileExtension = firstDoc.split(".").pop().toLowerCase();
      if (fileExtension === "docx") {
        loadDocxFile(firstDoc);
      }
    }
  }, [documents]);

  if (!userDetails) return <Loader />;

  const renderDocumentPreview = (doc) => {
    const fileExtension = doc.split(".").pop().toLowerCase();

    switch (fileExtension) {
      case "pdf":
        return (
          <iframe
            src={doc}
            className="w-full h-32 border border-gray-300 rounded"
            title="PDF Preview"
            frameBorder="0"
          ></iframe>
        );
      case "jpg":
      case "jpeg":
      case "png":
      case "webp":
        return (
          <img
            src={doc}
            alt="Image Preview"
            className="w-full h-32 object-cover border border-gray-300 rounded"
          />
        );
      case "docx":
        return (
          <div
            className="w-full h-32 border border-gray-300 rounded overflow-scroll"
            dangerouslySetInnerHTML={{ __html: docxContent }}
          ></div>
        );
      default:
        return <p className="text-gray-400">Preview not available</p>;
    }
  };

  const handleRemoveDocument = (index) => {
    const updatedDocuments = [...documents];
    const removedDocument = updatedDocuments[index];
    updatedDocuments.splice(index, 1);
    setDocuments(updatedDocuments);
    setDocumentsToRemove([...documentsToRemove, removedDocument]);
  };

  const removeSelectedFile = (indexToRemove) => {
    setNewDocuments((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleAddDocument = (event) => {
    const newFiles = Array.from(event.target.files);
    setNewDocuments((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleSaveChanges = async () => {
    const formData = new FormData();
    formData.append("id", id);

    documentsToRemove.forEach((doc) => {
      formData.append("removeDocuments", doc);
    });

    newDocuments.forEach((files) => {
      formData.append(`newDocuments`, files);
    });

    try {
      const response = await axios.put(
        `http://localhost:3000/api/users?id=${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setNewDocuments([]);
      setDocumentsToRemove([]);
      setDocuments(response.data.documents);
    } catch (error) {
      console.error("Error updating documents:", error);
    }
  };

  const handleDownloadDocument = (filePath) => {
    const link = document.createElement("a");
    link.href = filePath;  // Use direct URL from S3
    link.download = filePath.split("/").pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = (filePath) => {
    window.open(filePath, "_blank");
  };

  return (
    <div className="p-6 bg-[rgba(31,41,55,0.5)] h-full overflow-auto">
      <div className="flex gap-4">
        <div className="flex flex-col items-center mb-8 flex-1 gap-3">
          <div className="flex flex-col items-center">
            <img
              src={userDetails.photo || "/dummy.png"}
              alt={`${userDetails.firstname} ${userDetails.lastname}`}
              className="w-32 h-32 object-cover rounded-full border-4 border-blue-300 mb-4"
            />
            <h1 className="text-3xl font-bold text-center mb-4 capitalize">
              {userDetails.firstname} {userDetails.lastname}
            </h1>
            <p className="text-xl text-white">Email: {userDetails.email}</p>
            <p className="text-xl text-white">Phone: {userDetails.phone}</p>
          </div>

          {(newDocuments.length > 0 || documentsToRemove.length > 0) && (
            <div className="flex w-full justify-end">
              <button
                onClick={handleSaveChanges}
                className="text-white bg-green-500 hover:bg-green-600 rounded py-2 px-4 min-w-md w-full"
              >
                Save Changes
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-5 justify-center overflow-scroll border w-full p-3">
            {documents && documents.length > 0 ? (
              documents.map((doc, index) => (
                <div
                  key={index}
                  className="bg-gray-800 shadow-md rounded-lg p-4 hover:shadow-lg transition min-w-96 cursor-pointer"
                  onClick={() => handleOpenInNewTab(doc)}
                >
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-2">{`Document ${index + 1}`}</h3>
                    {renderDocumentPreview(doc)}
                    <div className="mt-4 flex space-x-2">
                      <button
                        className="text-white bg-red-500 hover:bg-red-600 rounded py-2 px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDocument(index);
                        }}
                      >
                        Remove
                      </button>
                      <button
                        className="text-white bg-blue-500 hover:bg-blue-600 rounded py-2 px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadDocument(doc);
                        }}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-lg">
                No Documents Available
              </div>
            )}
          </div>

          {/* Click to Add More Documents */}
          <div
            className="mt-4 w-full p-4 border-2 border-dashed border-gray-500 hover:border-blue-500 text-center cursor-pointer"
            onClick={() => document.getElementById("file-input").click()}
          >
            <p className="text-gray-300">Click to Add More Documents</p>
            <input
              id="file-input"
              type="file"
              multiple
              onChange={handleAddDocument}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
