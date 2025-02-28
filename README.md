# Investrix

## Overview
This is a Next.js web application that leverages AI to match investors with Small and Medium Enterprises (SMEs). The platform features a bidding system for payments built on top of the Aptos blockchain and uses Gemini AI for document verification.

## Features
- **AI-powered Matching**: Uses machine learning to connect investors with the most relevant SMEs based on their profiles and investment preferences.
- **Aptos-based Bidding System**: Secure and transparent bidding for funding using the Aptos blockchain.
- **Gemini AI for Document Verification**: Ensures the authenticity of SME documents to prevent fraud.
- **Secure Authentication**: Integrated with NextAuth for user authentication.
- **Scalable Architecture**: Built using Next.js for a fast and efficient frontend experience.

## Tech Stack
- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, Express.js, GraphQL
- **Database & Auth**: Firebase
- **AI Services**: Gemini API for document verification and investor-SME matching
- **Blockchain**: Aptos for payment bidding system

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/adithyanotfound/investrix-final.git
   cd investor-sme-platform
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file and add the necessary environment variables

4. Start the development server:
   ```sh
   npm run dev
   ```

## Usage
1. **Register/Login**: Users can sign up as investors or SMEs using NextAuth.
2. **Create Profiles**: Investors and SMEs set up their profiles with relevant details.
3. **AI Matching**: The system suggests ideal matches based on AI analysis.
4. **Bidding System**: Investors place bids on SMEs they are interested in funding.
5. **Document Verification**: SMEs upload documents, which are verified using Gemini AI.
6. **Funding & Transactions**: Approved transactions are recorded on the Aptos blockchain.

## Contributing
1. Fork the repository.
2. Create a new branch (`feature-branch`).
3. Commit your changes.
4. Push to the branch and create a PR.

## Contact
For support, contact: `your-email@example.com`
