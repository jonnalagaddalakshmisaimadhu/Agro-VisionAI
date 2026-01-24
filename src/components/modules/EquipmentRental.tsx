import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  Search,
  MapPin,
  Calendar,
  Clock,
  Star,
  Phone,
  Shield,
  Wrench,
  Fuel,
  Settings,
  Edit,
  Save,
  X,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Check,
  ChevronRight,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ListedEquipment {
  id: number;
  name: string;
  type: string;
  owner: string;
  location: string;
  rating: number;
  pricePerDay: string;
  pricePerHour: string;
  available: boolean;
  image: string;
  features: string[];
  specifications: {
    power?: string;
    width?: string;
    fuel?: string;
    type?: string;
    year: string;
  };
  listedAt: string;
  imageFile?: string; // URL for the uploaded image
  videoFile?: string; // URL for the uploaded video
  phoneNumber?: string;
  operatorAvailable?: boolean;
  operatorName?: string;
  operatorFee?: string;
  nearbyShop?: string;
}


const EquipmentRental = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [activeTab, setActiveTab] = useState("rent");
  const { toast } = useToast();

  // Form state for listing equipment
  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    type: "",
    pricePerDay: "",
    pricePerHour: "",
    year: "",
    specifications: "",
    location: "",
    features: "",
    image: null as File | null,
    video: null as File | null,
    phoneNumber: "",
    operatorAvailable: false,
    operatorName: "",
    operatorFee: "",
    nearbyShop: ""
  });

  // State for user's listed equipment
  const [userListedEquipment, setUserListedEquipment] = useState<ListedEquipment[]>([]);

  // State for editing
  const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    type: "",
    pricePerDay: "",
    pricePerHour: "",
    year: "",
    specifications: "",
    location: "",
    features: ""
  });

  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBookingEquipment, setSelectedBookingEquipment] = useState<ListedEquipment | null>(null);
  const [bookingOptions, setBookingOptions] = useState({
    includeOperator: false,
    includeShopService: false,
    includeRepairPackage: false,
    selectedShop: true // Added shop selection state
  });

  // State for managing user's rentals
  const [myRentals, setMyRentals] = useState([
    {
      id: 1,
      equipment: "John Deere Tractor 5310",
      renter: "Suresh Patil",
      startDate: "2024-01-15",
      endDate: "2024-01-20",
      status: "Active",
      amount: "₹12,500",
      equipmentId: 1
    },
    {
      id: 2,
      equipment: "Rotary Tiller",
      renter: "Madhav Farmers Collective",
      startDate: "2024-01-10",
      endDate: "2024-01-12",
      status: "Completed",
      amount: "₹1,600",
      equipmentId: 3
    }
  ]);

  // Initial equipment (these will be combined with user listed equipment)
  const initialEquipment: ListedEquipment[] = [
    {
      id: 1,
      name: "John Deere Tractor 5310",
      type: "tractor",
      owner: "Ramesh Agriculture Services",
      location: "Pune, Maharashtra",
      rating: 4.8,
      pricePerDay: "₹2,500",
      pricePerHour: "₹350",
      available: true,
      image: "🚜",
      features: ["GPS Enabled", "Air Conditioning", "PTO", "Hydraulic Lift"],
      specifications: {
        power: "75 HP",
        fuel: "Diesel",
        year: "2020"
      },
      listedAt: "2024-01-10",
      operatorAvailable: true,
      operatorName: "Rajesh Kumar",
      operatorFee: "500",
      nearbyShop: "Green Valley Service Center (Nashik)"
    },
    {
      id: 2,
      name: "Mahindra Harvester",
      type: "harvester",
      owner: "Green Valley Equipment",
      location: "Nashik, Maharashtra",
      rating: 4.6,
      pricePerDay: "₹4,000",
      pricePerHour: "₹500",
      available: true,
      image: "🌾",
      features: ["Auto Steering", "Grain Tank", "Chopper", "Self-Propelled"],
      specifications: {
        power: "120 HP",
        fuel: "Diesel",
        year: "2019"
      },
      listedAt: "2024-01-12"
    },
    {
      id: 3,
      name: "Rotary Tiller",
      type: "tiller",
      owner: "Modern Farm Tools",
      location: "Satara, Maharashtra",
      rating: 4.9,
      pricePerDay: "₹800",
      pricePerHour: "₹120",
      available: false,
      image: "🔧",
      features: ["Heavy Duty", "Adjustable Depth", "Side Drive", "Oil Bath Gearbox"],
      specifications: {
        width: "6 feet",
        type: "Rotary",
        year: "2021"
      },
      listedAt: "2024-01-14"
    },
    {
      id: 4,
      name: "Water Pump Set",
      type: "pump",
      owner: "AquaTech Solutions",
      location: "Pune, Maharashtra",
      rating: 4.7,
      pricePerDay: "₹600",
      pricePerHour: "₹80",
      available: true,
      image: "💧",
      features: ["High Pressure", "Self Priming", "Portable", "Low Maintenance"],
      specifications: {
        power: "5 HP",
        fuel: "Electric",
        year: "2022"
      },
      listedAt: "2024-01-16"
    }
  ];

  // State for managing all equipment (initial + user listed)
  const [allEquipment, setAllEquipment] = useState<ListedEquipment[]>([...initialEquipment]);

  // Combine all equipment
  const equipment = [...allEquipment, ...userListedEquipment];


  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === "all" ||
      item.location.toLowerCase().includes(selectedLocation.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  // Get equipment emoji based on type
  const getEquipmentEmoji = (type: string) => {
    switch (type) {
      case 'tractor': return '🚜';
      case 'harvester': return '🌾';
      case 'tiller': return '🔧';
      case 'pump': return '💧';
      case 'sprayer': return '🚿';
      default: return '⚙️';
    }
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: string | File | null) => {
    setEquipmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    if (e.target.files && e.target.files[0]) {
      handleFormChange(type, e.target.files[0]);
    }
  };


  // Handle equipment listing
  const handleListEquipment = () => {
    if (!equipmentForm.name || !equipmentForm.type || !equipmentForm.pricePerDay || !equipmentForm.pricePerHour) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newEquipment: ListedEquipment = {
      id: Date.now(),
      name: equipmentForm.name,
      type: equipmentForm.type,
      owner: "You",
      location: equipmentForm.location || "Your Location",
      rating: 5.0,
      pricePerDay: `₹${equipmentForm.pricePerDay}`,
      pricePerHour: `₹${equipmentForm.pricePerHour}`,
      available: true,
      image: getEquipmentEmoji(equipmentForm.type),
      features: equipmentForm.features.split(',').map(f => f.trim()).filter(f => f),
      specifications: {
        power: equipmentForm.specifications.includes('HP') ? equipmentForm.specifications : undefined,
        width: equipmentForm.specifications.includes('feet') ? equipmentForm.specifications : undefined,
        fuel: equipmentForm.specifications.includes('Diesel') || equipmentForm.specifications.includes('Electric') ? equipmentForm.specifications.split(',')[1]?.trim() : undefined,
        type: equipmentForm.specifications.includes('Rotary') ? equipmentForm.specifications.split(',')[2]?.trim() : undefined,
        year: equipmentForm.year
      },
      listedAt: new Date().toISOString().split('T')[0],
      imageFile: equipmentForm.image ? URL.createObjectURL(equipmentForm.image) : undefined,
      videoFile: equipmentForm.video ? URL.createObjectURL(equipmentForm.video) : undefined,
      phoneNumber: equipmentForm.phoneNumber,
      operatorAvailable: equipmentForm.operatorAvailable,
      operatorName: equipmentForm.operatorName,
      operatorFee: equipmentForm.operatorFee,
      nearbyShop: equipmentForm.nearbyShop
    };

    setUserListedEquipment(prev => [...prev, newEquipment]);
    setAllEquipment(prev => [...prev, newEquipment]);

    // Reset form
    setEquipmentForm({
      name: "",
      type: "",
      pricePerDay: "",
      pricePerHour: "",
      year: "",
      specifications: "",
      location: "",
      features: "",
      image: null,
      video: null,
      phoneNumber: "",
      operatorAvailable: false,
      operatorName: "",
      operatorFee: "",
      nearbyShop: ""
    });

    toast({
      title: "Equipment Listed Successfully!",
      description: `${newEquipment.name} has been added to the rental marketplace`,
    });

    // Switch to rent tab to show the listed equipment
    setActiveTab("rent");
  };

  // Handle deleting user listed equipment
  const handleDeleteEquipment = (equipmentId: number) => {
    setUserListedEquipment(prev => prev.filter(equipment => equipment.id !== equipmentId));
    setAllEquipment(prev => prev.filter(equipment => equipment.id !== equipmentId));
    toast({
      title: "Equipment Deleted",
      description: "Your equipment listing has been removed",
    });
  };

  // Handle edit form input changes
  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle starting edit mode
  const handleStartEdit = (equipment: ListedEquipment) => {
    setEditingEquipmentId(equipment.id);
    setEditForm({
      name: equipment.name,
      type: equipment.type,
      pricePerDay: equipment.pricePerDay.replace('₹', ''),
      pricePerHour: equipment.pricePerHour.replace('₹', ''),
      year: equipment.specifications.year,
      specifications: `${equipment.specifications.power || equipment.specifications.width || ''}, ${equipment.specifications.fuel || equipment.specifications.type || ''}`,
      location: equipment.location,
      features: equipment.features.join(', ')
    });
  };

  // Handle saving edit
  const handleSaveEdit = () => {
    if (!editingEquipmentId || !editForm.name || !editForm.type || !editForm.pricePerDay || !editForm.pricePerHour) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setUserListedEquipment(prev => prev.map(equipment =>
      equipment.id === editingEquipmentId
        ? {
          ...equipment,
          name: editForm.name,
          type: editForm.type,
          pricePerDay: `₹${editForm.pricePerDay}`,
          pricePerHour: `₹${editForm.pricePerHour}`,
          location: editForm.location,
          features: editForm.features.split(',').map(f => f.trim()).filter(f => f),
          specifications: {
            power: editForm.specifications.includes('HP') ? editForm.specifications : undefined,
            width: editForm.specifications.includes('feet') ? editForm.specifications : undefined,
            fuel: editForm.specifications.includes('Diesel') || editForm.specifications.includes('Electric') ? editForm.specifications.split(',')[1]?.trim() : undefined,
            type: editForm.specifications.includes('Rotary') ? editForm.specifications.split(',')[2]?.trim() : undefined,
            year: editForm.year
          },
          image: getEquipmentEmoji(editForm.type)
        }
        : equipment
    ));

    setEditingEquipmentId(null);
    setEditForm({
      name: "",
      type: "",
      pricePerDay: "",
      pricePerHour: "",
      year: "",
      specifications: "",
      location: "",
      features: ""
    });

    toast({
      title: "Equipment Updated!",
      description: "Your equipment has been successfully updated",
    });
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingEquipmentId(null);
    setEditForm({
      name: "",
      type: "",
      pricePerDay: "",
      pricePerHour: "",
      year: "",
      specifications: "",
      location: "",
      features: ""
    });
  };

  // Handle booking equipment (opens modal)
  const handleBookEquipment = (equipment: ListedEquipment) => {
    setSelectedBookingEquipment(equipment);
    setBookingOptions({
      includeOperator: false,
      includeShopService: false,
      includeRepairPackage: false,
      selectedShop: true
    });
    setIsBookingModalOpen(true);
  };

  // Finalize booking
  const handleConfirmBooking = () => {
    if (!selectedBookingEquipment) return;

    const equipment = selectedBookingEquipment;

    // Calculate final rental amount
    const basePrice = parseInt(equipment.pricePerDay.replace('₹', '').replace(',', ''));
    let totalPerDay = basePrice;

    if (bookingOptions.includeOperator && equipment.operatorFee) {
      totalPerDay += parseInt(equipment.operatorFee);
    }

    const rentalAmount = totalPerDay * 5; // 5 days rental for demo

    // Generate dates
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 5);

    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Create new rental
    const newRental = {
      id: Date.now(),
      equipment: equipment.name,
      renter: "You",
      startDate: startDateStr,
      endDate: endDateStr,
      status: "Active",
      amount: `₹${rentalAmount.toLocaleString()}`,
      equipmentId: equipment.id
    };

    // Add to user's rentals
    setMyRentals(prev => [newRental, ...prev]);

    // Update equipment availability
    setAllEquipment(prev => prev.map(item =>
      item.id === equipment.id
        ? { ...item, available: false }
        : item
    ));

    setUserListedEquipment(prev => prev.map(item =>
      item.id === equipment.id
        ? { ...item, available: false }
        : item
    ));

    setIsBookingModalOpen(false);
    setSelectedBookingEquipment(null);

    toast({
      title: "Equipment Booked Successfully!",
      description: `You have booked ${equipment.name} from ${startDateStr} to ${endDateStr}`,
    });

    setActiveTab("manage");
  };

  // Handle canceling an active rental
  const handleCancelRental = (rentalId: number, equipmentId: number) => {
    // Update rental status to "Cancelled"
    setMyRentals(prev => prev.map(rental =>
      rental.id === rentalId
        ? { ...rental, status: "Cancelled" }
        : rental
    ));

    // Make equipment available again
    setAllEquipment(prev => prev.map(item =>
      item.id === equipmentId
        ? { ...item, available: true }
        : item
    ));

    // Update user listed equipment availability if it exists there
    setUserListedEquipment(prev => prev.map(item =>
      item.id === equipmentId
        ? { ...item, available: true }
        : item
    ));

    toast({
      title: "Rental Cancelled Successfully!",
      description: "Your equipment rental has been cancelled and the equipment is now available again",
    });
  };

  return (
    <div className="space-y-6 lg:pl-4 pt-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-r from-success to-primary rounded-lg">
          <Truck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Equipment Rental</h1>
          <p className="text-muted-foreground">Rent or list agricultural equipment and machinery</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-fit grid-cols-3">
          <TabsTrigger value="rent">Rent Equipment</TabsTrigger>
          <TabsTrigger value="list">List Equipment</TabsTrigger>
          <TabsTrigger value="manage">My Rentals</TabsTrigger>
        </TabsList>

        <TabsContent value="rent" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-48">
                <MapPin className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="pune">Pune</SelectItem>
                <SelectItem value="nashik">Nashik</SelectItem>
                <SelectItem value="satara">Satara</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Equipment Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredEquipment.map((item) => (
              <Card key={item.id} className={`border-0 shadow-card-shadow hover:shadow-hover-lift transition-all duration-300 ${!item.available ? 'opacity-75' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">
                        {item.imageFile ? (
                          <img src={item.imageFile} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          item.image
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{item.type}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge
                            className={item.available
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                            }
                          >
                            {item.available ? "Available" : "Rented"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{item.pricePerDay}</p>
                      <p className="text-xs text-muted-foreground">per day</p>
                      <p className="text-sm text-muted-foreground">{item.pricePerHour}/hour</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Owner</p>
                      <p className="font-medium">{item.owner}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {item.location}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground">Power</p>
                      <p className="font-medium">{item.specifications.power || item.specifications.width}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground">Fuel</p>
                      <p className="font-medium">{item.specifications.fuel || item.specifications.type}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground">Year</p>
                      <p className="font-medium">{item.specifications.year}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Features</p>
                    <div className="flex flex-wrap gap-1">
                      {item.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {item.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-warning fill-current" />
                      <span className="text-sm font-medium">{item.rating}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => item.phoneNumber && (window.location.href = `tel:${item.phoneNumber}`)}>
                        <Phone className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        disabled={!item.available}
                        onClick={() => item.available && handleBookEquipment(item)}
                      >
                        <Calendar className="mr-1 h-3 w-3" />
                        {item.available ? "Book Now" : "Unavailable"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card className="border-0 shadow-card-shadow">
            <CardHeader>
              <CardTitle>List Your Equipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Equipment Name *</label>
                  <Input
                    placeholder="e.g., John Deere Tractor 5310"
                    value={equipmentForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type *</label>
                  <Select value={equipmentForm.type} onValueChange={(value) => handleFormChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tractor">Tractor</SelectItem>
                      <SelectItem value="harvester">Harvester</SelectItem>
                      <SelectItem value="tiller">Tiller</SelectItem>
                      <SelectItem value="pump">Pump</SelectItem>
                      <SelectItem value="sprayer">Sprayer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="e.g., 9876543210"
                  value={equipmentForm.phoneNumber}
                  onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Upload Image</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'image')}
                      className="cursor-pointer"
                    />
                  </div>
                  {equipmentForm.image && <p className="text-xs text-green-600 mt-1">Image selected: {equipmentForm.image.name}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Upload Video</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange(e, 'video')}
                      className="cursor-pointer"
                    />
                  </div>
                  {equipmentForm.video && <p className="text-xs text-green-600 mt-1">Video selected: {equipmentForm.video.name}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Price per Day (₹) *</label>
                  <Input
                    type="number"
                    placeholder="2500"
                    value={equipmentForm.pricePerDay}
                    onChange={(e) => handleFormChange('pricePerDay', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price per Hour (₹) *</label>
                  <Input
                    type="number"
                    placeholder="350"
                    value={equipmentForm.pricePerHour}
                    onChange={(e) => handleFormChange('pricePerHour', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Year</label>
                  <Input
                    type="number"
                    placeholder="2020"
                    value={equipmentForm.year}
                    onChange={(e) => handleFormChange('year', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Specifications</label>
                  <Input
                    placeholder="e.g., 75 HP, Diesel, 4WD"
                    value={equipmentForm.specifications}
                    onChange={(e) => handleFormChange('specifications', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    placeholder="e.g., Pune, Maharashtra"
                    value={equipmentForm.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Features (comma separated)</label>
                <Input
                  placeholder="e.g., GPS Enabled, Air Conditioning, PTO"
                  value={equipmentForm.features}
                  onChange={(e) => handleFormChange('features', e.target.value)}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-1 bg-primary/10 rounded">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium">Operator & Services</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                      <div className="space-y-0.5">
                        <Label htmlFor="operator-available">Operator Available?</Label>
                        <p className="text-xs text-muted-foreground">Is an operator included or available for hire?</p>
                      </div>
                      <Switch
                        id="operator-available"
                        checked={equipmentForm.operatorAvailable}
                        onCheckedChange={(checked) => handleFormChange('operatorAvailable', checked as any)}
                      />
                    </div>

                    {equipmentForm.operatorAvailable && (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <Label>Operator Name (Optional)</Label>
                          <Input
                            placeholder="e.g., Rajesh Kumar"
                            value={equipmentForm.operatorName}
                            onChange={(e) => handleFormChange('operatorName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Daily Fee (₹)</Label>
                          <Input
                            type="number"
                            placeholder="500"
                            value={equipmentForm.operatorFee}
                            onChange={(e) => handleFormChange('operatorFee', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Nearby Support Shop</Label>
                    <Select
                      value={equipmentForm.nearbyShop}
                      onValueChange={(value) => handleFormChange('nearbyShop', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a support shop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Green Valley Service Center (Nashik)">Green Valley Service Center (Nashik)</SelectItem>
                        <SelectItem value="Pune Agri-Tech Support">Pune Agri-Tech Support</SelectItem>
                        <SelectItem value="Satara Machinery Hub">Satara Machinery Hub</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Select a nearby shop for official support and maintenance.</p>
                  </div>
                </div>
              </div>

              <Button className="w-full h-12 text-lg font-semibold bg-success hover:bg-success/90" onClick={handleListEquipment}>
                <Settings className="mr-2 h-5 w-5" />
                List Equipment
              </Button>
            </CardContent>
          </Card>

          {/* User's Listed Equipment */}
          {userListedEquipment.length > 0 && (
            <Card className="border-0 shadow-card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Your Listed Equipment ({userListedEquipment.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userListedEquipment.map((equipment) => (
                    <div key={equipment.id} className="border rounded-lg">
                      {editingEquipmentId === equipment.id ? (
                        // Edit Mode
                        <div className="p-4 space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Edit Equipment</h4>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                className="bg-success hover:bg-success/90"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Equipment Name *</label>
                              <Input
                                placeholder="e.g., John Deere Tractor 5310"
                                value={editForm.name}
                                onChange={(e) => handleEditFormChange('name', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Type *</label>
                              <Select value={editForm.type} onValueChange={(value) => handleEditFormChange('type', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="tractor">Tractor</SelectItem>
                                  <SelectItem value="harvester">Harvester</SelectItem>
                                  <SelectItem value="tiller">Tiller</SelectItem>
                                  <SelectItem value="pump">Pump</SelectItem>
                                  <SelectItem value="sprayer">Sprayer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium">Price per Day (₹) *</label>
                              <Input
                                type="number"
                                placeholder="2500"
                                value={editForm.pricePerDay}
                                onChange={(e) => handleEditFormChange('pricePerDay', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Price per Hour (₹) *</label>
                              <Input
                                type="number"
                                placeholder="350"
                                value={editForm.pricePerHour}
                                onChange={(e) => handleEditFormChange('pricePerHour', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Year</label>
                              <Input
                                type="number"
                                placeholder="2020"
                                value={editForm.year}
                                onChange={(e) => handleEditFormChange('year', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Specifications</label>
                              <Input
                                placeholder="e.g., 75 HP, Diesel, 4WD"
                                value={editForm.specifications}
                                onChange={(e) => handleEditFormChange('specifications', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Location</label>
                              <Input
                                placeholder="e.g., Pune, Maharashtra"
                                value={editForm.location}
                                onChange={(e) => handleEditFormChange('location', e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Features (comma separated)</label>
                            <Input
                              placeholder="e.g., GPS Enabled, Air Conditioning, PTO"
                              value={editForm.features}
                              onChange={(e) => handleEditFormChange('features', e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">{equipment.image}</div>
                            <div>
                              <h4 className="font-medium">{equipment.name}</h4>
                              <p className="text-sm text-muted-foreground">{equipment.pricePerDay}/day • {equipment.pricePerHour}/hour</p>
                              <p className="text-xs text-muted-foreground">Listed on: {equipment.listedAt}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(equipment)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEquipment(equipment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-card-shadow">
              <CardHeader>
                <CardTitle>Active Rentals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {myRentals.filter(rental => rental.status === "Active").map((rental, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg hover:bg-muted/50 hover:shadow-none transition-none">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{rental.equipment}</h4>
                      <Badge className="bg-success/10 text-success border-success/20 hover:bg-inherit hover:text-inherit hover:border-inherit transition-none">
                        {rental.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Renter</p>
                        <p className="font-medium text-foreground">{rental.renter}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Amount</p>
                        <p className="font-medium text-primary">{rental.amount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Start Date</p>
                        <p className="font-medium text-foreground">{rental.startDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">End Date</p>
                        <p className="font-medium text-foreground">{rental.endDate}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="outline">
                        <Phone className="mr-1 h-3 w-3" />
                        Contact
                      </Button>
                      <Button size="sm" variant="outline">
                        <Shield className="mr-1 h-3 w-3" />
                        Track
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleCancelRental(rental.id, rental.equipmentId)}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card-shadow">
              <CardHeader>
                <CardTitle>Rental History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {myRentals.filter(rental => rental.status === "Completed" || rental.status === "Cancelled").map((rental, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg hover:bg-muted/50 hover:shadow-none transition-none">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{rental.equipment}</h4>
                      <Badge
                        className={`${rental.status === "Cancelled"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : rental.status === "Completed"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-secondary text-secondary-foreground"
                          } hover:bg-inherit hover:text-inherit hover:border-inherit transition-none`}
                      >
                        {rental.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Renter</p>
                        <p className="font-medium text-foreground">{rental.renter}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Amount</p>
                        <p className="font-medium text-primary">{rental.amount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Duration</p>
                        <p className="font-medium text-foreground">{rental.startDate} to {rental.endDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs >

      {/* Customize Your Rental Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-white border-b shrink-0">
            <DialogTitle className="text-2xl font-bold">Customize Your Rental</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add services to your {selectedBookingEquipment?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto max-h-[60vh] p-6 space-y-6 bg-gray-50/50">
            {/* Equipment Summary Card */}
            <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center space-x-4">
              <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                {selectedBookingEquipment?.imageFile ? (
                  <img src={selectedBookingEquipment.imageFile} alt="" className="h-full w-full object-cover rounded-lg" />
                ) : (
                  selectedBookingEquipment?.image
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg">{selectedBookingEquipment?.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedBookingEquipment?.location}</p>
                <p className="text-success font-bold">{selectedBookingEquipment?.pricePerDay} / day</p>
              </div>
            </div>

            {/* Nearby Equipment Shops */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                <Truck className="h-4 w-4" />
                <span>Nearby Equipment Shops</span>
              </div>
              <p className="text-xs text-muted-foreground">Official partners and support providers for this model.</p>

              <div
                className={`bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${bookingOptions.selectedShop ? 'border-primary ring-1 ring-primary/20' : 'opacity-70'}`}
                onClick={() => setBookingOptions(prev => ({ ...prev, selectedShop: !prev.selectedShop }))}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">Ramesh Agriculture Services</span>
                    <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 border-blue-100">Verified</Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>1.5 km away</span>
                    <span>•</span>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-warning fill-current mr-0.5" />
                      4.9
                    </div>
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-100">
                    <Shield className="h-2.5 w-2.5 mr-1" />
                    Official Partner
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${bookingOptions.selectedShop ? 'border-primary bg-primary/10' : 'border-gray-300'}`}>
                    {bookingOptions.selectedShop && <div className="w-3 h-3 bg-primary rounded-full" />}
                  </div>
                  <span className="text-[10px] font-bold text-success">Free Support</span>
                </div>
              </div>
            </div>

            {/* Services Options */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Wrench className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Shop Service</p>
                    <p className="text-xs text-muted-foreground">Professional maintenance</p>
                  </div>
                </div>
                <Switch
                  checked={bookingOptions.includeShopService}
                  onCheckedChange={(checked) => setBookingOptions(prev => ({ ...prev, includeShopService: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Shield className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Repair Package</p>
                    <p className="text-xs text-muted-foreground">Comprehensive coverage</p>
                  </div>
                </div>
                <Switch
                  checked={bookingOptions.includeRepairPackage}
                  onCheckedChange={(checked) => setBookingOptions(prev => ({ ...prev, includeRepairPackage: checked }))}
                />
              </div>

              {selectedBookingEquipment?.operatorAvailable && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Settings className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Operator ({selectedBookingEquipment.operatorName})</p>
                      <p className="text-xs text-muted-foreground">Experienced driver</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold">₹{selectedBookingEquipment.operatorFee}/day</span>
                    <Switch
                      checked={bookingOptions.includeOperator}
                      onCheckedChange={(checked) => setBookingOptions(prev => ({ ...prev, includeOperator: checked }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="pt-6 border-t space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Equipment</span>
                <span>{selectedBookingEquipment?.pricePerDay}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shop Service</span>
                <span>₹{bookingOptions.includeShopService ? '200' : '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Repair Package</span>
                <span>₹{bookingOptions.includeRepairPackage ? '150' : '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Operator</span>
                <span>₹{bookingOptions.includeOperator ? (selectedBookingEquipment?.operatorFee || '0') : '0'}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-lg font-bold">Total / Day</span>
                <span className="text-2xl font-bold">
                  ₹{(
                    parseInt(selectedBookingEquipment?.pricePerDay.replace('₹', '').replace(',', '') || '0') +
                    (bookingOptions.includeShopService ? 200 : 0) +
                    (bookingOptions.includeRepairPackage ? 150 : 0) +
                    (bookingOptions.includeOperator ? parseInt(selectedBookingEquipment?.operatorFee || '0') : 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-white border-t flex sm:justify-between gap-4 shrink-0">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 h-12 rounded-xl bg-success hover:bg-success/90 text-white font-bold" onClick={handleConfirmBooking}>
              Confirm & Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentRental;