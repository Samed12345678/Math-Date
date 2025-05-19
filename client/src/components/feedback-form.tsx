import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define the form schema
const feedbackSchema = z.object({
  matchQualityRating: z.string().min(1, "Please rate the match quality"),
  algorithmFairnessRating: z.string().min(1, "Please rate the algorithm fairness"),
  generalSatisfaction: z.string().min(1, "Please rate your overall satisfaction"),
  feedbackText: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export default function FeedbackForm() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      matchQualityRating: "",
      algorithmFairnessRating: "",
      generalSatisfaction: "",
      feedbackText: "",
    },
  });

  async function onSubmit(values: FeedbackFormValues) {
    setIsSubmitting(true);
    try {
      // Convert string ratings to numbers for the API
      const data = {
        matchQualityRating: parseInt(values.matchQualityRating),
        algorithmFairnessRating: parseInt(values.algorithmFairnessRating),
        generalSatisfaction: parseInt(values.generalSatisfaction),
        feedbackText: values.feedbackText,
      };

      await apiRequest("POST", "/api/analytics/feedback", data);
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      
      // Reset form and close dialog
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your feedback.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Share Feedback</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Help us improve your dating experience by sharing your thoughts about the match quality and algorithm.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="matchQualityRating"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>How would you rate the quality of your matches?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-1 space-y-0"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <div key={value} className="flex flex-col items-center space-y-1">
                          <RadioGroupItem value={value.toString()} id={`match-${value}`} />
                          <Label htmlFor={`match-${value}`} className="text-sm">{value}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription className="flex justify-between text-xs -mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="algorithmFairnessRating"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>How fair do you think the matching algorithm is?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-1 space-y-0"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <div key={value} className="flex flex-col items-center space-y-1">
                          <RadioGroupItem value={value.toString()} id={`fair-${value}`} />
                          <Label htmlFor={`fair-${value}`} className="text-sm">{value}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription className="flex justify-between text-xs -mt-1">
                    <span>Not fair</span>
                    <span>Very fair</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="generalSatisfaction"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Overall, how satisfied are you with the app?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-1 space-y-0"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <div key={value} className="flex flex-col items-center space-y-1">
                          <RadioGroupItem value={value.toString()} id={`sat-${value}`} />
                          <Label htmlFor={`sat-${value}`} className="text-sm">{value}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription className="flex justify-between text-xs -mt-1">
                    <span>Unsatisfied</span>
                    <span>Very satisfied</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedbackText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional comments (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share any additional thoughts about your experience..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}