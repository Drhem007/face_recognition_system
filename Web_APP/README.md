# FaceID Recognition System

This project consists of a React-based dashboard to manage devices and a Python receiver script that runs on devices to receive files and perform facial recognition.

## System Overview

- **React Dashboard**: Manage devices, upload Excel files with student data, and set exam times
- **Python Receiver**: Runs on devices (like Raspberry Pi) to receive files and perform facial recognition

## Setup Instructions

### Dashboard (React)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

### Receiver (Python)

1. Install the required Python packages:
   ```bash
   pip install flask flask-cors
   ```

2. Run the Python receiver script:
   ```bash
   python python_receiver_example.py
   ```

The Python receiver will:
- Create an `uploads` folder for received files
- Listen on port 5000 for incoming connections
- Provide a `/status` endpoint for online status checks
- Handle file uploads on the `/upload` endpoint

## Network Requirements

For the system to work correctly:
- Both the device running the Dashboard and the device running the Python script must be on the same WiFi network
- Port 5000 must be open on the device running the Python script
- The correct IP address of the device must be entered in the Dashboard

## Testing Device Connectivity

You can test if a device is properly connected by:

1. Accessing `http://[DEVICE_IP]:5000/status` in a browser
2. If the device is online, you'll see a JSON response with the current status

## Troubleshooting

If files aren't being transferred:

1. Check that both devices are on the same network
2. Verify the IP address is correct in the Dashboard
3. Ensure the Python script is running on the device
4. Check that port 5000 is not blocked by a firewall
5. Look at the Python script's logs for any error messages

## Feature Overview

- Add and manage devices by IP address
- Real-time device online status check
- Upload Excel files to devices
- Configure exam start and end times
- Responsive dashboard interface

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
