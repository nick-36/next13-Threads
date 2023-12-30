"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CommentValidation } from "@/lib/Validation/threadValidation";
import * as z from "zod";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { addCommentToThread } from "@/lib/actions/thread.actions";

interface CommentProps {
  threadId: string;
  currentUserImg: string;
  currentUserId: string;
}
const Comment = ({ threadId, currentUserImg, currentUserId }: CommentProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const form = useForm({
    resolver: zodResolver(CommentValidation),
    defaultValues: {
      thread: "",
    },
  });
  async function onSubmit(values: z.infer<typeof CommentValidation>) {
    try {
      await addCommentToThread({
        threadId,
        text: values.thread,
        author: currentUserId,
        community: null,
        path: pathname,
      });
    } catch (error) {
      console.log(error);
    }
    router.push("/");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="comment-form px-6"
      >
        <FormField
          control={form.control}
          name="thread"
          render={({ field }) => (
            <FormItem className="flex w-full items-center gap-3">
              <FormLabel className="text-base-semibold text-light-2">
                <div className="relative h-11 w-11">
                  <Image
                    layout="fill"
                    src={currentUserImg}
                    alt="profiel image"
                    objectFit="cover"
                    className="rounded-full"
                  />
                </div>
              </FormLabel>
              <div className="flex flex-col">
                <FormControl className="border-none bg-transparent">
                  <Input
                    type="text"
                    {...field}
                    placeholder="Comment..."
                    className="no-focus text-light-1 outline-none"
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="comment-form_btn">
          Reply
        </Button>
      </form>
    </Form>
  );
};

export default Comment;
