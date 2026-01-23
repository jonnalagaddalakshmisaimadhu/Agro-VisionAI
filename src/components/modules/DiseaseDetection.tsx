import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Camera,
  Upload,
  AlertTriangle,
  Clock,
  Eye,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  Brain,
  Sparkles,
  Users,
  Snowflake,
  Leaf,
  BarChart3,
  CheckCircle,
  MessageSquare
} from "lucide-react";
import EmbeddedAIChat from "./EmbeddedAIChat";
import { detectPlantDisease } from "@/services/geminiService";
import { DiseaseDetectionResult } from "@/types/cropPrediction";

// Using the imported type instead of local interface
type AnalysisResult = DiseaseDetectionResult;

const DiseaseDetection = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lowAccuracyResult, setLowAccuracyResult] = useState<AnalysisResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [scanHistory, setScanHistory] = useState([
    { id: 1, crop: "Blueberry", issue: "Blueberry : healthy", date: "2024-01-15", treatment: "Maintain health" },
    { id: 2, crop: "Tomato", issue: "Late Blight", date: "2024-01-12", treatment: "Copper Fungicide" },
    { id: 3, crop: "Apple", issue: "Apple : healthy", date: "2024-01-10", treatment: "Maintain health" },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setAnalysisResult(null);
        setAnalysisError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanCrop = () => {
    fileInputRef.current?.click();
  };

  const handleOpenCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setAnalysisResult(null);
      setAnalysisError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    setLowAccuracyResult(null);

    try {
      console.log('🔬 Starting AI-powered disease detection...');

      // Extract base64 data from the image
      const base64Image = selectedImage.split(',')[1] ?? selectedImage;
      const mimeType = selectedImage.split(',')[0].split(':')[1].split(';')[0];

      console.log('📸 Analyzing image with Gemini AI...');

      // Use Gemini AI for disease detection
      const result: AnalysisResult = await detectPlantDisease(base64Image, mimeType);

      console.log('✅ Disease detection completed:', result);

      // Check if confidence is below 75%
      const confidence = typeof result.confidence === 'string'
        ? parseInt(result.confidence.replace('%', ''))
        : result.confidence;

      if (confidence < 75) {
        console.log('⚠️ Low confidence detected, showing low accuracy message...');
        setLowAccuracyResult(result);
        return;
      }

      setAnalysisResult(result);
      setScanHistory((prev) => [
        {
          id: Date.now(),
          crop: result.diseaseName.includes(':') ? result.diseaseName.split(':')[0].trim() :
            result.diseaseName.toLowerCase().includes('background without leaves') ? "Background" : "Plant",
          issue: result.diseaseName,
          date: new Date().toISOString().slice(0, 10),
          treatment: result.treatment[0] ||
            (result.diseaseName.toLowerCase().includes('healthy') ? 'Maintain health' :
              result.diseaseName.toLowerCase().includes('background without leaves') ? 'Re-upload image' : 'Consult expert')
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Disease analysis failed:", error);
      setAnalysisError(error instanceof Error ? error.message : "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConsultExpert = () => {
    if (!lowAccuracyResult) return;

    // Store the low accuracy case data
    const lowAccuracyCase = {
      plantType: lowAccuracyResult.diseaseName || 'Unknown Plant',
      confidence: typeof lowAccuracyResult.confidence === 'string'
        ? parseInt(lowAccuracyResult.confidence.replace('%', ''))
        : lowAccuracyResult.confidence,
      symptoms: lowAccuracyResult.symptoms || [],
      imageUrl: selectedImage,
      timestamp: new Date().toISOString(),
      status: 'pending' as const
    };

    // Store in localStorage for the expert consultation page
    const existingCases = JSON.parse(localStorage.getItem('lowAccuracyCases') || '[]');
    existingCases.unshift(lowAccuracyCase);
    localStorage.setItem('lowAccuracyCases', JSON.stringify(existingCases));

    // Redirect to expert consultation page
    navigate('/expert-consultation');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">AI Disease Detection</h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by Gemini AI
              </Badge>
            </div>
            <p className="text-sm text-gray-600">Upload plant images for AI-powered disease identification</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm"
          >
            <option value="english">English</option>
            <option value="hindi">हिंदी</option>
            <option value="punjabi">ਪੰਜਾਬੀ</option>
            <option value="gujarati">ગુજરાતી</option>
            <option value="marathi">मराठी</option>
          </select>
        </div>
      </div>

      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          Late blight outbreak reported in Northern regions. Early detection recommended.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="analyze">
        <TabsList>
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="history">Recent Scans</TabsTrigger>
          <TabsTrigger value="experts">Experts</TabsTrigger>
          <TabsTrigger value="low-accuracy">Low Accuracy Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Upload Plant Image</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 text-center"
                >
                  {!selectedImage ? (
                    <>
                      <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 mb-4">
                        <Upload className="h-8 w-8 text-gray-500" />
                      </div>
                      <p className="text-lg font-medium text-gray-800 mb-1">Upload Plant Image</p>
                      <p className="text-sm text-gray-500 mb-4">Click here or drag and drop an image of the affected plant</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">JPG</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">PNG</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Max 5MB</span>
                      </div>

                      <div className="mt-6 flex items-center gap-3">
                        <Button onClick={handleScanCrop} className="bg-green-600 hover:bg-green-700 text-white">
                          <Upload className="h-4 w-4" />
                          Choose Image
                        </Button>
                        <Button variant="secondary" onClick={handleOpenCamera} className="">
                          <Camera className="h-4 w-4" />
                          Use Camera
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full max-w-2xl">
                      <img src={selectedImage} alt="Uploaded" className="w-64 h-64 object-cover rounded-lg border mx-auto" />
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <Button variant="outline" onClick={handleScanCrop}>Re-upload</Button>
                        <Button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-green-600 hover:bg-green-700 text-white">
                          {isAnalyzing ? "Analyzing..." : "Analyze"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Photography Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" /> <span>Clear Focus: Ensure the affected area is in sharp focus</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" /> <span>Good Lighting: Use natural daylight for best results</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" /> <span>Close-up View: Capture symptoms clearly with close-up shots</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" /> <span>Multiple Angles: Take photos from different angles if possible</span></li>
                </ul>
                <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 text-sm">
                  <p className="font-medium">AI Accuracy: 96%</p>
                  <p className="text-green-800">Our AI model has been trained on over 200,000 plant disease images and can identify 11+ common crop diseases with high accuracy.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {isAnalyzing && (
            <div className="mt-6 text-center text-sm text-gray-600">Analyzing image…</div>
          )}

          {analysisError && (
            <Alert className="mt-6 bg-red-50 border-red-200 text-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                {analysisError}
              </AlertDescription>
            </Alert>
          )}

          {lowAccuracyResult && (
            <div className="space-y-6">
              <Alert className="mt-6 bg-orange-50 border-orange-200 text-orange-800">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <strong>Low Detection Accuracy:</strong> The scanned image was not detected clearly.
                  Our AI model has low confidence in this diagnosis. For accurate results, we recommend
                  consulting with our agricultural experts.
                </AlertDescription>
              </Alert>

              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Unclear Detection</h2>
                      <p className="mt-2 text-lg text-gray-700">
                        Possible: {lowAccuracyResult.diseaseName}
                      </p>
                      <p className="mt-2 text-gray-600">
                        Confidence: <span className="font-semibold text-orange-600">
                          {typeof lowAccuracyResult.confidence === 'string'
                            ? lowAccuracyResult.confidence
                            : `${lowAccuracyResult.confidence}%`}
                        </span>
                      </p>
                      <p className="mt-2 text-gray-700 max-w-3xl">
                        {lowAccuracyResult.description}
                      </p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      Low Confidence
                    </Badge>
                  </div>

                  <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-2">Why is the detection unclear?</h3>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Image quality may be insufficient for accurate analysis</li>
                      <li>• Plant symptoms may be in early stages or not clearly visible</li>
                      <li>• Multiple diseases or conditions may be present</li>
                      <li>• Lighting conditions may affect image clarity</li>
                    </ul>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      onClick={handleConsultExpert}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Consult Expert
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLowAccuracyResult(null);
                        setSelectedImage(null);
                      }}
                    >
                      Try Another Image
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-6">
              {analysisResult.diseaseName.toLowerCase().includes('background without leaves') ? (
                // Background without leaves display - simplified with suitable content
                <div className="space-y-6">
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{analysisResult.diseaseName}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900"><Eye className="h-5 w-5 text-yellow-600" /> Image Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          <li>No plant leaves detected in the image</li>
                          <li>Image appears to show background only</li>
                          <li>No visible crop or plant material</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900"><Stethoscope className="h-5 w-5 text-red-600" /> Recommended Action</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          <li>Upload a clear image of plant leaves</li>
                          <li>Ensure good lighting and focus</li>
                          <li>Capture affected areas clearly</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900"><ShieldCheck className="h-5 w-5 text-green-600" /> Photography Tips</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          <li>Use natural daylight for best results</li>
                          <li>Focus on individual leaves or affected areas</li>
                          <li>Avoid shadows and blurry images</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : analysisResult.diseaseName.toLowerCase().includes('healthy') ? (
                // Healthy crop display
                <div className="space-y-6">
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">Crop Health Status</h2>
                          <p className="mt-2 text-2xl font-bold text-green-600">{analysisResult.diseaseName}</p>
                          <p className="mt-2 text-gray-700 max-w-3xl">{analysisResult.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className="bg-green-100 text-green-800 border-green-200">{analysisResult.confidence}% Confidence</Badge>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Treatment recommended within 1-2 weeks
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                          <Snowflake className="h-5 w-5 text-blue-600" />
                          Optimal Environment Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-gray-700">
                          {analysisResult.symptoms.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-600 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                          <Leaf className="h-5 w-5 text-green-600" />
                          Soil and Nutrient Optimization
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-gray-700">
                          {analysisResult.prevention.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-600 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                          Growth and Development Monitoring
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-gray-700">
                          {analysisResult.treatment.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-600 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                // Disease display (existing code)
                <div className="space-y-6">
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">Disease Detected</h2>
                          <p className="mt-2 text-2xl font-bold text-gray-900">{analysisResult.diseaseName}</p>
                          <p className="mt-2 text-gray-700 max-w-3xl">{analysisResult.description}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">{analysisResult.confidence}% Confidence</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Badge variant="outline" className="text-yellow-700 border-yellow-300">Severity: {analysisResult.severity}</Badge>
                        <Badge variant="outline" className="text-red-700 border-red-300">Action Required: {analysisResult.action}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900"><Eye className="h-5 w-5 text-yellow-600" /> Symptoms</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          {analysisResult.symptoms.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900"><Stethoscope className="h-5 w-5 text-red-600" /> Treatment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          {analysisResult.treatment.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900"><ShieldCheck className="h-5 w-5 text-green-600" /> Prevention</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          {analysisResult.prevention.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Embedded Context-Aware Chat */}
                  <EmbeddedAIChat
                    diseaseName={analysisResult.diseaseName}
                    contextData={`Disease: ${analysisResult.diseaseName}. Description: ${analysisResult.description}. Symptoms: ${analysisResult.symptoms.join(', ')}. Treatment: ${analysisResult.treatment.join(', ')}. Prevention: ${analysisResult.prevention.join(', ')}.`}
                  />

                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Scans</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanHistory.length === 0 && (
                  <div className="text-sm text-gray-600">No scans yet. Analyze an image to see it here.</div>
                )}
                {scanHistory.map((scan) => (
                  <div key={scan.id} className={`flex items-center justify-between p-4 rounded-lg border ${scan.issue.toLowerCase().includes('healthy')
                      ? 'bg-green-50 border-green-100'
                      : scan.issue.toLowerCase().includes('background without leaves')
                        ? 'bg-gray-50 border-gray-100'
                        : 'bg-blue-50 border-blue-100'
                    }`}>
                    <div>
                      <p className="font-medium text-gray-900">{scan.crop}</p>
                      <p className={`text-sm ${scan.issue.toLowerCase().includes('healthy')
                          ? 'text-green-700'
                          : scan.issue.toLowerCase().includes('background without leaves')
                            ? 'text-gray-600'
                            : 'text-gray-600'
                        }`}>{scan.issue}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{scan.date}</p>
                      <Badge variant="outline" className={`text-xs ${scan.issue.toLowerCase().includes('healthy')
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : scan.issue.toLowerCase().includes('background without leaves')
                            ? 'bg-gray-100 text-gray-800 border-gray-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
                        {scan.treatment}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5" />
                  <span>Available Experts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-purple-50 border-purple-100 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-purple-900">Dr. Raj Kumar</p>
                      <p className="text-sm text-purple-800">Plant Pathologist · 20+ years experience</p>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">Call</Button>
                  </div>
                  <div className="p-4 rounded-lg border bg-green-50 border-green-100 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-900">Dr. Priya Sharma</p>
                      <p className="text-sm text-green-800">Crop Protection Specialist · 15+ years experience</p>
                    </div>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">Chat</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Emergency Helpline</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 rounded-lg border bg-red-50 border-red-100 text-center">
                  <p className="text-2xl font-bold text-red-800">1800-FARM-HELP</p>
                  <p className="text-sm text-red-700">24/7 Emergency Support</p>
                  <div className="mt-3">
                    <Button className="bg-red-600 hover:bg-red-700 text-white">Call Now</Button>
                  </div>
                </div>
                <div className="p-6 rounded-lg border bg-blue-50 border-blue-100 text-center">
                  <p className="font-semibold text-blue-900">WhatsApp Support</p>
                  <p className="text-sm text-blue-800">Get instant help via WhatsApp</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="low-accuracy">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Low Accuracy Cases</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Cases where AI confidence was below 75% - requiring expert consultation
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Low Accuracy Detected:</strong> When our AI model has low confidence in disease detection,
                    we automatically redirect you to expert consultation for more accurate diagnosis.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Low Accuracy Cases</h3>
                  <Button
                    onClick={() => navigate('/expert-consultation')}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View All Cases
                  </Button>
                </div>

                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-400" />
                  <p className="text-lg font-medium">No low accuracy cases yet</p>
                  <p className="text-sm">When AI confidence drops below 75%, cases will appear here for expert review.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiseaseDetection;