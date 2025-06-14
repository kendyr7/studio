# BuildMaster - Gaming PC Purchase Tracker

BuildMaster is a web application designed to help users plan, track, and manage expenses for their custom PC builds. Whether you're building a dream gaming rig, a powerful workstation, or a budget-friendly setup, BuildMaster provides the tools to keep your component purchases organized and your budget in check.

The application allows users to create multiple build lists, add individual components with details like price and number of payments, log payments made, and get an overview of their spending against a set budget.

## Key Features

*   **User Authentication:** Secure sign-up and login using Email/Password powered by Firebase Auth.
*   **Multi-List Management:** Create and manage separate build lists for different PC projects.
*   **Component Tracking:**
    *   Add components with names, total prices, and detailed notes.
    *   Specify the number of expected payments for each component.
*   **Payment Logging:**
    *   Log individual payments made towards each component.
    *   Track paid amounts and remaining balances.
*   **Budget Control:**
    *   Set a total budget for each build list.
    *   Customize the currency symbol (e.g., $, €, £).
    *   Visualize budget usage with a progress bar and see if you're over or under budget.
*   **Item Status & Filtering:**
    *   Automatic status updates for items (Pending, Partially Paid, Paid).
    *   Filter components by their payment status.
    *   Search components by name.
    *   Sort components by name, price, amount paid, or status.
*   **Spending Calculation Control:** Toggle whether an item's cost and payments should be included in the overall budget spend calculation.
*   **Dashboard Summaries:**
    *   Per-list overview of total paid, total remaining, and budget status.
    *   Overall build progress summary with item status distribution charts.
*   **Theming:** Switch between different visual themes (BuildMaster Dark, Obsidian Dark, Arctic Light).
*   **Responsive Design:** User-friendly interface accessible on various devices.

## Tech Stack

*   **Frontend:**
    *   [Next.js](https://nextjs.org/) (React Framework)
    *   [React](https://reactjs.org/)
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [ShadCN UI](https://ui.shadcn.com/) (Component Library)
    *   [Tailwind CSS](https://tailwindcss.com/) (Styling)
    *   [Lucide React](https://lucide.dev/) (Icons)
    *   [Recharts](https://recharts.org/) (Charting)
*   **Backend & Database:**
    *   [Firebase](https://firebase.google.com/)
        *   **Firebase Authentication:** For user sign-up and login.
        *   **Cloud Firestore:** As the NoSQL database for storing build lists and items.
*   **AI (Planned/Integrated):**
    *   [Genkit](https://firebase.google.com/docs/genkit) (AI integration toolkit, currently configured but not actively used for core features)

## Getting Started

### Prerequisites

*   Node.js (v18 or newer recommended)
*   npm or yarn

### Firebase Setup

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).
2.  **Register a Web App:** In your Firebase project settings, add a new Web App.
3.  **Copy Firebase Configuration:** Firebase will provide a `firebaseConfig` object. You need to copy these credentials.
4.  **Update `src/lib/firebaseConfig.ts`:** Paste your `firebaseConfig` object into this file, replacing the placeholder.
5.  **Enable Authentication Methods:**
    *   In the Firebase Console, go to Authentication > Sign-in method.
    *   Enable "Email/Password".
6.  **Set up Cloud Firestore:**
    *   In the Firebase Console, go to Firestore Database.
    *   Click "Create database".
    *   Start in **production mode** (recommended) or test mode.
    *   Choose a Firestore location.
7.  **Configure Firestore Security Rules:**
    *   In Firestore Database > Rules, update your security rules to allow authenticated users to access their data. A secure starting point is provided in the comments of `src/lib/firebaseConfig.ts` or below:
      ```javascript
      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /buildLists/{listId} {
            allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
            allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
            match /items/{itemId} {
              allow read, write: if request.auth != null && get(/databases/$(database)/documents/buildLists/$(listId)).data.userId == request.auth.uid;
            }
          }
        }
      }
      ```
    *   **Publish** your rules.
8.  **Create Firestore Indexes (if prompted):** As you use the app, Firestore might require specific composite indexes for complex queries. The console error messages will usually provide a direct link to create these indexes.

### Installation & Running the App

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The app should now be running, typically on `http://localhost:9002`.

## Available Scripts

In the project directory, you can run:

*   `npm run dev`: Runs the app in development mode with Turbopack.
*   `npm run genkit:dev`: Starts the Genkit development server (for AI features, if used).
*   `npm run genkit:watch`: Starts Genkit in watch mode.
*   `npm run build`: Builds the app for production.
*   `npm run start`: Starts a production server (after building).
*   `npm run lint`: Lints the codebase using Next.js's built-in ESLint configuration.
*   `npm run typecheck`: Runs TypeScript type checking.

---

This README provides a good overview for anyone looking to understand, set up, or contribute to BuildMaster.
