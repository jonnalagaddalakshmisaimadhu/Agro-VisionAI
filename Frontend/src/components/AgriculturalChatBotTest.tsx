import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  Wheat, 
  Droplets, 
  Sun, 
  AlertTriangle, 
  TrendingUp,
  CheckCircle,
  XCircle
} from "lucide-react";
import { isAgricultureRelated, getAgricultureSuggestions } from "@/services/agriculturalChatService";

const AgriculturalChatBotTest = () => {
  const [testResults, setTestResults] = useState<Array<{
    question: string;
    isAgriculture: boolean;
    expected: boolean;
    passed: boolean;
  }>>([]);

  const testQuestions = [
    { question: "What crops should I plant this season?", expected: true },
    { question: "How to identify tomato diseases?", expected: true },
    { question: "What is the weather like today?", expected: true },
    { question: "How to cook rice?", expected: false },
    { question: "What is the capital of India?", expected: false },
    { question: "How to manage soil fertility?", expected: true },
    { question: "Best programming language?", expected: false },
    { question: "Irrigation methods for farming?", expected: true },
    { question: "Market prices for vegetables?", expected: true },
    { question: "How to fix my car?", expected: false }
  ];

  const runTests = () => {
    const results = testQuestions.map(test => {
      const isAgriculture = isAgricultureRelated(test.question);
      return {
        question: test.question,
        isAgriculture,
        expected: test.expected,
        passed: isAgriculture === test.expected
      };
    });
    setTestResults(results);
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            Agricultural ChatBot Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Controls */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Agriculture Detection Tests</h3>
              <p className="text-sm text-gray-600">
                Testing if the chatbot correctly identifies agriculture-related questions
              </p>
            </div>
            <Button onClick={runTests} className="bg-green-600 hover:bg-green-700">
              Run Tests
            </Button>
          </div>

          {/* Test Results Summary */}
          {testResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Passed</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{passedTests}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-800">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{totalTests - passedTests}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Success Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{successRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Test Results Details */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Detailed Results:</h4>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.passed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{result.question}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={result.passed ? "default" : "destructive"}>
                          {result.passed ? "PASS" : "FAIL"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Expected: {result.expected ? "Agriculture" : "Non-Agriculture"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agriculture Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold">Agriculture Categories:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: "Crop Management", icon: <Wheat className="h-4 w-4" />, color: "bg-green-100 text-green-800" },
                { name: "Disease Control", icon: <AlertTriangle className="h-4 w-4" />, color: "bg-red-100 text-red-800" },
                { name: "Weather & Climate", icon: <Sun className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-800" },
                { name: "Market Insights", icon: <TrendingUp className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
                { name: "Soil & Nutrients", icon: <Leaf className="h-4 w-4" />, color: "bg-orange-100 text-orange-800" },
                { name: "Water Management", icon: <Droplets className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-800" }
              ].map((category, index) => (
                <Badge key={index} className={`${category.color} p-2`}>
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sample Suggestions */}
          <div className="space-y-4">
            <h4 className="font-semibold">Sample Agriculture Suggestions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getAgricultureSuggestions('crop_management').map((suggestion, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">How to Use the Agricultural ChatBot:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ask questions only about agriculture, farming, crops, and related topics</li>
              <li>• The chatbot will politely redirect non-agricultural questions</li>
              <li>• Use the quick question buttons for common farming topics</li>
              <li>• The bot learns from your conversation context (location, farm size, etc.)</li>
              <li>• Get specific advice tailored to Indian farming conditions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgriculturalChatBotTest;
