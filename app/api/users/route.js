import UserDevi from "@/models/UserDevi";
import { connectToDatabase } from "@/app/utils/mongoose";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import dotenv from "dotenv";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();


// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Connect to MongoDB
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
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "User fetched successfully", user: users },
        { status: 200 }
      );
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

      return NextResponse.json(
        {
          message: "Users fetched successfully",
          users,
          totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
          currentPage: page,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Upload files to S3
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

    // Upload photo if provided
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

    // Save to MongoDB
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

    return NextResponse.json(
      { message: "User created successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 }
    );
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
      return NextResponse.json({ message: "User not found" }, { status: 404 });
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
        // Extract the file key from the S3 URL
        const fileKey = doc.replace(
          `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`,
          ""
        );

        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
        };

        try {
          await s3Client.send(new DeleteObjectCommand(deleteParams));  // Deleting from S3
          console.log(`Deleted: ${fileKey}`);
        } catch (error) {
          console.error(`Failed to delete ${fileKey}:`, error);
        }

        // Remove the deleted document from MongoDB
        user.documents = user.documents.filter((item) => item !== doc);
      }
    }

    // ✅ Combine existing and new documents
    user.documents = [...user.documents, ...documentUrls];

    await user.save();

    return NextResponse.json(
      { message: "Documents updated successfully", documents: user.documents },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error updating user:", e);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}