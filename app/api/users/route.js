import UserDevi from "@/models/UserDevi";
import { connectToDatabase } from "@/app/utils/mongoose";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config();

// ✅ Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ CORS handler function
const setCorsHeaders = (response) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
};

// ✅ Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCorsHeaders(response);
}

// ✅ Connect to MongoDB
async function connectDB() {
  await connectToDatabase();
}

// ✅ GET: Fetch users with search across multiple fields and pagination options
export async function GET(request) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  let search = searchParams.get("search") || "";
  search = search.toLowerCase();

  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;
  const skip = (page - 1) * limit;

  try {
    let users;

    if (id) {
      users = await UserDevi.findById(id);
      if (!users) {
        const response = NextResponse.json({ message: "User not found" }, { status: 404 });
        return setCorsHeaders(response);
      }

      const response = NextResponse.json(
        { message: "User fetched successfully", user: users },
        { status: 200 }
      );
      return setCorsHeaders(response);
    } else {
      const query = {
        $or: [
          { fullname: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };

      users = await UserDevi.find(query).skip(skip).limit(limit);
      const totalUsers = await UserDevi.countDocuments(query);

      const response = NextResponse.json(
        {
          message: "Users fetched successfully",
          users,
          totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
          currentPage: page,
        },
        { status: 200 }
      );
      return setCorsHeaders(response);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    const response = NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
    return setCorsHeaders(response);
  }
}

// ✅ POST: Create a new user and upload files to S3
export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const fullname = `${firstName} ${lastName}`;
    const email = formData.get("email");
    const phone = formData.get("phone");
    const files = formData.getAll("documents");
    const photoFile = formData.get("photo");

    if (!firstName || !lastName || !email || !phone) {
      const response = NextResponse.json({ message: "All fields are required" }, { status: 400 });
      return setCorsHeaders(response);
    }

    // ✅ Upload files to S3
    const documentUrls = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileKey = `fosla_documents/${Date.now()}-${file.name}`;

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      documentUrls.push(
        `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`
      );
    }

    // ✅ Upload photo if provided
    let photoUrl = "";
    if (photoFile) {
      const photoBuffer = Buffer.from(await photoFile.arrayBuffer());
      const photoKey = `fosla_documents/photos/${Date.now()}-${photoFile.name}`;

      const uploadPhotoParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: photoKey,
        Body: photoBuffer,
        ContentType: photoFile.type,
      };

      await s3Client.send(new PutObjectCommand(uploadPhotoParams));
      photoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${photoKey}`;
    }

    // ✅ Save to MongoDB
    const newUser = new UserDevi({
      firstname: firstName.toLowerCase(),
      lastname: lastName.toLowerCase(),
      fullname: fullname.toLowerCase(),
      email,
      phone,
      photo: photoUrl,
      documents: documentUrls,
    });

    await newUser.save();

    const response = NextResponse.json(
      { message: "User created successfully", user: newUser },
      { status: 201 }
    );
    return setCorsHeaders(response);
  } catch (error) {
    console.error("Error:", error);
    const response = NextResponse.json({ message: "Failed to create user" }, { status: 500 });
    return setCorsHeaders(response);
  }
}

// ✅ PUT: Update documents for a user with S3 uploads and removals
export async function PUT(request) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const user = await UserDevi.findById(id);
    if (!user) {
      const response = NextResponse.json({ message: "User not found" }, { status: 404 });
      return setCorsHeaders(response);
    }

    const formData = await request.formData();
    const files = formData.getAll("newDocuments");
    const removeDoc = formData.getAll("removeDocuments");

    const documentUrls = [];

    // ✅ Upload new files to S3
    if (files.length > 0) {
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileKey = `fosla_documents/${Date.now()}-${file.name}`;

        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: file.type,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        documentUrls.push(
          `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`
        );
      }
    }

    // ✅ Remove specified documents from S3
    if (removeDoc.length > 0) {
      for (const doc of removeDoc) {
        const fileKey = doc.replace(
          `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`,
          ""
        );

        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
        };

        try {
          await s3Client.send(new DeleteObjectCommand(deleteParams));
        } catch (error) {
          console.error(`Failed to delete ${fileKey}:`, error);
        }

        user.documents = user.documents.filter((item) => item !== doc);
      }
    }

    user.documents = [...user.documents, ...documentUrls];

    await user.save();

    const response = NextResponse.json(
      { message: "Documents updated successfully", documents: user.documents },
      { status: 200 }
    );
    return setCorsHeaders(response);
  } catch (e) {
    console.error("Error updating user:", e);
    const response = NextResponse.json({ message: "Failed to update user" }, { status: 500 });
    return setCorsHeaders(response);
  }
}
