import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input as ShadInput } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [twoFA, setTwoFA] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  const initials = (username || "").split(" ").map(s => s[0]).join("").slice(0,2).toUpperCase() || "U";

  const completion = [username, email, phone, location, gender, dob].filter(Boolean).length;

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateUser({ username, email });
    toast({ title: "Profile updated", description: "Your changes have been saved." });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-green-600 to-emerald-500" />
        <CardContent className="-mt-10">
          <div className="flex items-end gap-4">
            <label className="relative cursor-pointer">
              {avatar ? (
                <img src={avatar} className="h-20 w-20 rounded-full ring-4 ring-white object-cover" />
              ) : (
                <Avatar className="h-20 w-20 ring-4 ring-white">
                  <AvatarFallback className="bg-green-600 text-white text-xl">{initials}</AvatarFallback>
                </Avatar>
              )}
              <input type="file" accept="image/*" onChange={handleAvatar} className="absolute inset-0 opacity-0" />
            </label>
            <div className="mb-2">
              <h2 className="text-2xl font-semibold">{username || "Your Name"}</h2>
              <p className="text-sm text-muted-foreground">Farmer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Progress value={(completion / 6) * 100} />
            <p className="text-xs text-muted-foreground mt-1">Profile completion</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 86396 68662" />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
            </div>
            <div>
              <label className="text-sm font-medium">Gender</label>
              <Input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Male/Female/Other" />
            </div>
            <div>
              <label className="text-sm font-medium">Date of Birth</label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Button variant="secondary">Change Password</Button>
              <Button variant="outline" onClick={() => setTwoFA(v => !v)}>{twoFA ? "Disable" : "Enable"} 2FA</Button>
            </div>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;


