# Inkspire
Inkspire: Smart QR-Based Printing Solution
Inkspire is a full-stack automated printing management system designed to eliminate long queues at college Xerox shops. It allows students to upload, customize, and pay for print jobs via a simple QR scan, while providing shop owners with a powerful dashboard to manage and approve orders.

🚀 The Problem & Solution
In busy college environments, the bottleneck in Xerox shops isn't the speed of the printer, but the time spent communicating customization settings (e.g., "Page 1-5 color, double-sided, 3 copies").

Inkspire solves this by:

Empowering Customers: Students handle the customization and payment on their own devices.

Streamlining Operations: Owners receive "ready-to-print" jobs with all settings pre-calculated and payments verified.

Automating Hardware: Integrated with a Print Agent to trigger silent printing once an order is approved.

✨ Key Features
For Customers (Mobile Web)
Scan & Go: No login required; scan the shop's permanent QR code to begin.

Deep Customization: Set page ranges, color modes (B&W/Color), single/double-sided, paper size, and copies.

Instant Pricing: Real-time price calculation based on the shop's specific rates.

Flexible Payments: Integrated with Razorpay for UPI/Google Pay and a "Cash at Counter" option.

For Shop Owners (Dashboard)
Live Order Queue: Real-time polling to catch new orders as they arrive.

Online/Offline Toggle: Control shop visibility to manage peak-hour traffic.

Dynamic Pricing: Set custom rates for black & white, color, and double-sided sheets, plus binding/stapling charges.

One-Click Approval: View files and approve jobs directly from the browser.

🛠️ Tech Stack
Frontend: React.js, Tailwind CSS, Lucide React icons.

Backend: Node.js, Express.js.

Database: MongoDB Atlas.

File Handling: Cloudinary API (secure, temporary storage).

Payments: Razorpay API.

Hardware Integration: Node.js Print Agent (for silent local printing).

🛡️ Security
JWT Authentication: Secure login for shop owners.

Data Privacy: Files are automatically deleted from the cloud storage once the print job is marked as "Completed."

CORS Protection: Restricted access to ensure secure communication between the frontend and backend.
