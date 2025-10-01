import { v2 as cloudinary } from "cloudinary";

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// Debugging: check if env variables are loading
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.error("❌ Cloudinary config missing! Check your .env file.");
} else {
  console.log("✅ Cloudinary connected:", process.env.CLOUDINARY_CLOUD_NAME);
}

// ✅ Upload Function
const uploadImageCloudinary = async (filePath) => {
  try {
    if (!filePath) throw new Error("No file path provided");

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "categories",   // optional folder
      resource_type: "auto",  // auto handle image/video/pdf etc.
    });

    console.log("✅ Cloudinary Upload Success:", result.secure_url);
    return result;

  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error.message);
    throw new Error("Cloudinary upload failed: " + error.message);
  }
};
// Upload from buffer
export async function uploadImageCloudinaryFromBuffer(buffer, folder = "avatars") {
  return new Promise((resolve, reject) => {
    if (!buffer) return reject(new Error("No buffer provided"));

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(buffer);
  });
}


export default uploadImageCloudinary;
