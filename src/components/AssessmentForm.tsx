// components/AssessmentForm.tsx
import React, { useState, useRef, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import html2pdf from "html2pdf.js";

const supabase = createClient(
  'https://ykdayoxwtcoyihzwlcrh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZGF5b3h3dGNveWloendsY3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzMwNDEsImV4cCI6MjA2MjcwOTA0MX0.A_FUYgf4iamIlB5jatGYcfudRwqNroSWMnL6kTr_nic'
);

const categories = [
  "Revenue & Profitability",
  "Cash Flow & Liquidity",
  "Cost & Expense Management",
  "Working Capital & Efficiency"
];

const questionsPerCategory = 30 / categories.length;

export default function AssessmentForm() {
  const resultRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessType: "",
    answers: Array(30).fill("Not Applicable")
  });

  const [results, setResults] = useState<null | { percentage: number; feedback: string[]; passed: boolean }>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAnswerChange = (index: number, value: string) => {
    const updatedAnswers = [...formData.answers];
    updatedAnswers[index] = value;
    setFormData({ ...formData, answers: updatedAnswers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let totalScore = 0;
    let maxScore = 0;
    const feedback: string[] = [];

    formData.answers.forEach((answer, i) => {
      const weight = i % 2 === 0 ? 3 : 1;
      maxScore += weight;
      if (answer === "Yes") totalScore += weight;
      else if (answer === "Not Applicable") totalScore += weight / 2;
      else feedback.push(`Review improvement area for Q${i + 1}.`);
    });

    const percentage = (totalScore / maxScore) * 100;
    const passed = percentage >= 70;

    setResults({ percentage, feedback, passed });
    setSubmitted(true);

    await supabase.from('assessments').insert({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      business_type: formData.businessType,
      answers: formData.answers,
      score: percentage,
      passed,
      feedback,
      submitted_at: new Date().toISOString()
    });
  };

  useEffect(() => {
    if (submitted && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [submitted]);

  const progress = formData.answers.filter(a => a !== "Not Applicable").length / formData.answers.length * 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>
      <h2 className="text-2xl font-bold text-center">Business Health Assessment</h2>
      {submitted && (
        <p className="text-green-700 bg-green-100 border border-green-300 px-4 py-2 rounded">
          ✅ Submission successful! Scroll down to see your results.
        </p>
      )}

      <input type="text" name="name" placeholder="Name" className="w-full p-2 border rounded" onChange={handleInputChange} required />
      <input type="email" name="email" placeholder="Email" className="w-full p-2 border rounded" onChange={handleInputChange} required />
      <input type="tel" name="phone" placeholder="Phone" className="w-full p-2 border rounded" onChange={handleInputChange} required />
      <input type="text" name="businessType" placeholder="Business Type" className="w-full p-2 border rounded" onChange={handleInputChange} required />

      {categories.map((cat, sectionIdx) => (
        <div key={cat}>
          <h3 className="text-lg font-semibold text-blue-700 border-b mb-2 mt-6">{cat}</h3>
          {[...Array(questionsPerCategory)].map((_, qIdx) => {
            const i = sectionIdx * questionsPerCategory + qIdx;
            return (
              <div
                key={i}
                className="bg-white border rounded shadow-sm p-4 mb-3 hover:shadow-md transition"
              >
                <p className="font-medium mb-2">Question {i + 1}</p>
                <div className="flex gap-4">
                  {["Yes", "No", "Not Applicable"].map((opt) => (
                    <label key={opt} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={`question-${i}`}
                        value={opt}
                        checked={formData.answers[i] === opt}
                        onChange={() => handleAnswerChange(i, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded shadow">
        Submit Assessment
      </button>

      {results && (
        <div className="mt-6 border-t pt-4" ref={resultRef}>
          <h2 className="text-xl font-semibold mb-2">Final Score: {results.percentage.toFixed(1)}%</h2>
          <p className={`text-lg font-medium ${results.passed ? "text-green-600" : "text-red-600"}`}>{results.passed ? "Pass" : "Fail"}</p>
          {results.feedback.length > 0 && (
            <div className="mt-3">
              <h3 className="font-medium mb-1">Improvement Suggestions:</h3>
              <ul className="list-disc list-inside">
                {results.feedback.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
