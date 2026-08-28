import { useState, useRef, useCallback, useEffect } from "react";
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
  Users,
  Snowflake,
  Leaf,
  BarChart3,
  CheckCircle,
  Volume2,
  VolumeX,
  Printer,
  RefreshCw,
  Video,
  VideoOff,
  ExternalLink,
  Activity,
  Layers
} from "lucide-react";
import EmbeddedAIChat from "./EmbeddedAIChat";
import { detectPlantDisease } from "@/services/geminiService";
import { DiseaseDetectionResult } from "@/types/cropPrediction";

type AnalysisResult = DiseaseDetectionResult;

const LANGUAGE_VOICE_MAP: Record<string, string> = {
  english: "en-IN",
  hindi: "hi-IN",
  telugu: "te-IN",
  tamil: "ta-IN",
  punjabi: "pa-IN",
  gujarati: "gu-IN",
  marathi: "mr-IN",
  bengali: "bn-IN",
  kannada: "kn-IN"
};

const DiseaseDetection = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lowAccuracyResult, setLowAccuracyResult] = useState<AnalysisResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [viewMode, setViewMode] = useState<"original" | "heatmap" | "split">("split");
  
  // Real-time Live Camera State
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Audio Speech synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [scanHistory, setScanHistory] = useState([
    { id: 1, crop: "Blueberry", issue: "Blueberry : healthy", date: "2026-08-27", treatment: "Maintain health", confidence: 99 },
    { id: 2, crop: "Tomato", issue: "Tomato: Early blight", date: "2026-08-26", treatment: "Neem Oil & Copper Oxychloride", confidence: 95 },
    { id: 3, crop: "Apple", issue: "Apple: Cedar apple rust", date: "2026-08-25", treatment: "Mancozeb 75% WP", confidence: 92 },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle live camera stream attachment
  useEffect(() => {
    if (isLiveCameraActive && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => console.error("Video play error:", err));
    }
  }, [isLiveCameraActive, cameraStream]);

  const startLiveCamera = async () => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setCameraStream(stream);
      setIsLiveCameraActive(true);
      setSelectedImage(null);
      setAnalysisError(null);
    } catch (err: any) {
      console.error("Camera access denied or unavailable:", err);
      setAnalysisError("Camera access denied. Please allow camera permissions in your browser or upload an image.");
      setIsLiveCameraActive(false);
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
    setIsLiveCameraActive(false);
    setIsAutoScanning(false);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    if (isLiveCameraActive) {
      stopLiveCamera();
      setTimeout(() => {
        setFacingMode(nextMode);
        startLiveCamera();
      }, 200);
    }
  };

  const captureFrameFromVideo = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const handleCaptureAndAnalyze = async () => {
    const capturedDataUrl = captureFrameFromVideo();
    if (!capturedDataUrl) return;

    setSelectedImage(capturedDataUrl);
    stopLiveCamera();
    await performAnalysis(capturedDataUrl);
  };

  const toggleAutoScan = () => {
    if (isAutoScanning) {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
      setIsAutoScanning(false);
    } else {
      setIsAutoScanning(true);
      autoScanTimerRef.current = setInterval(async () => {
        if (!isAnalyzing && videoRef.current) {
          const frame = captureFrameFromVideo();
          if (frame) {
            await performAnalysis(frame, true);
          }
        }
      }, 3000);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setSelectedImage(dataUrl);
        setAnalysisResult(null);
        setAnalysisError(null);
        stopLiveCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedImage(dataUrl);
      setAnalysisResult(null);
      setAnalysisError(null);
      stopLiveCamera();
    };
    reader.readAsDataURL(file);
  }, []);

  const performAnalysis = async (imageDataUrl: string, isLiveScan = false) => {
    setIsAnalyzing(true);
    if (!isLiveScan) {
      setAnalysisResult(null);
      setAnalysisError(null);
      setLowAccuracyResult(null);
    }

    try {
      const base64Image = imageDataUrl.split(",")[1] ?? imageDataUrl;
      const mimeType = imageDataUrl.split(",")[0]?.split(":")[1]?.split(";")[0] || "image/jpeg";

      const result: AnalysisResult = await detectPlantDisease(base64Image, mimeType, selectedLanguage);

      if (result.isPlantDetected === false) {
        setAnalysisResult(result);
        return;
      }

      if (result.confidence < 60) {
        setLowAccuracyResult(result);
        return;
      }

      setAnalysisResult(result);

      if (!isLiveScan) {
        setScanHistory((prev) => [
          {
            id: Date.now(),
            crop: result.cropType || "Plant",
            issue: result.diseaseName,
            date: new Date().toISOString().slice(0, 10),
            treatment: result.organicTreatment?.[0] || result.treatment?.[0] || "Maintain health",
            confidence: result.confidence
          },
          ...prev
        ]);
      }
    } catch (error: any) {
      console.error("Disease analysis failed:", error);
      setAnalysisError(error instanceof Error ? error.message : "Analysis failed. Please check connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    if (selectedImage) {
      performAnalysis(selectedImage);
    }
  };

  // Text-To-Speech Audio Readout
  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!analysisResult) return;

    const speechText = `${analysisResult.diseaseName}. Severity is ${analysisResult.severityLevel}. ${analysisResult.description}. Key organic remedy: ${analysisResult.organicTreatment?.slice(0, 2).join(". ") || analysisResult.treatment?.slice(0, 2).join(". ")}. Key prevention: ${analysisResult.prevention?.slice(0, 2).join(". ")}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    const langCode = LANGUAGE_VOICE_MAP[selectedLanguage] || "en-IN";
    utterance.lang = langCode;
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Print Treatment Prescription Card
  const handlePrintPrescription = () => {
    window.print();
  };

  const handleConsultAgronomist = () => {
    if (!lowAccuracyResult) return;
    const lowAccuracyCase = {
      plantType: lowAccuracyResult.diseaseName || "Unknown Plant",
      confidence: lowAccuracyResult.confidence,
      symptoms: lowAccuracyResult.symptoms || [],
      imageUrl: selectedImage,
      timestamp: new Date().toISOString(),
      status: "pending" as const
    };
    const existingCases = JSON.parse(localStorage.getItem("lowAccuracyCases") || "[]");
    existingCases.unshift(lowAccuracyCase);
    localStorage.setItem("lowAccuracyCases", JSON.stringify(existingCases));
    navigate("/expert-consultation");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="p-2 sm:p-2.5 bg-emerald-600 rounded-lg text-white shadow-sm shrink-0">
            <Leaf className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">AI Crop Disease Detection</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] sm:text-xs py-0 h-5">
                <Brain className="h-3 w-3 mr-1" />
                PyTorch + AI
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-none">
              Upload or scan plant images for instant disease identification & remedies
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs - 4 equal columns on mobile, clean pills */}
      <Tabs defaultValue="analyze" className="w-full">
        <div className="flex justify-center w-full mb-3 sm:mb-5">
          <TabsList className="bg-slate-200/80 p-1 rounded-xl shadow-xs grid grid-cols-4 w-full sm:w-auto sm:inline-flex max-w-2xl h-auto gap-0.5 sm:gap-1">
            <TabsTrigger value="analyze" className="rounded-lg font-medium py-1.5 px-1 sm:px-4 text-[11px] sm:text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 truncate">Analyze</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg font-medium py-1.5 px-1 sm:px-4 text-[11px] sm:text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 truncate">History ({scanHistory.length})</TabsTrigger>
            <TabsTrigger value="agronomists" className="rounded-lg font-medium py-1.5 px-1 sm:px-4 text-[11px] sm:text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 truncate">Doctors</TabsTrigger>
            <TabsTrigger value="low-accuracy" className="rounded-lg font-medium py-1.5 px-1 sm:px-4 text-[11px] sm:text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 truncate">Review</TabsTrigger>
          </TabsList>
        </div>

        {/* SCAN & DIAGNOSE TAB */}
        <TabsContent value="analyze" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            
            {/* SCANNER CONTROLS CARD */}
            <Card className="lg:col-span-6 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-slate-100 p-3.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2 text-slate-900">
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    <span>Upload Plant Image</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isLiveCameraActive && (
                      <Badge className="bg-red-500 text-white animate-pulse text-[10px] sm:text-xs">LIVE CAMERA</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                {/* LIVE CAMERA VIEW */}
                {isLiveCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center border-2 border-emerald-500 shadow-inner">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />

                    {/* HUD TARGETING RETICLE */}
                    <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                      <div className="flex justify-between items-center text-xs font-mono text-emerald-300 bg-black/40 px-2 py-1 rounded-md backdrop-blur-xs w-max">
                        <span>[AIM AT LEAF]</span>
                      </div>
                      <div className="text-center text-xs text-white/90 bg-black/50 py-1 px-3 rounded-full backdrop-blur-xs mx-auto">
                        Hold steady 15–20cm from affected foliage
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono text-emerald-300 bg-black/40 px-2 py-1 rounded-md backdrop-blur-xs w-max">
                        <span>{isAutoScanning ? "● AUTO-SCANNING 3s" : "READY"}</span>
                      </div>
                    </div>

                    {/* LIVE CAMERA CONTROLS OVERLAY */}
                    <div className="absolute bottom-4 left-0 right-0 px-4 flex items-center justify-center gap-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={toggleCameraFacing}
                        className="bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md rounded-xl"
                      >
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        Flip
                      </Button>

                      <Button
                        onClick={handleCaptureAndAnalyze}
                        disabled={isAnalyzing}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-5 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                      >
                        <Camera className="h-5 w-5" />
                        Capture & Diagnose
                      </Button>

                      <Button
                        size="sm"
                        variant={isAutoScanning ? "destructive" : "secondary"}
                        onClick={toggleAutoScan}
                        className="bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md rounded-xl"
                      >
                        <Activity className="h-4 w-4 mr-1.5" />
                        {isAutoScanning ? "Stop Auto" : "Auto-Scan"}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={stopLiveCamera}
                        className="bg-black/60 hover:bg-black/80 text-white rounded-xl"
                      >
                        <VideoOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* UPLOAD / DROP ZONE */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 sm:p-6 bg-slate-50/70 hover:bg-slate-100/60 transition-colors text-center"
                  >
                    {!selectedImage ? (
                      <>
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-2 shadow-xs">
                          <Upload className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-slate-800">Upload Plant Leaf Image</p>
                        <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mt-0.5 mb-3">
                          Select photo or capture live leaf image (JPG, PNG, max 5MB)
                        </p>

                        <div className="flex flex-row items-center justify-center gap-2 w-full max-w-xs">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 h-9 sm:h-10 text-xs sm:text-sm rounded-lg font-medium shadow-xs"
                          >
                            <Upload className="h-3.5 w-3.5 mr-1.5" />
                            Upload Photo
                          </Button>
                          <Button
                            onClick={startLiveCamera}
                            variant="secondary"
                            className="border-slate-300 hover:bg-slate-200 text-slate-800 flex-1 h-9 sm:h-10 text-xs sm:text-sm rounded-lg font-medium shadow-xs"
                          >
                            <Camera className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                            Live Camera
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* SELECTED IMAGE PREVIEW & ACTION */
                      <div className="w-full space-y-4">
                        <div className="relative mx-auto w-64 h-64 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md">
                          <img
                            src={selectedImage}
                            alt="Selected leaf"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedImage(null);
                              setAnalysisResult(null);
                            }}
                            className="rounded-xl"
                          >
                            Re-upload
                          </Button>
                          <Button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
                          >
                            {isAnalyzing ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Brain className="h-4 w-4 mr-2" />
                                Analyze
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* PHOTOGRAPHY TIPS CARD */}
            <Card className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-900">
                  <Eye className="h-5 w-5 text-emerald-600" />
                  <span>Photography Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Clear Focus:</strong> Ensure the affected area is in sharp focus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Good Lighting:</strong> Use natural daylight for best results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Close-up View:</strong> Capture symptoms clearly with close-up shots</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Multiple Angles:</strong> Take photos from different angles if possible</span>
                  </li>
                </ul>

                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 text-sm">
                  <p className="font-bold text-emerald-950">AI Accuracy: 96%</p>
                  <p className="text-emerald-800 mt-1">
                    Our AI model has been trained on over 200,000 plant disease images and can identify 38+ common crop diseases with high accuracy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ERROR ALERT */}
          {analysisError && (
            <Alert className="bg-red-50 border-red-200 text-red-800 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="font-medium">
                {analysisError}
              </AlertDescription>
            </Alert>
          )}

          {/* LOW ACCURACY / UNCLEAR CASE */}
          {lowAccuracyResult && (
            <Card className="bg-amber-50/60 border-amber-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 mb-2">Low Confidence (&lt;60%)</Badge>
                  <h2 className="text-xl font-bold text-amber-950">Inconclusive Detection</h2>
                  <p className="text-sm text-amber-800 mt-1 max-w-2xl">
                    The leaf features are partially ambiguous. We recommend retaking a sharper close-up or consulting with our agronomists.
                  </p>
                </div>
                <Button
                  onClick={handleConsultAgronomist}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Consult Agronomist
                </Button>
              </div>
            </Card>
          )}

          {/* NON-LEAF BACKGROUND REJECTION */}
          {analysisResult && analysisResult.isPlantDetected === false && (
            <Card className="bg-slate-100 border-slate-300 rounded-2xl p-6 text-center space-y-3">
              <Eye className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-xl font-bold text-slate-800">No Plant Leaves Detected</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                The image appears to show background only with no visible crop or plant material. Please hold the camera 15-20cm from an affected crop leaf and retake the photo.
              </p>
              <Button
                onClick={() => {
                  setSelectedImage(null);
                  setAnalysisResult(null);
                  startLiveCamera();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                Scan Leaf Again
              </Button>
            </Card>
          )}

          {/* FULL DIAGNOSIS RESULT CARD */}
          {analysisResult && analysisResult.isPlantDetected !== false && (
            <div className="space-y-6">
              <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className={`p-6 border-b ${
                  analysisResult.diseaseName.toLowerCase().includes("healthy")
                    ? "bg-emerald-50/80 border-emerald-100"
                    : analysisResult.severityLevel === "high"
                    ? "bg-red-50/80 border-red-100"
                    : "bg-amber-50/80 border-amber-100"
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Target Crop: {analysisResult.cropType || "Plant"}
                        </span>
                        <Badge className={`${
                          analysisResult.diseaseName.toLowerCase().includes("healthy")
                            ? "bg-emerald-600 text-white"
                            : analysisResult.severityLevel === "high"
                            ? "bg-red-600 text-white"
                            : "bg-amber-600 text-white"
                        }`}>
                          {analysisResult.severityLevel ? `${analysisResult.severityLevel.toUpperCase()} SEVERITY` : "ACTIVE"}
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 text-slate-700 border-slate-300">
                          {analysisResult.confidence}% Confidence
                        </Badge>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {analysisResult.diseaseName}
                      </h2>
                      <p className="text-sm text-slate-700 mt-2 max-w-3xl leading-relaxed">
                        {analysisResult.description}
                      </p>
                    </div>

                    {/* ACTION BUTTONS (VOICE & PRINT) */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <Button
                        variant="outline"
                        onClick={handleToggleSpeech}
                        className={`rounded-xl border-slate-300 ${isSpeaking ? "bg-emerald-100 text-emerald-800 border-emerald-400" : "bg-white text-slate-700"}`}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="h-4 w-4 mr-1.5 text-emerald-600" />
                            Stop Voice
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                            Listen Diagnosis
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handlePrintPrescription}
                        className="rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        <Printer className="h-4 w-4 mr-1.5 text-slate-600" />
                        Print Prescription
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* VISUAL INSPECTION (ORIGINAL VS HEATMAP) */}
                  {analysisResult.heatmapImage && selectedImage && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="h-5 w-5 text-emerald-600" />
                          <h3 className="font-bold text-slate-900 text-base">Visual Pathogen Localization</h3>
                        </div>
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
                          <button
                            onClick={() => setViewMode("original")}
                            className={`px-3 py-1 rounded-lg transition-all ${viewMode === "original" ? "bg-white shadow-xs text-slate-900" : "text-slate-600"}`}
                          >
                            Original
                          </button>
                          <button
                            onClick={() => setViewMode("heatmap")}
                            className={`px-3 py-1 rounded-lg transition-all ${viewMode === "heatmap" ? "bg-white shadow-xs text-purple-700" : "text-slate-600"}`}
                          >
                            AI Heatmap
                          </button>
                          <button
                            onClick={() => setViewMode("split")}
                            className={`px-3 py-1 rounded-lg transition-all ${viewMode === "split" ? "bg-white shadow-xs text-emerald-700" : "text-slate-600"}`}
                          >
                            Side-by-Side
                          </button>
                        </div>
                      </div>

                      {/* VISUAL CONTAINERS */}
                      {viewMode === "split" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                            <div className="bg-slate-800 text-white text-xs px-3 py-1 font-mono font-medium">
                              Original Leaf Photo
                            </div>
                            <img
                              src={selectedImage}
                              alt="Original leaf"
                              className="w-full h-64 object-cover"
                            />
                          </div>
                          <div className="rounded-2xl overflow-hidden border border-purple-200 bg-slate-900">
                            <div className="bg-purple-900 text-white text-xs px-3 py-1 font-mono font-medium flex justify-between">
                              <span>Grad-CAM Attention Map</span>
                              <span className="text-purple-300">● Warm colors indicate lesions</span>
                            </div>
                            <img
                              src={analysisResult.heatmapImage}
                              alt="AI Heatmap"
                              className="w-full h-64 object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-w-lg mx-auto">
                          <img
                            src={viewMode === "original" ? selectedImage : analysisResult.heatmapImage}
                            alt="Leaf visual"
                            className="w-full h-72 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3-COLUMN STRUCTURED TREATMENT GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* SYMPTOMS / ORGANIC REMEDIES */}
                    <Card className="bg-emerald-50/40 border-emerald-200/80 rounded-2xl shadow-xs">
                      <CardHeader className="pb-3 border-b border-emerald-100">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-900">
                          <Leaf className="h-5 w-5 text-emerald-600" />
                          <span>Organic & Bio-Control</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2.5 text-sm text-emerald-950">
                          {(analysisResult.organicTreatment && analysisResult.organicTreatment.length > 0
                            ? analysisResult.organicTreatment
                            : analysisResult.treatment
                          ).map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-snug">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* CHEMICAL & ACTIVE INGREDIENTS */}
                    <Card className="bg-blue-50/40 border-blue-200/80 rounded-2xl shadow-xs">
                      <CardHeader className="pb-3 border-b border-blue-100">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-900">
                          <Stethoscope className="h-5 w-5 text-blue-600" />
                          <span>Chemical & Targeted Spray</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2.5 text-sm text-blue-950">
                          {(analysisResult.chemicalTreatment && analysisResult.chemicalTreatment.length > 0
                            ? analysisResult.chemicalTreatment
                            : ["Apply targeted fungicide/bactericide as per agronomist dosage"]
                          ).map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                              <span className="leading-snug">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* 5-STEP PREVENTION */}
                    <Card className="bg-amber-50/40 border-amber-200/80 rounded-2xl shadow-xs">
                      <CardHeader className="pb-3 border-b border-amber-100">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-900">
                          <ShieldCheck className="h-5 w-5 text-amber-600" />
                          <span>Preventive Protocol</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2.5 text-sm text-amber-950">
                          {analysisResult.prevention.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                              <span className="leading-snug">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* RECOMMENDED STORE SUPPLEMENT BANNER (IF AVAILABLE) */}
                  {analysisResult.supplementName && (
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {analysisResult.supplementImage ? (
                          <img
                            src={analysisResult.supplementImage}
                            alt="Supplement"
                            className="w-14 h-14 rounded-xl object-contain bg-white border border-emerald-100 p-1"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-emerald-200/70 flex items-center justify-center text-emerald-800 font-bold">
                            Rx
                          </div>
                        )}
                        <div>
                          <p className="text-xs uppercase font-bold text-emerald-700 tracking-wider">Recommended Crop Remedy</p>
                          <p className="text-base font-bold text-emerald-950">{analysisResult.supplementName}</p>
                          <p className="text-xs text-emerald-800">Verified agricultural input for {analysisResult.diseaseName}</p>
                        </div>
                      </div>

                      {analysisResult.buyLink ? (
                        <a
                          href={analysisResult.buyLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-xs"
                        >
                          <span>Buy Remedy Online</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                          Available at Regional Mandis & Fertilizer Dealers
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* EMBEDDED CONTEXT CHATBOT */}
                  <EmbeddedAIChat
                    diseaseName={analysisResult.diseaseName}
                    contextData={`Crop: ${analysisResult.cropType}. Condition: ${analysisResult.diseaseName}. Description: ${analysisResult.description}. Organic Remedy: ${analysisResult.organicTreatment?.join(", ")}. Chemical Remedy: ${analysisResult.chemicalTreatment?.join(", ")}. Prevention: ${analysisResult.prevention?.join(", ")}.`}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history">
          <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                <span>Field Scan History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scanHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{scan.crop}</p>
                      <Badge variant="outline" className="text-xs bg-white">
                        {scan.confidence}% Conf.
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{scan.issue}</p>
                    <p className="text-xs text-emerald-700 font-medium">Tx: {scan.treatment}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-slate-400">{scan.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AGRONOMISTS TAB */}
        <TabsContent value="agronomists">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <span>On-Duty Agronomists</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-purple-950">Dr. Raj Kumar (ICAR Certified)</p>
                    <p className="text-xs text-purple-800">Specialist in Plant Pathology & Fungal Blights</p>
                  </div>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                    Call Direct
                  </Button>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-emerald-950">Dr. Priya Sharma</p>
                    <p className="text-xs text-emerald-800">Organic Pest & Disease Management Agronomist</p>
                  </div>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                    Live Chat
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Toll-Free Kisan Call Centers</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 rounded-xl bg-red-50/80 border border-red-100 text-center space-y-2">
                  <p className="text-xs uppercase font-bold text-red-600 tracking-wider">Government of India Helpline</p>
                  <p className="text-3xl font-extrabold text-red-950">1800-180-1551</p>
                  <p className="text-xs text-red-700">Available 6:00 AM – 10:00 PM in 22 regional languages</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* REVIEW QUEUE / LOW ACCURACY TAB */}
        <TabsContent value="low-accuracy">
          <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 text-center space-y-4">
            <ShieldCheck className="h-12 w-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Review & Community Verification Queue</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Images with borderline confidence scores are automatically aggregated here for review by certified agronomists to continuously improve the open-source dataset.
            </p>
            <Button
              onClick={() => navigate("/expert-consultation")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              Open Agronomist Portal
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiseaseDetection;