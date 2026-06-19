"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { category, ThreadDetails } from "@/types/threads";
import { useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const NewThreadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Titile is too short Minimum three charater required")
    .max(100, "Max char limit is 100"),
  body: z
    .string()
    .trim()
    .min(3, "Description is too short Minimum three charater required")
    .max(500, "Accept only 500 charaters"),
  categorySlug: z.string().trim().min(1, "Category is required"),
});

type NewThreadFormValue = z.infer<typeof NewThreadSchema>;

function NewThreadsPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [categories, setCategories] = useState<category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmiting] = useState(false);

  const form = useForm<NewThreadFormValue>({
    resolver: zodResolver(NewThreadSchema),
    defaultValues: {
      title: "",
      body: "",
      categorySlug: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);

      try {
        const extractCats = await apiGet<category[]>(
          apiClient,
          "/api/threads/categories",
        );

        if (!isMounted) return;

        setCategories(extractCats);
        if (extractCats.length > 0) {
          form.setValue("categorySlug", extractCats[0]?.slug);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [apiClient]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmitThread(values: NewThreadFormValue) {
    console.log("submit fired", values); // ← add this
    try {
      setIsSubmiting(true);

      const response = await apiClient.post("/api/threads/threads", {
        title: values.title,
        body: values.body,
        categorySlug: values.categorySlug,
      });

      const created = response?.data?.data as ThreadDetails;

      toast.success("New thread created successfully!", {
        description: "Your thread is now uploaded",
      });

      router.push("/");
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmiting(false);
    }
  }

  const titleValule = form.watch("title");
  const descriptionValue = form.watch("body");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col  gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Start a New Thread
        </h1>
      </div>

      <Card className="border-border/70 bg-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Threads Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmitThread)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-foreground"
                htmlFor="title"
              >
                Thread title
              </label>
              <Input
                id="title"
                placeholder="Thread Title..."
                {...form.register("title")}
                disabled={isLoading || isSubmitting}
                className=" border-border bg-background/70 text-sm mt-2"
              />
              <div>
                {form.formState.errors.title ? (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.title.message}
                  </p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-muted-foreground">
                  {titleValule?.length}/100
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-foreground"
                htmlFor="categorySlug"
              >
                Category
              </label>
              <select
                id="categorySlug"
                {...form.register("categorySlug")}
                disabled={isLoading || isSubmitting}
                className="h-10 mt-2 w-full rounded-md border border-border bg-background/70 px-3 text-sm text-foreground focus:outline focus:ring-2 focus:ring-primary/30"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-foreground"
                htmlFor="title"
              >
                Description
              </label>
              <Textarea
                id="body"
                rows={8}
                placeholder="Thread description...."
                {...form.register("body")}
                disabled={isLoading || isSubmitting}
                className="mt-2 border-border bg-background/70 text-sm"
              />
              <div>
                {form.formState.errors.body ? (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.body?.message}
                  </p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-muted-foreground">
                  {descriptionValue?.length}/500
                </p>
              </div>
            </div>

            <CardFooter className="flex justify-end border-t border-0 px-0 pt-5">
              <Button
                type="submit"
                size={"lg"}
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Submiting..." : "Sumbmit"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewThreadsPage;
