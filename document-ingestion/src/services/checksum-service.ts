import fs from "fs";
import crypto from "crypto";

const MANIFEST_FILE = "./checksums.json";

/**
 * Service to compute file checksums and maintain a local manifest to prevent re-ingestion.
 */
export class ChecksumService {
  /**
   * Compute a SHA-256 checksum for a file.
   * This can be used to detect if the file has been ingested before.
   *
   * @param filePath - Path to the file
   * @returns SHA-256 hash as a hex string
   */
  public async compute(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      const stream = fs.createReadStream(filePath);

      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err: Error) => reject(err));
    });
  }

  /**
   * Load the checksum manifest from disk.
   * The manifest maps checksum strings to file paths that have already been processed.
   *
   * @returns Object mapping checksum -> file path
   */
  public loadManifest(): Record<string, string> {
    if (!fs.existsSync(MANIFEST_FILE)) {
      return {};
    }
    try {
      const data = fs.readFileSync(MANIFEST_FILE, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      console.error("🚫 Failed to read manifest:", err);
      return {};
    }
  }

  /**
   * Save a checksum manifest to disk.
   *
   * @param manifest - Object mapping checksum -> file path
   */
  public saveManifest(manifest: Record<string, string>) {
    try {
      fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), "utf-8");
    } catch (err) {
      console.error("🚫 Failed to save manifest:", err);
    }
  }
}
