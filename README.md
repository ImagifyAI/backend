# ImagifyAI Backend

## Project Overview
ImagefyAI is a web application that provides image processing services to users. The frontend is a React-based web application running on Cloudflare Pages. The frontend provides a user-friendly interface for users to upload images, select processing options, and view the processed images. The frontend communicates with the backend API to process the images and display the results to the user. The backend is running on Cloudflare Workers in conjunction with Cloudflare D1, Cloudflare R2, Cloudflare Workers AI for handling user registration, authentication, session handling, processing and storage of images, tagging the images using resnet50 model, searching images based on tags, and serving the processed images to the frontend.

## Repository Overview
The ImagifyAI Frontend is a JavaScript-based backend application designed to provide image processing services to users. This backend is hosted on Cloudflare Workers for serverless execution, scalability, and global reach. It leverages Cloudflare R2 for image storage, Cloudflare D1 to store image metadata and user information, and Cloudflare Workers AI for image tagging. Note that this repository is a part of the ImagifyAI project and is intended to be used in conjunction with the ImagifyAI frontend and other related services.

## Tech Stack
- Cloudflare Workers: Serverless execution environment for handling API requests and backend logic.
- Cloudflare Workers AI: Used for advanced image processing tasks, like auto-tagging or analysis.
- Cloudflare R2 (Object Storage): Stores and serves uploaded images.
- Cloudflare D1 (SQL Database): A structured relational database for storing image metadata and user information.
- Node.js: JavaScript runtime environment for backend logic.
- Vitest: Testing framework for verifying functionality.
- JSON Web Tokens (JWT): For secure user authentication and session management.
- Wrangler: CLI tool for deploying and managing Cloudflare Workers.

## Computing Stack - Backend
This project leverages Cloudflare's serverless architecture to ensure a secure, performant, and resilient backend infrastructure.

### 1. Cloudflare Workers
- Purpose: Executes serverless functions that process incoming API requests, manage routing, and handle authentication.
- Key Functionalities:
    - User Authentication: Manages secure login and registration through JWT.
    - API Endpoints: Routes requests to various endpoints for user actions (e.g., image upload, retrieval, search).
    - AI-powered Image Processing: Uses Workers AI for image analysis and auto-tagging.

### 2. Cloudflare R2 (Object Storage)
- Purpose: Stores and serves image files, enabling cost-effective, scalable object storage.
- Functionality in Backend:
    - Image Uploads: Handles storing uploaded image files.
    - Image Retrieval: Provides access to image files for the frontend, served securely via R2.

### 3. Cloudflare D1 (SQL Database)
- Purpose: Structured data storage for user information, image metadata, and search indexing.
- Functionality in Backend:
    - User Data: Stores and retrieves user details.
    - Image Metadata: Manages relational data for images (e.g., tags, upload timestamps, filenames).
    - Search Functionality: Enables SQL-based searches on tags and other metadata fields.

### 4. Workers AI
- Purpose: Enables advanced AI-driven image processing tasks such as auto-tagging, recognition, or analysis.
- Functionality in Backend:
    - Image Tagging: Automatically adds tags or labels to images on upload, supporting keyword-based search.
    - Enhanced Image Features: Potentially used for feature extraction or other AI-driven analyses on image data.

## Folder Structure
```
backend/
├── auth/                       # Authentication modules
│   ├── authMiddleware.js       # Middleware for verifying JWT tokens
│   ├── register.js             # Handles user registration
│   └── login.js                # Handles user login
├── utils/                      # Utility functions
│   ├── password.js             # Password hashing and verification
│   └── jwt.js                  # JWT token management
├── handlers/                   # API request handlers
│   ├── handleUpload.js         # Handles image upload and storage in R2
│   ├── handleGetImages.js      # Retrieves image metadata from D1
│   └── handleSearch.js         # Searches image metadata in D1
├── .github/
│   └── workflows/
│       └── cloudflare.yml      # CI/CD workflow for Cloudflare Workers deployment
├── .gitignore                  # Specifies files for Git to ignore
├── package.json                # Project dependencies and scripts configuration
├── vitest.config.js            # Vitest testing framework configuration
├── wrangler.toml               # Configuration for Cloudflare Workers, R2, D1, and AI bindings
└── README.md                   # Project documentation
```

## How It Works
### User Authentication:
- Register/Login: User registration and login are managed through JWT, using secure password hashing and token-based session management.
- Auth Middleware: Protects routes, ensuring only authenticated requests access user-specific data.

### Image Handling:
#### Upload: 
- Images uploaded through the frontend are processed in handleUpload.js, stored securely in Cloudflare R2, and passed to Workers AI for auto-tagging.
- Retrieve & Search: Metadata for images is stored in D1, supporting retrieval and keyword-based searches, enhancing user access to stored content.

### AI Processing:
- Auto-Tagging: Workers AI tags images automatically upon upload, enriching metadata for better search and organization.


### Development & Contribution
Clone the Repository:

```bash
git clone https://github.com/ImagifyAI/backend.git
```

Navigate to the Project Directory:
```bash
cd backend
```

Install Dependencies:
```bash
npm install
```

Start Development Server:
```bash
npm start
```

### To Do
- **Use Cloudflare Turnstile to enhance security & privacy by detecting and blocking bot traffic**
- **Use Cloudflare Images to implement image processing feature, allowing users to select multiple images for conversion to different formats**
- **Use Cloudflare Durable Objects for storing image processing session data, enabling users to resume processing sessions across devices**