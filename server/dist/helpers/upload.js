"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalUploads = finalUploads;
const cloudinary_1 = require("cloudinary");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
});
async function finalUploads(roomId) {
    const finalRecordingDir = path_1.default.join(__dirname, '../../final-recordings');
    const finalRecordingFiles = fs_1.default.readdirSync(finalRecordingDir).filter(f => f.startsWith(roomId));
    for (const file of finalRecordingFiles) {
        try {
            const lastPart = file.split("_").pop();
            const clipNum = lastPart
                ? parseInt(lastPart.replace(".mp4", ""), 10)
                : NaN;
            const fullPath = path_1.default.join(finalRecordingDir, file);
            await uploadClip(fullPath, roomId, clipNum);
            console.log(`${file} uploaded successfully`);
        }
        catch (e) {
            console.error("Error while uploading", file, e);
        }
    }
}
async function uploadClip(filePath, roomId, clipNum) {
    let attempt = 0, retries = 3;
    while (attempt < retries) {
        try {
            return await new Promise((resolve, reject) => {
                cloudinary_1.v2.uploader.upload(filePath, {
                    resource_type: "video",
                    folder: `recordings/${roomId}`,
                    public_id: `clip_${clipNum}`,
                    context: { roomId, clipNum: String(clipNum) },
                }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
            });
        }
        catch (err) {
            attempt++;
            console.warn(`Upload failed (attempt ${attempt}) for clip ${clipNum}`, err);
            if (attempt >= retries)
                throw err;
            await new Promise((res) => setTimeout(res, 2000 * attempt)); // backoff
        }
    }
}
