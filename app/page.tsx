"use client";

import { useState } from "react";

interface AnalysisResult {
  score: number;
  feedback?: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
  };
  summary?: string;
  error?: string;
  analysis?: string;
}

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const feedback = analysisResult?.feedback ?? {
    strengths: [],
    weaknesses: [],
    improvements: [],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      if (!resumeText.trim() || !jobDescription.trim()) {
        setError("Please fill in both resume and job description fields");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const normalizedData: AnalysisResult = {
        score: typeof data.score === "number" ? data.score : 0,
        feedback: data.feedback ?? {
          strengths: Array.isArray(data.strengths) ? data.strengths : [],
          weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
          improvements: Array.isArray(data.improvements)
            ? data.improvements
            : [],
        },
        summary: data.summary ?? data.analysis ?? "Analysis completed.",
        error: data.error,
        analysis: data.analysis,
      };

      if (normalizedData.error) {
        setError(normalizedData.error);
      } else {
        setAnalysisResult(normalizedData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Resume Scanner
          </h1>
          <p className="text-lg text-gray-600">
            Get instant AI-powered feedback on how well your resume matches the
            job description
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Input Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resume Input */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label
                htmlFor="resume"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                Your Resume
              </label>
              <textarea
                id="resume"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Job Description Input */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label
                htmlFor="job"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                Job Description
              </label>
              <textarea
                id="job"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out"
            >
              {loading ? "Analyzing..." : "Analyze Resume"}
            </button>
          </form>

          {/* Results Section */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800 font-semibold">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center min-h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing your resume...</p>
                </div>
              </div>
            )}

            {analysisResult && !loading && (
              <div className="space-y-4">
                {/* Score Card */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md p-6 text-white">
                  <p className="text-sm font-semibold opacity-90">Your Match Score</p>
                  <p className="text-5xl font-bold mt-2">{analysisResult.score}/100</p>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Summary
                  </h3>
                  <p className="text-gray-700">
                    {analysisResult.summary ?? analysisResult.analysis ?? "No summary available."}
                  </p>
                </div>

                {/* Strengths */}
                {feedback.strengths.length > 0 && (
                  <div className="bg-green-50 rounded-lg shadow-md p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">
                      ✓ Strengths
                    </h3>
                    <ul className="space-y-2">
                      {feedback.strengths.map((strength, i) => (
                        <li key={i} className="text-green-800 text-sm flex items-start">
                          <span className="mr-2">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {feedback.weaknesses.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg shadow-md p-6 border border-yellow-200">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                      ⚠ Weaknesses
                    </h3>
                    <ul className="space-y-2">
                      {feedback.weaknesses.map((weakness, i) => (
                        <li key={i} className="text-yellow-800 text-sm flex items-start">
                          <span className="mr-2">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {feedback.improvements.length > 0 && (
                  <div className="bg-blue-50 rounded-lg shadow-md p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                      💡 Improvements
                    </h3>
                    <ul className="space-y-2">
                      {feedback.improvements.map((improvement, i) => (
                        <li key={i} className="text-blue-800 text-sm flex items-start">
                          <span className="mr-2">•</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
