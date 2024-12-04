"use client";

import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Loader2,
  Home,
  Paintbrush,
  Building2,
  Lightbulb,
  Sofa,
} from "lucide-react";
import { toast } from "react-toastify";

interface ContactFormProps {
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  service: string;
  message: string;
  roomDimensions?: {
    length: string;
    width: string;
    height: string;
  };
  numberOfRooms?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    location: "",
    service: "",
    message: "",
    roomDimensions: {
      length: "",
      width: "",
      height: "",
    },
    numberOfRooms: "",
  });
  const [loading, setLoading] = useState(false);

  const services = [
    { value: "home-theater", label: "Home Theater", icon: Home },
    { value: "interior-work", label: "Interior Work", icon: Paintbrush },
    { value: "elevation-work", label: "Elevation Work", icon: Building2 },
    { value: "electrical-work", label: "Electrical Work", icon: Lightbulb },
    { value: "furniture-work", label: "Furniture Work", icon: Sofa },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("roomDimensions.")) {
      const dimension = name.split(".")[1];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      setFormData((prev) => ({
        ...prev,
        roomDimensions: {
          ...prev.roomDimensions,
          [dimension]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleServiceChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      service: value,
      // Reset conditional fields when service changes
      roomDimensions: {
        length: "",
        width: "",
        height: "",
      },
      numberOfRooms: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit: any = {
        ...formData,
        createdAt: Timestamp.now(),
      };

      // Only include room dimensions if all fields are filled
      if (
        formData.service === "home-theater" &&
        Object.values(formData.roomDimensions || {}).some((v) => v !== "")
      ) {
        dataToSubmit.roomDimensions = formData.roomDimensions;
      } else {
        delete dataToSubmit.roomDimensions;
      }

      await addDoc(collection(db, "contact"), dataToSubmit);
      toast.success("Message sent successfully!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        location: "",
        service: "",
        message: "",
        roomDimensions: {
          length: "",
          width: "",
          height: "",
        },
        numberOfRooms: "",
      });
      onClose();
    } catch (err: unknown) {
      console.error("Failed to submit the form. Please try again.", err);
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-y-scroll">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-3xl font-bold">Get in Touch</CardTitle>
        <CardDescription>
          Fill out the form below and we&#39;ll get back to you as soon as
          possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="(555) 000-0000"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Your Location
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="City, State"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service" className="text-sm font-medium">
              Service Required
            </Label>
            <Select
              value={formData.service}
              onValueChange={handleServiceChange}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.service === "home-theater" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Room Dimensions (in feet)
                </Label>
                <span className="text-sm text-muted-foreground">
                  (Optional)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="length"
                    className="text-xs text-muted-foreground"
                  >
                    Length
                  </Label>
                  <Input
                    id="length"
                    name="roomDimensions.length"
                    type="number"
                    value={formData.roomDimensions?.length}
                    onChange={handleChange}
                    placeholder="Length"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="width"
                    className="text-xs text-muted-foreground"
                  >
                    Width
                  </Label>
                  <Input
                    id="width"
                    name="roomDimensions.width"
                    type="number"
                    value={formData.roomDimensions?.width}
                    onChange={handleChange}
                    placeholder="Width"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="height"
                    className="text-xs text-muted-foreground"
                  >
                    Height
                  </Label>
                  <Input
                    id="height"
                    name="roomDimensions.height"
                    type="number"
                    value={formData.roomDimensions?.height}
                    onChange={handleChange}
                    placeholder="Height"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.service === "interior-work" && (
            <div className="space-y-2">
              <Label htmlFor="numberOfRooms" className="text-sm font-medium">
                Number of Rooms
              </Label>
              <Input
                id="numberOfRooms"
                name="numberOfRooms"
                type="number"
                value={formData.numberOfRooms}
                onChange={handleChange}
                required
                placeholder="Enter number of rooms"
                min="1"
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Project Details
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder="Please describe your project requirements..."
              className="min-h-[120px] resize-y"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-24"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-24">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
