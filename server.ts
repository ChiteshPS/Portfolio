import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Factual Knowledge Base for Chitesh P S
const PORTFOLIO_KNOWLEDGE = `
FACTUAL PORTFOLIO KNOWLEDGE BASE FOR CHITESH P S:

1. PERSONAL & SUMMARY:
- Full Name: Chitesh P S
- Title/Role: AI / ML Developer | Computer Vision Specialist | Software Developer
- Email: chiteshsoundar696@gmail.com
- Location: Tamil Nadu, India
- GitHub: https://github.com/ChiteshPS
- LinkedIn: https://linkedin.com/in/chiteshsoundar
- Summary: Information Technology undergraduate at Sri Ramakrishna Institute of Technology (SRIT) with a 8.5/10 CGPA. Passionate about machine learning, computer vision, legal NLP transformer systems, and cloud infrastructure. Has hands-on software development internship experience and Alibaba Cloud certification.

2. EDUCATION:
- Degree: B.Tech in Information Technology
- Institution: Sri Ramakrishna Institute of Technology (SRIT)
- Period: 2023 – 2027
- Academic Standing / Score: CGPA 8.5 / 10
- Higher Secondary (12th Grade): State Board Examination — 87% Distinction.

3. INTERNSHIP EXPERIENCE:
- Company: Global Softwares
- Role: Software Development Intern
- Duration / Period: June 2025
- Responsibilities & Skills Applied: Assisted in full-stack application development, software debugging, automated/manual testing, database administration (SQL), RESTful microservices, and collaborative Git/Linux workflows.

4. PROJECTS & ARCHITECTURES:
- PROJECT 1: AI-Powered Contract Clause Detection & Risk Analysis System
  - Category: NLP & Legal AI
  - Highlight: Fine-tuned Legal-BERT & spaCy pipeline for automated risk scoring.
  - Tech Stack: Python, Flask, PostgreSQL, Legal-BERT, spaCy, SQLAlchemy, JWT, Railway, Vercel
  - Problem Solved: Manual review of legal contracts is time-consuming and error-prone.
  - Solution: Built an NLP processing engine using Legal-BERT to automatically classify clauses, extract liabilities, and assign risk levels. Deployed backend on Railway and frontend on Vercel.
  - Sequential Pipeline: Document Input -> Text Processing (spaCy) -> NLP Tokenization -> Legal-BERT Model -> Clause Extraction -> Risk Classification -> Risk Assessment Output

- PROJECT 2: AI-Based Breed Recognition System for Indian Cattle & Buffaloes
  - Category: Computer Vision & Agriculture
  - Highlight: Top-3 breed probability output using CNN & OpenCV image preprocessing.
  - Tech Stack: Python, CNN, OpenCV, PyTorch / TensorFlow, Computer Vision
  - Problem Solved: Identifying indigenous livestock breeds accurately for farm management and government record-keeping.
  - Solution: Developed a deep convolutional neural network (CNN) trained on indigenous cattle and buffalo image datasets with OpenCV image augmentations. Provides Top-3 breed likelihood predictions.
  - Proposed Integration: Designed a proposed API schema for field deployment with the Bharat Pashudhan livestock platform (proposed architecture).
  - Sequential Pipeline: Image Capture -> OpenCV Augmentation & Normalization -> CNN Feature Extraction -> Multi-class Classification -> Top-3 Breed Predictions

- PROJECT 3: Mango Ripening Detection System
  - Category: Real-time Object Detection
  - Highlight: YOLOv8 model for multi-stage ripeness classification.
  - Tech Stack: Python, YOLOv8, OpenCV, Roboflow, PyTorch
  - Problem Solved: Sorting agricultural produce manually causes quality inconsistency and fruit wastage.
  - Solution: Fine-tuned YOLOv8 model on custom mango datasets annotated via Roboflow to classify ripeness stages in real-time camera streams.
  - Sequential Pipeline: Visual Stream Input -> Preprocessing -> YOLOv8 Inference -> Ripeness Stage Detection -> Output Stage Label

5. TECHNICAL SKILLS & TOOLS:
- AI & Computer Vision: Machine Learning, Computer Vision, OpenCV, YOLOv8, Image Classification, Legal-BERT, spaCy, CNN
- Programming Languages: Python (Primary language for AI/ML), C, C++, Java, PHP, SQL
- Web & Backend: React.js, Flask, RESTful APIs, PostgreSQL, SQLAlchemy ORM, JavaScript/TypeScript
- Cloud & Operations: Alibaba Cloud (Certified ACA), Cloud Computing, Git, Linux CLI, Railway, Vercel

6. CERTIFICATIONS:
- Alibaba Cloud Certified Associate (ACA) in Cloud Computing & Infrastructure
- Computer Vision & Deep Learning Specialization
- Applied AI & Machine Learning Certification (SRIT)

7. KEY STRENGTHS & HIGHLIGHTS FOR RECRUITERS:
- Strong foundation in computer vision (OpenCV, YOLOv8, CNNs) and specialized NLP (Legal-BERT, spaCy).
- Full-stack capability with Python/Flask backends, SQL databases, and modern React interfaces.
- Real-world software engineering internship experience at Global Softwares.
- Certified in Cloud Computing (Alibaba Cloud ACA).
`;

const SYSTEM_INSTRUCTION = `
You are CHITESH AI, the official AI recruiter and portfolio assistant for Chitesh P S.
Your mission is to answer any recruiter, hiring manager, or technical interviewer questions regarding Chitesh's background, education, projects, skills, internship experience, certifications, and capabilities accurately and thoroughly.

FORMATTING REQUIREMENTS:
1. Provide helpful, comprehensive, professional, and detailed answers based on Chitesh's portfolio in plain, clean, understandable language.
2. DO NOT use hashtags (#) or asterisks (*) anywhere in your responses. Do not use markdown headers or bold/italic asterisk markers.
3. Use simple bullet points with dashes (-), clean numbered lists, and paragraph breaks for clarity.
4. Be enthusiastic, confident, and articulate about Chitesh's technical strengths in AI/ML, Computer Vision, and Software Engineering.
5. If asked about contact info, provide his email (chiteshsoundar696@gmail.com), GitHub, and LinkedIn links cleanly.
6. If asked about a question completely unrelated to Chitesh or software/careers, politely bring the topic back to Chitesh's qualifications.
7. Always answer in English.
`;

// Helper function to strip hashtag (#) and asterisk (*) symbols for clean text
function cleanResponseText(text: string): string {
  if (!text) return "";
  return text
    // Remove markdown heading hashtags at start of lines (e.g. ### Header -> Header)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove all remaining hashtag symbols
    .replace(/#/g, '')
    // Remove all asterisk symbols (*, **, ***)
    .replace(/\*{1,3}/g, '')
    // Clean up links formatted like [text](url) -> text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    // Clean up excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Smart Local Fallback Answer Generator if API is unreachable or returns empty
function getLocalFallbackAnswer(query: string, projectContext?: string): string {
  const q = query.toLowerCase();

  if (q.includes('contract') || q.includes('legal') || q.includes('bert') || (projectContext && projectContext.toLowerCase().includes('contract'))) {
    return cleanResponseText(
      `Project 01: AI-Powered Contract Clause Detection & Risk Analysis System\n\n` +
      `Chitesh developed an NLP legal intelligence system designed to automate contract review and risk scoring:\n\n` +
      `- Domain & Focus: Natural Language Processing (NLP) & Legal Tech\n` +
      `- Core AI Model: Fine-tuned Legal-BERT transformer model paired with spaCy text processing\n` +
      `- Tech Stack: Python, Flask, PostgreSQL, SQLAlchemy ORM, JWT Authentication, Railway (Backend), Vercel (Frontend)\n` +
      `- Problem Solved: Traditional manual legal contract auditing is slow and prone to human oversight.\n` +
      `- Architecture Pipeline: Contract Upload -> Text Extraction & Preprocessing (spaCy) -> Tokenization -> Legal-BERT Inference -> Clause Classification -> Automated Risk Level Assessment\n` +
      `- Key Highlights: Microservice backend secured with JWT, custom relational schemas for clause tagging, and production cloud hosting.`
    );
  }

  if (q.includes('cattle') || q.includes('buffalo') || q.includes('breed') || q.includes('pashudhan') || (projectContext && projectContext.toLowerCase().includes('breed'))) {
    return cleanResponseText(
      `Project 02: AI-Based Breed Recognition System for Indian Cattle & Buffaloes\n\n` +
      `Chitesh created a Computer Vision classification system tailored for indigenous Indian livestock:\n\n` +
      `- Domain: Computer Vision & Smart Agriculture\n` +
      `- Architecture: Deep Convolutional Neural Network (CNN) with OpenCV image preprocessing\n` +
      `- Tech Stack: Python, PyTorch / TensorFlow, CNN, OpenCV, Computer Vision\n` +
      `- Output: Generates Top-3 breed likelihood probabilities for fine-grained classification.\n` +
      `- Proposed Deployment: Includes a proposed API schema for field deployment with the Bharat Pashudhan livestock management system.\n` +
      `- Pipeline: Image Capture -> OpenCV Augmentation & Normalization -> CNN Feature Extraction -> Multi-class Softmax Classification -> Top-3 Breed Ranking`
    );
  }

  if (q.includes('mango') || q.includes('ripening') || q.includes('yolo') || (projectContext && projectContext.toLowerCase().includes('mango'))) {
    return cleanResponseText(
      `Project 03: Mango Ripening Detection System\n\n` +
      `Chitesh built a real-time computer vision object detection model for agricultural quality sorting:\n\n` +
      `- Domain: Real-time Computer Vision & Object Detection\n` +
      `- Core Model: Fine-tuned YOLOv8 object detection framework\n` +
      `- Tech Stack: Python, YOLOv8, OpenCV, Roboflow dataset annotation, PyTorch\n` +
      `- Problem Solved: Manual fruit sorting leads to post-harvest wastage and inconsistent market grading.\n` +
      `- Key Capabilities: Real-time object bounding box localization and ripeness stage classification directly from camera streams.`
    );
  }

  if (q.includes('project') || q.includes('portfolio') || q.includes('built')) {
    return cleanResponseText(
      `Key AI & Software Projects by Chitesh P S\n\n` +
      `Chitesh has built 3 major intelligent systems across NLP, Computer Vision, and Real-time Object Detection:\n\n` +
      `1. AI-Powered Contract Clause Detection & Risk Analysis System\n` +
      `   - Fine-tuned Legal-BERT + spaCy for legal risk classification.\n` +
      `   - Built with Python, Flask, PostgreSQL, SQLAlchemy, JWT, Railway & Vercel.\n\n` +
      `2. AI-Based Breed Recognition System for Indian Cattle & Buffaloes\n` +
      `   - CNN & OpenCV model yielding Top-3 breed predictions.\n` +
      `   - Designed with a proposed API architecture for Bharat Pashudhan integration.\n\n` +
      `3. Mango Ripening Detection System\n` +
      `   - Real-time YOLOv8 object detection & ripeness classification model annotated via Roboflow.\n\n` +
      `Feel free to ask for deeper technical breakdowns of any specific project!`
    );
  }

  if (q.includes('intern') || q.includes('experience') || q.includes('global') || q.includes('work')) {
    return cleanResponseText(
      `Internship Experience at Global Softwares\n\n` +
      `- Role: Software Development Intern\n` +
      `- Company: Global Softwares\n` +
      `- Period: June 2025\n` +
      `- Engineering Contributions:\n` +
      `  - Assisted in full-stack web application development and RESTful API engineering.\n` +
      `  - Managed software debugging, code maintenance, and automated/manual testing pipelines.\n` +
      `  - Maintained relational database schemas and SQL query optimization.\n` +
      `  - Worked within collaborative agile development workflows utilizing Git and Linux environments.`
    );
  }

  if (q.includes('skill') || q.includes('language') || q.includes('python') || q.includes('stack') || q.includes('technology')) {
    return cleanResponseText(
      `Technical Skills Taxonomy\n\n` +
      `- AI / ML & Computer Vision: Machine Learning, Computer Vision, OpenCV, YOLOv8, CNN, Legal-BERT, spaCy, Image Classification\n` +
      `- Programming Languages: Python (Primary for AI/ML), C, C++, Java, PHP, SQL\n` +
      `- Web & Backend: React.js, Flask, REST APIs, PostgreSQL, SQLAlchemy ORM, JavaScript / TypeScript\n` +
      `- Cloud & Tools: Alibaba Cloud (Certified ACA), Git, Linux CLI, Railway, Vercel, Roboflow`
    );
  }

  if (q.includes('education') || q.includes('cgpa') || q.includes('college') || q.includes('srit') || q.includes('gpa')) {
    return cleanResponseText(
      `Academic Background\n\n` +
      `- Degree: B.Tech in Information Technology\n` +
      `- Institution: Sri Ramakrishna Institute of Technology (SRIT)\n` +
      `- Timeline: 2023 - 2027\n` +
      `- Academic Score: CGPA 8.5 / 10\n` +
      `- 12th Grade: State Board Distinction - 87%`
    );
  }

  if (q.includes('certif') || q.includes('alibaba') || q.includes('cloud') || q.includes('aca')) {
    return cleanResponseText(
      `Certifications & Credentials\n\n` +
      `- Alibaba Cloud Certified Associate (ACA): Cloud Computing & Infrastructure Operations\n` +
      `- Computer Vision & Deep Learning Specialization: Advanced neural network architectures & image processing\n` +
      `- Applied AI & Machine Learning Certification: SRIT Academic Credentials`
    );
  }

  if (q.includes('contact') || q.includes('email') || q.includes('hire') || q.includes('reach') || q.includes('linkedin') || q.includes('github')) {
    return cleanResponseText(
      `Contact & Recruiter Channels for Chitesh P S\n\n` +
      `- Email: chiteshsoundar696@gmail.com\n` +
      `- GitHub: https://github.com/ChiteshPS\n` +
      `- LinkedIn: https://linkedin.com/in/chiteshsoundar\n` +
      `- Location: Tamil Nadu, India\n\n` +
      `Chitesh is actively seeking full-time and internship opportunities in AI/ML Development, Computer Vision, Software Engineering, and Cloud Development!`
    );
  }

  // Default overview summary response
  return cleanResponseText(
    `About Chitesh P S\n\n` +
    `Chitesh P S is an Information Technology undergraduate at Sri Ramakrishna Institute of Technology (SRIT) with an impressive CGPA of 8.5/10.\n\n` +
    `Key Portfolio Highlights:\n` +
    `- AI & Computer Vision Projects: Built Legal-BERT contract analysis, Cattle & Buffalo breed recognition (CNN), and real-time Mango ripeness detection (YOLOv8).\n` +
    `- Industry Experience: Software Development Intern at Global Softwares (June 2025).\n` +
    `- Cloud Certified: Certified Alibaba Cloud Associate (ACA).\n` +
    `- Core Stack: Python, C, C++, Java, React.js, Flask, PostgreSQL, OpenCV, PyTorch, Git.\n\n` +
    `What specific project, skill, or experience would you like to know more about?`
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Chitesh AI Portfolio API" });
  });

  // AI Recruiter Assistant Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [], selectedProjectContext } = req.body;

      if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ error: "Empty message received" });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      // If API key is available, attempt Gemini generation with gemini-3.6-flash
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          let contextNote = "";
          if (selectedProjectContext) {
            contextNote = `\n[ACTIVE PROJECT CONTEXT BEING VIEWED BY RECRUITER: ${selectedProjectContext}]\n`;
          }

          const contents: { role: string; parts: { text: string }[] }[] = [];

          if (Array.isArray(history) && history.length > 0) {
            history.slice(-6).forEach((h: any) => {
              if (h.sender === 'user') {
                contents.push({ role: 'user', parts: [{ text: h.text }] });
              } else if (h.sender === 'assistant') {
                contents.push({ role: 'model', parts: [{ text: h.text }] });
              }
            });
          }

          contents.push({
            role: 'user',
            parts: [{ text: `${contextNote}${message.trim()}` }]
          });

          // Call gemini-3.6-flash
          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents,
            config: {
              systemInstruction: `${PORTFOLIO_KNOWLEDGE}\n${SYSTEM_INSTRUCTION}`,
              temperature: 0.2,
            }
          });

          if (response && response.text && response.text.trim().length > 0) {
            return res.json({
              reply: cleanResponseText(response.text),
              timestamp: new Date().toISOString()
            });
          }
        } catch (apiErr) {
          console.warn("Gemini API call warning, utilizing intelligent portfolio fallback:", apiErr);
        }
      }

      // Fallback to local intelligent knowledge generator (guarantees answer without server error)
      const fallbackReply = getLocalFallbackAnswer(message, selectedProjectContext);
      return res.json({
        reply: fallbackReply,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error("Error in /api/chat:", err);
      // Even on general error, return local fallback answer
      const fallbackReply = getLocalFallbackAnswer(req.body?.message || '', req.body?.selectedProjectContext);
      return res.json({
        reply: fallbackReply,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
