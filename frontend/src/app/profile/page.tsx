"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
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
import { apiGet, apiPatch, createBrowserApiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Show, useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const optionalText = (min: number, max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .transform((value) => (value === "" ? undefined : value))
    .optional()
    .refine(
      (value) =>
        value === undefined || (value.length >= min && value.length <= max),
      {
        message: `Must be between ${min} and ${max} charaters`,
      },
    );

const ProfileSchema = z.object({
  displayName: optionalText(3, 50),
  handle: optionalText(3, 60),
  bio: optionalText(3, 100),
  avatarUrl: optionalText(0, 600),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

type UserResponse = {
  id: number;
  clerkUserId: string;
  displayName: string | null;
  email: string | null;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

function ProfilePage() {
  const { getToken } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const form = useForm({
    resolver: zodResolver(ProfileSchema),
    mode: "onChange",
    defaultValues: {
      displayName: "",
      handle: "",
      bio: "",
      avatarUrl: "",
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    try {
      setIsSaving(true);

      const payload: Record<string, string> = {};

      if (values.displayName) payload.displayName = values.displayName;
      if (values.handle) payload.handle = values.handle.toLowerCase();
      if (values.bio) payload.bio = values.bio;
      if (values.avatarUrl) payload.avatarUrl = values.avatarUrl;

      const apiResponse = await apiPatch<typeof payload, UserResponse>(
        apiClient,
        "/api/me",
        payload,
      );

      form.reset({
        displayName: apiResponse.displayName ?? "",
        handle: apiResponse.handle ?? "",
        bio: apiResponse.bio ?? "",
        avatarUrl: apiResponse.avatarUrl ?? "",
      });

      toast.success("Profile updated successfully", {
        description: "Your changes have been saved successfully",
      });
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        setIsLoading(true);

        const getUserInfo = await apiGet<UserResponse>(apiClient, "/api/me");

        if (!isMounted) {
          return;
        }

        console.log(getUserInfo, "getuserinfo");

        form.reset({
          displayName: getUserInfo.displayName ?? "",
          handle: getUserInfo.handle ?? "",
          bio: getUserInfo.bio ?? "",
          avatarUrl: getUserInfo.avatarUrl ?? "",
        });
      } catch (error: any) {
        console.error(error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();
  }, [apiClient, form]);

  const displayNameValue = form.watch("displayName");
  const HandleValue = form.watch("handle");
  const avatarUrlValue = form.watch("avatarUrl");
  const bioValue = form.watch("bio");
  return (
    <>
      <Show when={"signed-out"}>user signout</Show>
      <Show when={"signed-in"}>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
          <div>
            <h1 className="text-4xl flex items-center font-bold tracking-tight text-foreground">
              <User className="w-11 h-11 text-primary mr-3" />
              Profile Settings
            </h1>
            <p className="text-md mt-1 ml-14 text-muted-foreground">
              Mange your pofile Information and Avatar image.
            </p>
          </div>
          <Card className="border-border/70 bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-6">
                <Avatar className=" h-20 w-20">
                  {avatarUrlValue && (
                    <AvatarImage
                      src={avatarUrlValue || "/placeholder.xyz"}
                      alt={displayNameValue || ""}
                    />
                  )}
                </Avatar>

                <div className=" flex-1">
                  <CardTitle className="text-3xl  text-foreground">
                    {displayNameValue || "Your Name!"}
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-medium",
                        HandleValue
                          ? "bg-primary/10 text-primary"
                          : "bg-accent text-accent-foreground",
                      )}
                    >
                      {HandleValue ? `@${HandleValue}` : "@handle"}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold text-foreground"
                      htmlFor=""
                    >
                      Display Name
                    </label>
                    <Input
                      id="displayName"
                      placeholder="Enter new Name"
                      {...form.register("displayName")}
                      disabled={isLoading || isSaving}
                      className="border-border mt-2 bg-background/60 text-sm"
                    />
                    <div>
                      {form.formState.errors.displayName ? (
                        <p className="text-xs text-red-600 mt-1 ">
                          {form.formState.errors.displayName.message}
                        </p>
                      ) : (
                        <span />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {displayNameValue?.length}/50
                      </p>
                    </div>
                  </div>

                  {/* ---------------------------------------------- */}

                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold text-foreground"
                      htmlFor=""
                    >
                      Handle
                    </label>
                    <Input
                      id="handle"
                      placeholder="Enter new Handle"
                      {...form.register("handle")}
                      disabled={isLoading || isSaving}
                      className="border-border mt-2 bg-background/60 text-sm"
                    />
                    <div>
                      {form.formState.errors.handle ? (
                        <p className="text-xs text-red-600 mt-1 ">
                          {form.formState.errors.handle.message}
                        </p>
                      ) : (
                        <span />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {HandleValue?.length}/60
                      </p>
                    </div>
                  </div>

                  {/* ------------------------------------------------ */}

                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold text-foreground"
                      htmlFor=""
                    >
                      Bio
                    </label>
                    <Textarea
                      id="bio"
                      placeholder="tell about yourself"
                      rows={4}
                      {...form.register("bio")}
                      disabled={isLoading || isSaving}
                      className="border-border mt-2 bg-background/60 text-sm"
                    />
                    <div>
                      {form.formState.errors.handle ? (
                        <p className="text-xs text-red-600 mt-1 ">
                          {form.formState.errors.handle.message}
                        </p>
                      ) : (
                        <span />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {bioValue?.length}/100
                      </p>
                    </div>
                  </div>
                </div>

                {/* --------------------------------------------------- */}

                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-foreground"
                    htmlFor=""
                  >
                    Image Url
                  </label>
                  <Input
                    id="avatarUrl"
                    placeholder="Enter new Url"
                    {...form.register("avatarUrl")}
                    disabled={isLoading || isSaving}
                    className="border-border mt-2 bg-background/60 text-sm"
                  />
                  <div>
                    {form.formState.errors.avatarUrl ? (
                      <p className="text-xs text-red-600 mt-1 ">
                        {form.formState.errors.avatarUrl.message}
                      </p>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
                {/*  */}

                <CardFooter className="p-0">
                  <Button
                    type="submit"
                    disabled={isLoading || isSaving}
                    className="min-w-37 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <SaveIcon className="w-4 h-4 mr-2" />
                    {isSaving ? "...Saving" : "Save Chagnes"}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </Show>
    </>
  );
}

export default ProfilePage;
