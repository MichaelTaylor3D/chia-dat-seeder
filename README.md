# FileMonitor

The `FileMonitor` module is designed to monitor a specified directory for new `.dat` files and automatically upload them to an AWS S3 bucket using pre-signed URLs obtained from a specified server. This module supports adding or updating basic authentication credentials after instantiation and implements a throttling mechanism to control the upload rate. Additionally, it provides real-time monitoring of the upload queue length through an event emitter.

## Features

- Monitors a directory for new `.dat` files.
- Uploads files using pre-signed URLs obtained from a server.
- Supports adding or updating basic authentication credentials dynamically.
- Throttles file uploads to prevent server overload.
- Provides real-time queue length monitoring through event emitter.

## Installation

To use the `FileMonitor` module in your project, follow these steps:

1. Ensure Node.js is installed on your system.
2. Clone or download the `FileMonitor` module into your project directory.
3. Navigate to the module directory and run `npm install` to install dependencies.

```bash
cd path/to/FileMonitor
npm install
```

## Usage

### Creating an Instance

Create an instance of the `FileMonitor` class, specifying the directory to monitor and the server URL to obtain pre-signed URLs for uploading:

```javascript
const FileMonitor = require('path/to/FileMonitor');

const monitor = new FileMonitor('/path/to/watch', 'http://yourserver.com/url');
```

### Setting Authentication Credentials

If your server requires basic authentication, set the credentials using the `setAuthCredentials` method:

```javascript
monitor.setAuthCredentials({
  username: 'yourUsername',
  password: 'yourPassword'
});
```

This method can be called anytime, even after calling `start` on the monitor, to add or update the credentials.

### Starting the Monitor

Call the `start` method to begin monitoring the directory. If authentication credentials are not set at the time `start` is called, the monitor will wait for 30 seconds and check again, repeating this process until credentials are provided:

```javascript
monitor.start();
```

### Monitoring Queue Length Changes

Listen for `queueLengthChanged` events to monitor changes in the upload queue length in real-time:

```javascript
monitor.on('queueLengthChanged', (newLength) => {
  console.log(`Queue length is now: ${newLength}`);
});
```

## Events

- `queueLengthChanged`: Emitted whenever the upload queue length changes, providing the new queue length as an argument.

## Contributing

Contributions to the `FileMonitor` module are welcome. Please adhere to the standard fork, branch, and pull request workflow.

## License

This module is released under the MIT License.