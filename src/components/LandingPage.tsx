import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Sprout, 
  Shield, 
  ShoppingCart, 
  FileText, 
  TrendingUp, 
  Smartphone,
  Leaf,
  Brain,
  Users,
  Award,
  Camera,
  Tractor,
  CloudRain,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Phone,
  MessageCircle,
  AlertTriangle,
  Target,
  Zap,
  TrendingDown,
  Building2
} from "lucide-react";

const LandingPage = ({ onClickLogin }: { onClickLogin?: () => void }) => {
  const [language, setLanguage] = useState("en");

  const problems = [
    { icon: TrendingDown, text: "Low crop profits due to poor market timing" },
    { icon: AlertTriangle, text: "Crop diseases detected too late" },
    { icon: FileText, text: "No access to government schemes" },
    { icon: DollarSign, text: "Expensive farming equipment & tools" }
  ];

  const solutions = [
    { icon: Brain, text: "AI recommendations & profit predictions" },
    { icon: Camera, text: "Instant disease detection via phone" },
    { icon: Building2, text: "Easy access to subsidies & schemes" },
    { icon: ShoppingCart, text: "Affordable marketplace & equipment rental" }
  ];

  const coreFeatures = [
    {
      icon: Sprout,
      title: "🌾 AI Crop Selection & Profit Prediction",
      description: "Choose the right crops based on soil, weather, and market data to maximize your profits.",
      gradient: "from-primary to-primary-glow"
    },
    {
      icon: Camera,
      title: "📸 Disease Detection with Phone Camera",
      description: "Simply take a photo to instantly identify crop diseases and get treatment recommendations.",
      gradient: "from-accent to-warning"
    },
    {
      icon: Building2,
      title: "🏛 Government Schemes & Subsidy Checker",
      description: "Discover and apply for subsidies, loans, and schemes you never knew existed.",
      gradient: "from-success to-primary"
    },
    {
      icon: ShoppingCart,
      title: "🛒 Seeds & Fertilizers Marketplace",
      description: "Buy quality seeds, fertilizers at competitive prices. Sell your produce directly.",
      gradient: "from-warning to-accent"
    },
    {
      icon: Tractor,
      title: "🚜 Equipment & Drone Rental",
      description: "Rent tractors, drones, and modern equipment without huge investments.",
      gradient: "from-earth to-success"
    },
    {
      icon: CloudRain,
      title: "☁️ Climate Alerts & Weather Updates",
      description: "Get real-time weather warnings and optimal planting/harvesting recommendations.",
      gradient: "from-primary to-accent"
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Scan Your Crops",
      description: "Take photos of your crops or fields using your smartphone camera",
      icon: Camera
    },
    {
      step: "2", 
      title: "Get AI Insights",
      description: "Our AI analyzes your data and provides profit predictions and recommendations",
      icon: Brain
    },
    {
      step: "3",
      title: "Take Action",
      description: "Connect to services, buy supplies, rent equipment, or access government schemes",
      icon: CheckCircle
    }
  ];

  const testimonials = [
    {
      name: "Ramcharan Mannedi",
      location: "Punjab",
      crop: "Wheat",
      quote: "FarmIQ helped me increase my wheat yield by 35%. The profit prediction feature is amazing!",
      rating: 5,
      improvement: "35% yield increase",
      photo: "👨‍🌾"
    },
    {
      name: "Charith Katakam",
      location: "Warangal", 
      crop: "Tomato",
      quote: "The government schemes checker helped me get ₹50,000 subsidy that I didn't know existed. Game changer!",
      rating: 5,
      improvement: "₹50K subsidy received",
      photo: "👩‍🌾"
    },
    {
      name: "Dileep Deevaram",
      location: "Hyderabad",
      crop: "Paddy",
      quote: "Disease detection saved my tomato crop. Early identification and treatment prevented major losses.",
      rating: 5,
      improvement: "Saved entire crop",
      photo: "👨‍🌾"
    }
  ];

  const faqs = [
    {
      question: "How accurate is disease detection?",
      answer: "Our AI has been trained on millions of crop images and achieves 95%+ accuracy in detecting common diseases affecting Indian crops."
    },
    {
      question: "Can I use it offline?",
      answer: "Yes! Key functions like crop scanning and basic recommendations work offline. Data syncs when connection is available."
    },
    {
      question: "Is it available in my language?",
      answer: "FarmIQ supports 15+ Indian languages including Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, and more, with audio support."
    },
    {
      question: "How much does it cost?",
      answer: "FarmIQ is free to download and use basic features. Premium features are available for ₹99/month."
    },
    {
      question: "Can it help me sell crops?",
      answer: "Yes! Our marketplace connects you directly with buyers, eliminating middlemen. Price prediction helps you time sales for maximum profit."
    }
  ];

  const stats = [
    { number: "2,00,000+", label: "Farmers Using FarmIQ" },
    { number: "+40%", label: "Average Profit Increase" },
    { number: "-70%", label: "Reduced Crop Losses" },
    { number: "95%", label: "Disease Detection Accuracy" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">FarmIQ</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                  <SelectItem value="te">తెలుగు</SelectItem>
                  <SelectItem value="bn">বাংলা</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="hidden sm:flex" onClick={onClickLogin}>Login</Button>
              <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-success/5">        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 lg:space-y-8">
              <Badge className="w-fit bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                🌾 AI-Powered Smart Farming Platform
              </Badge>
              
              <div className="space-y-4 lg:space-y-6">
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Smarter Farming,{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Higher Profits
                  </span>
                </h1>
                
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  Choose the right crops, detect diseases early, get weather alerts, and earn more profits – all in one app.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                <Button size="lg" className="h-12 lg:h-14 px-6 lg:px-8 text-base lg:text-lg bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
                  <Smartphone className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                  Download App
                </Button>
                <Button size="lg" variant="outline" onClick={onClickLogin} className="h-12 lg:h-14 px-6 lg:px-8 text-base lg:text-lg">
                  <Play className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                  Login / Register
                </Button>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="aspect-square lg:aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl flex items-center justify-center p-6 lg:p-8">
                <div className="text-center space-y-4">
                  <div className="flex flex-wrap justify-center gap-3 lg:gap-4 mb-6 lg:mb-8">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary/20 rounded-2xl flex items-center justify-center animate-float">
                      <Smartphone className="h-8 w-8 lg:h-10 lg:w-10 text-primary" />
                    </div>
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-accent/20 rounded-2xl flex items-center justify-center animate-float" style={{animationDelay: '1s'}}>
                      <Camera className="h-8 w-8 lg:h-10 lg:w-10 text-accent" />
                    </div>
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-success/20 rounded-2xl flex items-center justify-center animate-float" style={{animationDelay: '2s'}}>
                      <Sprout className="h-8 w-8 lg:h-10 lg:w-10 text-success" />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm lg:text-base">Farmer using technology in fields</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats Section */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
                  {stat.number}
                </div>
                <div className="text-sm lg:text-base text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 space-y-4">
            <Badge className="bg-warning/10 text-warning border-warning/20">
              🎯 Common Farmer Problems
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground">
              We Understand Your Challenges
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Problems */}
            <div className="space-y-6">
              <h3 className="text-xl lg:text-2xl font-bold text-destructive mb-6">❌ Current Problems:</h3>
              <div className="space-y-4">
                {problems.map((problem, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-destructive/5 rounded-xl border border-destructive/20">
                    <problem.icon className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                    <p className="text-muted-foreground">{problem.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div className="space-y-6">
              <h3 className="text-xl lg:text-2xl font-bold text-success mb-6">✅ FarmIQ Solutions:</h3>
              <div className="space-y-4">
                {solutions.map((solution, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-success/5 rounded-xl border border-success/20">
                    <solution.icon className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                    <p className="text-muted-foreground">{solution.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 space-y-4">
            <Badge className="bg-accent/10 text-accent border-accent/20">
              🚀 Core Features
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground">
              Everything You Need for Smart Farming
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive AI-powered tools to boost your farming success and increase profits.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {coreFeatures.map((feature, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-hover-lift"
              >
                <CardContent className="p-6 lg:p-8">
                  <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} p-3 lg:p-4 mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-full w-full text-white" />
                  </div>
                  
                  <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 space-y-4">
            <Badge className="bg-success/10 text-success border-success/20">
              📱 3 Simple Steps
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground">
              How FarmIQ Works
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              Get started in just 3 simple steps and transform your farming experience
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center space-y-4 lg:space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 lg:w-8 lg:h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-xs lg:text-sm">
                    {step.step}
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute top-8 lg:top-10 -right-16 lg:-right-20 h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2 lg:space-y-3">
                  <h3 className="text-lg lg:text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm lg:text-base text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact/Results Section */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6 lg:space-y-8">
              <div className="space-y-4">
                <Badge className="bg-warning/10 text-warning border-warning/20">
                  💰 Proven Results
                </Badge>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                  Real Impact for Real Farmers
                </h2>
                <p className="text-lg lg:text-xl text-muted-foreground">
                  Join 2 lakh+ farmers who have transformed their farming with FarmIQ's AI-powered solutions.
                </p>
              </div>

              <div className="grid gap-4 lg:gap-6">
                <div className="flex items-start space-x-4 p-4 lg:p-6 bg-success/5 rounded-xl">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-success/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 lg:mb-2">+40% Average Profit Increase</h3>
                    <p className="text-sm lg:text-base text-muted-foreground">Smart crop selection and timing increases farmer profits significantly</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 lg:p-6 bg-primary/5 rounded-xl">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 lg:mb-2">-70% Reduced Crop Losses</h3>
                    <p className="text-sm lg:text-base text-muted-foreground">Early disease detection and weather alerts prevent major crop failures</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 lg:p-6 bg-accent/5 rounded-xl">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 lg:h-6 lg:w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 lg:mb-2">95% Disease Detection Accuracy</h3>
                    <p className="text-sm lg:text-base text-muted-foreground">AI-powered camera detection identifies crop diseases with exceptional precision</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-success/10 to-primary/10 rounded-3xl p-6 lg:p-8 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-3 lg:gap-4 w-full">
                  <div className="bg-background rounded-2xl p-4 lg:p-6 text-center shadow-lg">
                    <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-success mx-auto mb-2" />
                    <div className="text-xl lg:text-2xl font-bold text-success">+40%</div>
                    <div className="text-xs lg:text-sm text-muted-foreground">Profit Boost</div>
                  </div>
                  <div className="bg-background rounded-2xl p-4 lg:p-6 text-center shadow-lg">
                    <Shield className="h-6 w-6 lg:h-8 lg:w-8 text-primary mx-auto mb-2" />
                    <div className="text-xl lg:text-2xl font-bold text-primary">-70%</div>
                    <div className="text-xs lg:text-sm text-muted-foreground">Crop Losses</div>
                  </div>
                  <div className="bg-background rounded-2xl p-4 lg:p-6 text-center shadow-lg">
                    <Users className="h-6 w-6 lg:h-8 lg:w-8 text-accent mx-auto mb-2" />
                    <div className="text-xl lg:text-2xl font-bold text-accent">2L+</div>
                    <div className="text-xs lg:text-sm text-muted-foreground">Farmers</div>
                  </div>
                  <div className="bg-background rounded-2xl p-4 lg:p-6 text-center shadow-lg">
                    <Target className="h-6 w-6 lg:h-8 lg:w-8 text-warning mx-auto mb-2" />
                    <div className="text-xl lg:text-2xl font-bold text-warning">95%</div>
                    <div className="text-xs lg:text-sm text-muted-foreground">Accuracy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              ⭐ Success Stories
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground">
              What Farmers Say About FarmIQ
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              Real stories from farmers who've transformed their harvests with FarmIQ
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="group hover:shadow-hover-lift transition-all duration-300">
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-center space-x-4 mb-4 lg:mb-6">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-xl lg:text-2xl">
                      {testimonial.photo}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.location} • {testimonial.crop}</p>
                    </div>
                  </div>
                  
                  <div className="flex mb-3 lg:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 lg:h-5 lg:w-5 fill-warning text-warning" />
                    ))}
                  </div>
                  
                  <p className="text-sm lg:text-base text-muted-foreground mb-4 italic">
                    "{testimonial.quote}"
                  </p>
                  
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    {testimonial.improvement}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 space-y-4">
            <Badge className="bg-earth/10 text-earth border-earth/20">
              ❓ Frequently Asked Questions
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground">
              Got Questions? We Have Answers
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground">
              Common questions from farmers about FarmIQ
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-background rounded-xl border px-6 py-2">
                <AccordionTrigger className="text-left font-semibold text-base lg:text-lg hover:no-underline hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm lg:text-base text-muted-foreground pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-success/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6 lg:space-y-8">
            <Badge className="bg-primary/20 text-primary border-primary/30 mx-auto">
              🚀 Ready to Start?
            </Badge>
            
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground">
              Ready to Grow Smarter?
            </h2>
            
            <p className="text-lg lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Join 2 lakh+ farmers already using FarmIQ to earn more and waste less.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center pt-6 lg:pt-8">
              <Button size="lg" className="h-14 lg:h-16 px-8 lg:px-10 text-lg lg:text-xl bg-primary hover:bg-primary/90 shadow-xl hover:shadow-2xl transition-all animate-pulse-glow">
                <Smartphone className="mr-3 h-5 w-5 lg:h-6 lg:w-6" />
                Download FarmIQ App
              </Button>
              <div className="text-center sm:text-left">
                <p className="text-sm lg:text-base text-muted-foreground">
                  ✅ Free Download • ✅ Offline Support • ✅ Multi-Language
                </p>
              </div>
            </div>
            
            <div className="flex justify-center items-center space-x-8 pt-8 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 fill-warning text-warning" />
                <span className="text-sm lg:text-base">4.8/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm lg:text-base">2L+ Downloads</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-success" />
                <span className="text-sm lg:text-base">100% Safe</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Leaf className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">FarmIQ</span>
              </div>
              <p className="text-sm lg:text-base opacity-80">
                AI-powered farming platform helping farmers increase profits and reduce crop losses.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm lg:text-base opacity-80">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm lg:text-base opacity-80">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-sm lg:text-base opacity-80">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+91 86396 68662, +91 63059 36623</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>farmiq.in@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-background/20 mt-8 lg:mt-12 pt-6 lg:pt-8 text-center text-sm lg:text-base opacity-60">
            <p>&copy; 2024 FarmIQ. All rights reserved. Made with ❤️ for Indian farmers.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;