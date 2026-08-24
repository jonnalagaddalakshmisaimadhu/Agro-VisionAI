import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Eye, Lock, Database, Users, AlertTriangle, CheckCircle } from "lucide-react";

const PrivacyPolicy = () => {
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
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-50 to-green-50">
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
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold text-gray-800">
              Privacy Policy
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 p-8">
            {/* Introduction */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Shield className="h-6 w-6 text-blue-600 mr-2" />
                Your Privacy Matters
              </h2>
              <p className="text-gray-700 leading-relaxed">
                At FarmIQ, we are committed to protecting your privacy and ensuring the security 
                of your personal information. This Privacy Policy explains how we collect, use, 
                store, and protect your data when you use our AI-powered farming platform.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Database className="h-5 w-5 text-green-600 mr-2" />
                1. Information We Collect
              </h3>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Personal Information:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Name and contact details (email, phone number)</li>
                    <li>Farm location and size</li>
                    <li>Account credentials and preferences</li>
                    <li>Profile information and settings</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Agricultural Data:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Crop images and field photographs</li>
                    <li>Yield data and farming practices</li>
                    <li>Weather and soil information</li>
                    <li>Market prices and trends</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Usage Information:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>App usage patterns and features accessed</li>
                    <li>Device information and operating system</li>
                    <li>IP address and location data</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Eye className="h-5 w-5 text-purple-600 mr-2" />
                2. How We Use Your Information
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide AI-powered farming recommendations and insights</li>
                  <li>Improve our disease detection and crop analysis algorithms</li>
                  <li>Send weather alerts and farming notifications</li>
                  <li>Connect you with relevant government schemes and subsidies</li>
                  <li>Facilitate marketplace transactions and equipment rentals</li>
                  <li>Enhance user experience and develop new features</li>
                  <li>Provide customer support and technical assistance</li>
                  <li>Ensure platform security and prevent fraud</li>
                </ul>
              </div>
            </div>

            {/* Data Security */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Lock className="h-5 w-5 text-red-600 mr-2" />
                3. Data Security
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>We implement robust security measures to protect your data:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>End-to-end encryption for all data transmission</li>
                  <li>Secure cloud storage with regular backups</li>
                  <li>Multi-factor authentication for account access</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and employee training on data protection</li>
                  <li>Compliance with industry security standards</li>
                </ul>
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700">
                    <strong>Security Note:</strong> We never store your passwords in plain text. 
                    All passwords are hashed using industry-standard encryption methods.
                  </p>
                </div>
              </div>
            </div>

            {/* Data Sharing */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Users className="h-5 w-5 text-orange-600 mr-2" />
                4. Information Sharing
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>We do not sell, trade, or rent your personal information to third parties. We may share data only in these limited circumstances:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations or court orders</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>With trusted service providers who assist in platform operations</li>
                  <li>In aggregated, anonymized form for research and analytics</li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700">
                    <strong>Important:</strong> We never share your personal farming data with 
                    competitors or marketing companies. Your agricultural information remains 
                    confidential and is used solely to improve our services.
                  </p>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                5. Your Rights
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>You have the following rights regarding your personal data:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Portability:</strong> Export your data in a readable format</li>
                  <li><strong>Restriction:</strong> Limit how we process your data</li>
                  <li><strong>Objection:</strong> Opt out of certain data processing activities</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact us at{" "}
                  <a href="mailto:farmiq.in@gmail.com" className="text-blue-600 hover:underline">
                    farmiq.in@gmail.com
                  </a>
                </p>
              </div>
            </div>

            {/* Cookies and Tracking */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Eye className="h-5 w-5 text-indigo-600 mr-2" />
                6. Cookies and Tracking
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Remember your preferences and settings</li>
                  <li>Analyze app usage and performance</li>
                  <li>Provide personalized content and recommendations</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
                <p>You can control cookie settings through your device or browser preferences.</p>
              </div>
            </div>

            {/* Data Retention */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Database className="h-5 w-5 text-gray-600 mr-2" />
                7. Data Retention
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>We retain your data for as long as necessary to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide our services and maintain your account</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Resolve disputes and enforce our agreements</li>
                  <li>Improve our AI models and algorithms</li>
                </ul>
                <p>When you delete your account, we will remove your personal data within 30 days, 
                though some anonymized data may be retained for research purposes.</p>
              </div>
            </div>

            {/* Children's Privacy */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Users className="h-5 w-5 text-pink-600 mr-2" />
                8. Children's Privacy
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>FarmIQ is not intended for children under 13 years of age. We do not knowingly 
                collect personal information from children under 13. If we become aware that we 
                have collected such information, we will take steps to delete it promptly.</p>
              </div>
            </div>

            {/* International Transfers */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                9. International Data Transfers
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>Your data may be transferred to and processed in countries other than your own. 
                We ensure that such transfers comply with applicable data protection laws and 
                implement appropriate safeguards to protect your information.</p>
              </div>
            </div>

            {/* Changes to Privacy Policy */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                10. Changes to This Policy
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>We may update this Privacy Policy from time to time. We will notify you of 
                significant changes by:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Sending email notifications</li>
                  <li>Displaying in-app notifications</li>
                  <li>Posting updates on our website</li>
                </ul>
                <p>Your continued use of our services after changes constitutes acceptance of the updated policy.</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                11. Contact Us
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Email:</strong> farmiq.in@gmail.com</p>
                  <p><strong>Phone:</strong> +91 86396 68662, +91 63059 36623</p>
                  <p><strong>Address:</strong> FarmIQ Technologies, India</p>
                </div>
              </div>
            </div>

            {/* Agreement */}
            <div className="space-y-4 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-xl font-bold text-blue-800 flex items-center">
                <CheckCircle className="h-6 w-6 text-blue-600 mr-2" />
                Your Consent
              </h3>
              <p className="text-blue-700">
                By using FarmIQ, you consent to the collection, use, and storage of your 
                information as described in this Privacy Policy. We are committed to 
                protecting your privacy and using your data responsibly to improve 
                farming practices and agricultural outcomes.
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
                onClick={() => navigate("/terms")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                View Terms and Conditions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
