import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  BookOpen,
  Lightbulb,
  Leaf,
  Wheat,
  Droplets,
  Sun,
  AlertTriangle,
  TrendingUp,
  MessageCircle,
  FileText,
  Users,
  Shield
} from "lucide-react";
import { useLocation } from "@/context/LocationContext";

const HelpPage = () => {
  const { locationData } = useLocation();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle contact form submission
    console.log("Contact form submitted:", contactForm);
    alert("Thank you for your message! We'll get back to you soon.");
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  const handleInputChange = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  const agricultureCategories = [
    { name: "Crop Management", icon: <Wheat className="h-4 w-4" />, color: "bg-green-100 text-green-800" },
    { name: "Disease Control", icon: <AlertTriangle className="h-4 w-4" />, color: "bg-red-100 text-red-800" },
    { name: "Weather & Climate", icon: <Sun className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-800" },
    { name: "Market Insights", icon: <TrendingUp className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
    { name: "Soil & Nutrients", icon: <Leaf className="h-4 w-4" />, color: "bg-orange-100 text-orange-800" },
    { name: "Water Management", icon: <Droplets className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-800" }
  ];

  const faqs = [
    {
      question: "How do I use the disease detection feature?",
      answer: "Simply upload a clear photo of your plant leaves using the camera icon in the Disease Detection module. Our AI will analyze the image and provide diagnosis and treatment recommendations."
    },
    {
      question: "How accurate is the crop recommendation system?",
      answer: "Our AI-powered crop recommendation system considers soil type, weather conditions, market prices, and your location to provide highly accurate suggestions with 90%+ success rate."
    },
    {
      question: "Can I access government schemes through FarmIQ?",
      answer: "Yes! Our Government Schemes module provides information about subsidies, loans, and schemes available in your area. You can also apply directly through the platform."
    },
    {
      question: "How do I rent farming equipment?",
      answer: "Browse available equipment in the Equipment Rental section, select your preferred dates, and book directly. Equipment owners will contact you to confirm the rental."
    },
    {
      question: "Is my data secure on FarmIQ?",
      answer: "Absolutely! We use enterprise-grade security measures to protect your personal and farming data. All data is encrypted and stored securely."
    }
  ];

  return (
    <div className="p-6 lg:pl-0">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-600 rounded-lg">
              <HelpCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-600">Help & Support Center</h1>
              <p className="text-muted-foreground">Get assistance with FarmIQ features and farming guidance</p>
              {locationData?.locationName && (
                <div className="flex items-center space-x-2 mt-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">Location: {locationData.locationName}</span>
                  {locationData.weatherData && (
                    <span className="text-sm text-gray-600">
                      • {Math.round(locationData.weatherData.main.temp)}°C, {locationData.weatherData.main.humidity}% humidity
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Help Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">User Guide</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Learn how to use all FarmIQ features effectively</p>
                  <Button variant="outline" size="sm" className="w-full">
                    View Guide
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Live Chat</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Chat with our support team for instant help</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Start Chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Community Forum</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Connect with other farmers and share experiences</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Join Forum
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Documentation</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Detailed technical documentation and API guides</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Read Docs
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-sm text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <Input
                        value={contactForm.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <Input
                      value={contactForm.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      placeholder="What can we help you with?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <Textarea
                      value={contactForm.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Please describe your question or issue in detail..."
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agriculture Categories */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" />
                  Agriculture Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {agricultureCategories.map((category, index) => (
                    <div key={index} className={`p-3 rounded-xl ${category.color} hover:shadow-md transition-all duration-200 cursor-pointer`}>
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-white/50 rounded-lg">
                          {category.icon}
                        </div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Emergency Helpline</p>
                    <p className="text-sm text-blue-700">1800-FARM-HELP</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Email Support</p>
                    <p className="text-sm text-green-700">help@farmiq.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-orange-900">Office Hours</p>
                    <p className="text-sm text-orange-700">Mon-Fri: 9AM-6PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-yellow-50">
              <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-green-600 rounded-lg">
                      <Leaf className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Soil Testing</p>
                      <p className="text-xs text-green-700 mt-1">Test your soil every 2-3 years for optimal crop yields</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-600 rounded-lg">
                      <Sun className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Weather Monitoring</p>
                      <p className="text-xs text-blue-700 mt-1">Check weather forecasts daily for better planning</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-orange-600 rounded-lg">
                      <Wheat className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-800">Crop Rotation</p>
                      <p className="text-xs text-orange-700 mt-1">Rotate crops to maintain soil fertility</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-800">Your Data is Secure</p>
                    <p className="text-xs text-green-700">We use enterprise-grade encryption to protect your information</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>Last updated: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;