import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Users, Clock, FileText } from "lucide-react";
import { itineraryInputSchema, type ItineraryInput } from "@shared/schema";

interface ItineraryInputFormProps {
  onSubmit: (data: ItineraryInput) => void;
  isLoading?: boolean;
}

export default function ItineraryInputForm({ onSubmit, isLoading = false }: ItineraryInputFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ItineraryInput>({
    resolver: zodResolver(itineraryInputSchema),
    defaultValues: {
      num_days: 7,
      num_people: 2,
      start_date: "",
      itinerary_text: "",
    },
  });

  const watchedText = watch("itinerary_text");
  const textLength = watchedText?.length || 0;

  const handleFormSubmit = (data: ItineraryInput) => {
    console.log("Processing itinerary:", data);
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Itinerary Input
        </CardTitle>
        <CardDescription>
          Enter your Egypt itinerary details to generate operational breakdown and pricing quotation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="num_days" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Number of Days
              </Label>
              <Input
                id="num_days"
                type="number"
                min="1"
                max="30"
                {...register("num_days", { valueAsNumber: true })}
                data-testid="input-num-days"
                className={errors.num_days ? "border-destructive" : ""}
              />
              {errors.num_days && (
                <p className="text-sm text-destructive">{errors.num_days.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="num_people" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of People
              </Label>
              <Input
                id="num_people"
                type="number"
                min="1"
                max="100"
                {...register("num_people", { valueAsNumber: true })}
                data-testid="input-num-people"
                className={errors.num_people ? "border-destructive" : ""}
              />
              {errors.num_people && (
                <p className="text-sm text-destructive">{errors.num_people.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date (Optional)
              </Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
                data-testid="input-start-date"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itinerary_text" className="text-base font-medium">
              Itinerary Text
            </Label>
            <p className="text-sm text-muted-foreground">
              Enter your day-by-day itinerary. Use headings like "Day 1", "Day 2", etc.
            </p>
            <Textarea
              id="itinerary_text"
              placeholder={`Day 1 — Arrival in Cairo
Arrive at Cairo International Airport. Meet & assist service. Transfer to hotel. Check-in. Evening at leisure.

Day 2 — Cairo City Tour
Breakfast at hotel. Visit the Great Pyramids of Giza and Sphinx. Lunch at local restaurant. Visit Egyptian Museum. Return to hotel.

Day 3 — Fly to Luxor
Breakfast and check-out. Transfer to Cairo Airport for domestic flight to Luxor. Meet & assist in Luxor. Transfer to hotel and check-in...`}
              className="min-h-[300px] resize-none"
              {...register("itinerary_text")}
              data-testid="textarea-itinerary"
            />
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{textLength} characters</span>
              {errors.itinerary_text && (
                <span className="text-destructive">{errors.itinerary_text.message}</span>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              data-testid="button-process-itinerary"
              className="px-8"
            >
              {isLoading ? "Processing..." : "Process Itinerary"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}