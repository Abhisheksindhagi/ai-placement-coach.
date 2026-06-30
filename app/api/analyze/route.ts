import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../../../lib/firebase"; // Import the Firestore database instance
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        const { resumeText, jobDescription } = await request.json();

        // 1. Validation Check
        if (!resumeText || !jobDescription) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 2. Safely grab the API key from environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Server misconfiguration: Missing API Key" }, { status: 500 });
        }

        // 3. Proper initialization for @google/generative-ai package
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      You are an expert HR Manager and Technical Recruiter. Evaluate the following Candidate Resume against the Job Description.
      
      Job Description: ${jobDescription}
      Candidate Resume: ${resumeText}
      
      Provide your analysis in clear, neat text blocks covering:
      1. Overall Compatibility Match Score (out of 100)
      2. Key Missing Keywords or Skills
      3. Critical Improvements Needed for the Resume to pass ATS filters
    `;

        // 4. Call the AI model
        const result = await model.generateContent(prompt);
        const aiResponseText = result.response.text();

        // 5. DATABASE STORE OPERATION (CRUD - Create)
        // This saves the data into a collection called 'assessments'
        try {
            await addDoc(collection(db, "assessments"), {
                resume: resumeText,
                jobDescription: jobDescription,
                analysis: aiResponseText,
                createdAt: serverTimestamp(), // Saves the exact database server time
            });
            console.log("SUCCESS: Saved assessment data safely into Firestore Cloud.");
        } catch (dbError) {
            // If the database fails, we still want to return the AI response so the user doesn't crash
            console.error("Firestore Database Error:", dbError);
        }

        return NextResponse.json({ analysis: aiResponseText });
    } catch (error: any) {
        console.error("AI Generation Error Details:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}