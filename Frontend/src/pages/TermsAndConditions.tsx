import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Shield, Users, AlertTriangle, CheckCircle } from "lucide-react";

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Beautiful nature background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://static.vecteezy.com/system/resources/thumbnails/054/880/166/small_2x/thriving-tree-in-lush-green-environment-nature-conservation-and-protection-concept-free-photo.jpeg')`,
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl">
        <Card className="bg-white/95 shadow-2xl border-0 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-green-50 to-blue-50">
            {/* Back Button */}
            <div className="flex justify-start mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold text-gray-800">
              Terms and Conditions
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 p-8">
            {/* Introduction */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                Welcome to FarmIQ
              </h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms and Conditions ("Terms") govern your use of the FarmIQ platform, 
                a comprehensive AI-powered smart farming application designed to help farmers 
                increase productivity and profitability. By using our services, you agree to 
                be bound by these Terms.
              </p>
            </div>

            {/* Service Description */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                1. Service Description
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>FarmIQ provides the following services:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>AI-powered crop selection and profit prediction</li>
                  <li>Disease detection through smartphone camera</li>
                  <li>Government schemes and subsidy information</li>
                  <li>Marketplace for seeds, fertilizers, and equipment</li>
                  <li>Weather alerts and climate recommendations</li>
                  <li>Equipment and drone rental services</li>
                </ul>
              </div>
            </div>

            {/* User Responsibilities */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                2. User Responsibilities
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>As a user of FarmIQ, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate and truthful information during registration</li>
                  <li>Maintain the confidentiality of your account credentials</li>
                  <li>Use the service only for legitimate farming purposes</li>
                  <li>Not share false or misleading information about crops or farming practices</li>
                  <li>Respect other users and maintain professional conduct</li>
                  <li>Comply with all applicable local, state, and national laws</li>
                </ul>
              </div>
            </div>

            {/* Data and Privacy */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                3. Data Collection and Privacy
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>We collect and process the following types of data:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Personal information (name, email, phone number)</li>
                  <li>Farm details (location, size, crop types)</li>
                  <li>Agricultural data (crop images, yield information)</li>
                  <li>Usage analytics to improve our services</li>
                </ul>
                <p className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <strong>Note:</strong> We are committed to protecting your privacy. 
                  All data is encrypted and stored securely. We never sell your personal 
                  information to third parties.
                </p>
              </div>
            </div>

            {/* Service Availability */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                4. Service Availability
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>While we strive to provide continuous service, we cannot guarantee:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Uninterrupted access to the platform</li>
                  <li>100% accuracy of AI predictions and recommendations</li>
                  <li>Availability of third-party services (weather data, market prices)</li>
                  <li>Compatibility with all devices or operating systems</li>
                </ul>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                5. Limitation of Liability
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>FarmIQ shall not be liable for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Crop losses or reduced yields based on our recommendations</li>
                  <li>Inaccurate weather predictions or market price forecasts</li>
                  <li>Technical issues or service interruptions</li>
                  <li>Third-party services or external factors beyond our control</li>
                  <li>Indirect, incidental, or consequential damages</li>
                </ul>
                <p className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <strong>Important:</strong> Our recommendations are based on AI analysis 
                  and should be used as guidance. Always consult with local agricultural 
                  experts for critical farming decisions.
                </p>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                6. Intellectual Property
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>All content, features, and functionality of FarmIQ are owned by us and protected by copyright, trademark, and other intellectual property laws.</p>
                <p>You may not:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Copy, modify, or distribute our software</li>
                  <li>Reverse engineer or attempt to extract source code</li>
                  <li>Use our trademarks or logos without permission</li>
                  <li>Create derivative works based on our platform</li>
                </ul>
              </div>
            </div>

            {/* Termination */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <AlertTriangle className="h-5 w-5 text-gray-600 mr-2" />
                7. Account Termination
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>We may suspend or terminate your account if you:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violate these Terms and Conditions</li>
                  <li>Engage in fraudulent or illegal activities</li>
                  <li>Provide false or misleading information</li>
                  <li>Misuse the platform or harm other users</li>
                </ul>
                <p>You may terminate your account at any time by contacting our support team.</p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                8. Changes to Terms
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>We reserve the right to modify these Terms at any time. We will notify users of significant changes through:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email notifications</li>
                  <li>In-app notifications</li>
                  <li>Website announcements</li>
                </ul>
                <p>Continued use of the service after changes constitutes acceptance of the new Terms.</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                9. Contact Information
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>If you have any questions about these Terms, please contact us:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Email:</strong> farmiq.in@gmail.com</p>
                  <p><strong>Phone:</strong> +91 86396 68662, +91 63059 36623</p>
                  <p><strong>Address:</strong> FarmIQ Technologies, India</p>
                </div>
              </div>
            </div>

            {/* Agreement */}
            <div className="space-y-4 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-xl font-bold text-green-800 flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                Agreement
              </h3>
              <p className="text-green-700">
                By using FarmIQ, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. 
                If you do not agree with any part of these Terms, you must not use our services.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                onClick={() => navigate("/register")}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Back to Registration
              </Button>
              <Button
                onClick={() => navigate("/privacy")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                View Privacy Policy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions;
