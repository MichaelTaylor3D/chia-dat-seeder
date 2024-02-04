const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const superagent = require("superagent");
const EventEmitter = require("events");

class FileMonitor extends EventEmitter {
  constructor(
    dirPath,
    serverUrl,
    authCredentials = null,
    throttleDelay = 1000
  ) {
    super(); // Call EventEmitter constructor
    this.dirPath = dirPath;
    this.serverUrl = serverUrl;
    this.throttleDelay = throttleDelay;
    this.authCredentials = authCredentials;
    this.pushedFilesPath = path.join(this.dirPath, "pushedFiles.json");
    this.pushedFiles = this.loadPushedFiles();
    this.fileQueue = [];
    this.isProcessing = false;
  }

  loadPushedFiles() {
    try {
      return JSON.parse(fs.readFileSync(this.pushedFilesPath, "utf8"));
    } catch (error) {
      return {};
    }
  }

  savePushedFile(filename) {
    this.pushedFiles[filename] = true;
    fs.writeFileSync(
      this.pushedFilesPath,
      JSON.stringify(this.pushedFiles, null, 2)
    );
  }

  queueFile(filePath) {
    this.fileQueue.push(filePath);
    this.emit("queueLengthChanged", this.fileQueue.length); // Emit queue length change event
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.fileQueue.length === 0) return;
    this.isProcessing = true;

    const filePath = this.fileQueue.shift();
    await this.pushFile(filePath);

    this.emit("queueLengthChanged", this.fileQueue.length); // Emit queue length change event

    setTimeout(() => {
      this.isProcessing = false;
      this.processQueue();
    }, this.throttleDelay);
  }

  async pushFile(filePath) {
    const filename = path.basename(filePath);
    const fileExtension = path.extname(filename);

    if (fileExtension !== ".dat") {
      console.log(`Skipping file (not a .dat file): ${filename}`);
      return;
    }

    const storeId = filename.split("-")[0]; // Extract store_id from filename

    if (this.pushedFiles[filename]) {
      console.log(`File already pushed: ${filename}`);
      return;
    }

    try {
      let request = superagent
        .post(this.serverUrl)
        .send({ store_id: storeId, filename });

      // If auth credentials are provided, use basic auth
      if (this.authCredentials) {
        const { username, password } = this.authCredentials;
        request = request.auth(username, password);
      }

      const presignedPostResponse = await request;

      const { presignedPost } = presignedPostResponse.body;

      if (!presignedPost) {
        console.log(`No presigned post received for file: ${filename}`);
        return;
      }

      // Use pre-signed post data to upload the file to S3
      const uploadRequest = superagent.post(presignedPost.url);
      Object.keys(presignedPost.fields).forEach((key) => {
        uploadRequest.field(key, presignedPost.fields[key]);
      });
      await uploadRequest.attach("file", fs.createReadStream(filePath));

      this.savePushedFile(filename);
      console.log(`File pushed to S3: ${filename}`);
    } catch (error) {
      console.error(`Error pushing file ${filename}:`, error);
    }
  }

  setAuthCredentials(authCredentials) {
    this.authCredentials = authCredentials;
    if (!this.isStarted) {
      this.start();
    }
  }

  async start() {
    this.isStarted = true;

    const waitForAuth = () => {
      if (!this.authCredentials) {
        console.log("Waiting for authentication credentials...");
        setTimeout(waitForAuth, 30000); // Check again in 30 seconds
      } else {
        this.beginMonitoring();
      }
    };

    waitForAuth();
  }

  async beginMonitoring() {
    fs.readdir(this.dirPath, (err, files) => {
      if (err) {
        console.error("Error reading directory:", err);
        return;
      }

      files.forEach((file) => {
        const filePath = path.join(this.dirPath, file);
        this.queueFile(filePath);
      });
    });

    const watcher = chokidar.watch(this.dirPath, {
      ignored: this.pushedFilesPath,
    });
    watcher.on("add", (filePath) => this.queueFile(filePath));
  }
}

module.exports = FileMonitor;
