# Vision Vault - Smart Photo Gallery

This repository contains a full-stack, serverless web application that allows users to upload photos, automatically indexes them using Machine Learning, and searches them using Natural Language Processing.

## Architecture & Tech Stack

**Backend (AWS Serverless)**
* **AWS Lambda (Python 3.9):** Handles image indexing and search requests.
* **Amazon OpenSearch:** Stores image metadata and handles fast full-text queries.
* **Amazon S3:** Object storage for uploaded photos.
* **Amazon Rekognition:** Computer Vision AI to automatically label objects in uploaded photos.
* **Amazon Lex V2:** NLP AI to parse and understand natural language search queries.
* **Amazon API Gateway:** Exposes backend Lambda functions as a secure RESTful API.
* **Terraform (IaC):** Infrastructure as Code to provision all AWS resources seamlessly.

**Frontend (Modern React)**
* **React 18 & Vite:** Lightning-fast, component-based frontend framework.
* **Tailwind CSS:** Utility-first CSS framework for a beautiful, responsive UI.
* **Axios:** For executing secure API requests.

---

## 🚀 How to Run the Modern Frontend (React)

We have upgraded the legacy HTML/JS frontend to a modern **React + Vite** application.

1. Navigate to the modern frontend directory:
   ```bash
   cd frontend-react
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your API Gateway endpoint:
   Create a `.env.local` file in the `frontend-react` folder:
   ```
   VITE_API_URL=https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/v1
   VITE_API_KEY=1anI1JHNZtaFEwxoG8UEn7exdCvdsRT02NljyLuq
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## ☁️ Infrastructure Deployment (Terraform)

Instead of manually configuring AWS resources in the console, you can now deploy the entire backend using Infrastructure as Code (IaC). This is located in the `infrastructure/` directory.

```bash
cd infrastructure
terraform init
terraform apply
```
*(Ensure you have your AWS CLI credentials configured locally before running Terraform)*.

---
