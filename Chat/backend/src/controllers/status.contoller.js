import Status from "../modals/status.modal.js";
import cloudinary from "../lib/cloudinary.js";

export const addStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { image } = req.body;
    console.log("add status");
    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }
    const uploadedResponse = await cloudinary.uploader.upload(image);
    const image_url = uploadedResponse.secure_url;
    let status = await Status.create({
      userId,
      image: image_url,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    status = await status.populate("userId", "fullName profilePic");
    res.status(200).json(status);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    }).populate("userId", "profilePic fullName");
    res.status(200).json(statuses);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
