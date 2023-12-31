"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import Community from "../models/community.model";

export const fetchAllThreads = async (
  pageNumber: number = 1,
  pageSize: number = 20
) => {
  try {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;

    const threadQuery = Thread.find({
      parentId: { $in: [null, undefined] },
    })
      .sort({ createdAt: -1 })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({
        path: "author",
        model: "User",
      })
      .populate({
        path: "community",
        model: Community,
      })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: "User",
            select: "_id name parentId image",
          },
        ],
      });

    // Count the total number of top-level posts (threads) i.e., threads that are not comments.
    const totalThreadsCount = await Thread.countDocuments({
      parentId: { $in: [null, undefined] },
    });

    const threads = await threadQuery.exec();

    const isNext = totalThreadsCount > skipAmount + threads.length;

    return { threads, isNext };
  } catch (error: any) {
    throw new Error(`Failed To Fetch Threads ${error.message}`);
  }
};

interface Params {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export async function createThread({
  text,
  author,
  communityId,
  path,
}: Params) {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdThread = await Thread.create({
      text,
      author,
      community: communityIdObject,
    });

    // Update User model
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { threads: createdThread._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to create thread: ${error.message}`);
  }
}

export const fetchThreadById = async (id: string) => {
  connectToDB();
  try {
    const fetchQuery = Thread.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name parentId image",
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      });
    const thread = await fetchQuery.exec();
    return thread;
  } catch (error: any) {
    throw new Error(`Failed To Fetch Thread ${error.message}`);
  }
};

export const addCommentToThread = async ({
  threadId,
  text,
  author,
  community,
  path,
}: {
  threadId: string;
  text: string;
  author: string;
  community: string | null;
  path: string;
}) => {
  connectToDB();

  try {
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Thread Not Found");
    }

    const createThread = new Thread({
      text,
      author,
      parentId: threadId,
      community: community,
    });

    await createThread.save();

    originalThread.children.push(createThread._id);

    await originalThread.save();

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed To Create Comment ${error?.message}`);
  }
};
