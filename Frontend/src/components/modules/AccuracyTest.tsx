import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  TestTube, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3,
  Users,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AccuracyTest = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<Array<{
    id: number;
    plantType: string;
    confidence: number;
    timestamp: string;
    redirected: boolean;
  }>>([]);

  const simulateDiseaseDetection = (confidence: number) => {
    const plantTypes = ["Tomato", "Rice", "Wheat", "Corn", "Potato", "Soybean"];
    const randomPlant = plantTypes[Math.floor(Math.random() * plantTypes.length)];
    
    const result = {
      id: Date.now(),
      plantType: randomPlant,
      confidence: confidence,
      timestamp: new Date().toLocaleString(),
      redirected: confidence < 75
    };

    setTestResults(prev => [result, ...prev]);

    if (confidence < 75) {
      // Simulate storing low accuracy case
      const lowAccuracyCase = {
        plantType: randomPlant,
        confidence: confidence,
        symptoms: ["Unclear symptoms", "Requires expert analysis"],
        imageUrl: "/api/placeholder/300/200",
        timestamp: new Date().toISOString(),
        status: 'pending' as const
      };
      
      const existingCases = JSON.parse(localStorage.getItem('lowAccuracyCases') || '[]');
      existingCases.unshift(lowAccuracyCase);
      localStorage.setItem('lowAccuracyCases', JSON.stringify(existingCases));
      
      // Redirect to expert consultation
      setTimeout(() => {
        navigate('/expert-consultation');
      }, 1000);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    localStorage.removeItem('lowAccuracyCases');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return "bg-green-100 text-green-800 border-green-200";
    if (confidence >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 75) return <CheckCircle2 className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const stats = {
    total: testResults.length,
    highAccuracy: testResults.filter(r => r.confidence >= 75).length,
    lowAccuracy: testResults.filter(r => r.confidence < 75).length,
    redirected: testResults.filter(r => r.redirected).length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accuracy Test Simulator</h1>
          <p className="text-gray-600">Test the low accuracy redirect functionality</p>
        </div>
        <Button 
          onClick={clearResults}
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Clear Results
        </Button>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <TestTube className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Test Mode:</strong> This simulator helps you test the accuracy-based redirect functionality. 
          Click the buttons below to simulate different confidence levels.
        </AlertDescription>
      </Alert>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Simulate Disease Detection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => simulateDiseaseDetection(95)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              High (95%)
            </Button>
            <Button 
              onClick={() => simulateDiseaseDetection(85)}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Good (85%)
            </Button>
            <Button 
              onClick={() => simulateDiseaseDetection(70)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Low (70%)
            </Button>
            <Button 
              onClick={() => simulateDiseaseDetection(45)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Very Low (45%)
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            <strong>Note:</strong> Cases with confidence below 75% will automatically redirect to Expert Consultation.
          </p>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.highAccuracy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowAccuracy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Redirected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.redirected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Test Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No tests run yet</p>
              <p className="text-sm">Click the buttons above to simulate disease detection with different confidence levels.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testResults.map((result) => (
                <div 
                  key={result.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">🌱</div>
                    <div>
                      <p className="font-medium text-gray-900">{result.plantType}</p>
                      <p className="text-sm text-gray-600">{result.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={getConfidenceColor(result.confidence)}>
                      {getConfidenceIcon(result.confidence)}
                      <span className="ml-1">{result.confidence}%</span>
                    </Badge>
                    {result.redirected && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        <Users className="h-3 w-3 mr-1" />
                        Redirected
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button 
              onClick={() => navigate('/expert-consultation')}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              View Expert Consultation
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccuracyTest;

