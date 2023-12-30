"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import Thread from "../models/thread.model";

import { connectToDB } from "../mongoose";
import { FilterQuery, SortOrder } from "mongoose";
import Community from "../models/community.model";

interface Params {
  userId: string | undefined;
  name: string;
  username: string;
  bio: string;
  image: string;
  path: string;
}

export const updateUser = async ({
  userId,
  name,
  username,
  bio,
  image,
  path,
}: Params): Promise<void> => {
  connectToDB();
  try {
    await User.findOneAndUpdate(
      { id: userId },
      { name, username, bio, image, onboarded: true },
      { upsert: true }
    );
    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed To Create/Update User ${error.message}`);
  }
};

export const fetchUser = async (userId: string) => {
  try {
    connectToDB();
    return await User.findOne({ id: userId }).populate({
      path: "communities",
      model: Community,
    });
  } catch (error: any) {
    throw new Error(`Failed To Fetch User ${error.message}`);
  }
};

export const fetchUserThreads = async (userId: string) => {
  connectToDB();
  try {
    const fetchQuery = User.findOne({ id: userId }).populate({
      path: "threads",
      model: Thread,
      populate: [
        {
          path: "community",
          model: Community,
          select: "name id image _id", // Select the "name" and "_id" fields from the "Community" model
        },
        {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "name image id", // Select the "name" and "_id" fields from the "User" model
          },
        },
      ],
    });
    const threads = await fetchQuery.exec();
    return threads;
  } catch (error: any) {
    throw new Error(`Failed To Fetch Thread ${error.message}`);
  }
};

export const fetchUsers = async ({
  pageNumber = 1,
  pageSize = 20,
  searchString = "",
  userId,
  sortBy = "desc",
}: {
  pageNumber?: number;
  pageSize?: number;
  searchString: string;
  userId: string;
  sortBy?: SortOrder;
}) => {
  connectToDB();
  try {
    const skipAmount = (pageNumber - 1) * pageSize;
    const regex = new RegExp(searchString, "i");

    const query: FilterQuery<typeof User> = {
      id: { $ne: userId },
    };

    if (searchString.trim().length !== 0) {
      query.$or = [{ name: regex }, { username: regex }];
    }

    const sortOptions = {
      createdAt: sortBy,
    };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    const totalCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    const isNext = totalCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error: any) {
    throw new Error(`Failed To Fetch Users ${error.message}`);
  }
};

export const getActivity = async (userId: string) => {
  connectToDB();
  try {
    //Fetch all threads created by the user
    const userThreads = await Thread.find({
      author: userId,
    });
    // Collect all child thread ids(replies) from the 'children' fields
    const childThreadsIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children);
    }, []);

    const replies = await Thread.find({
      _id: { $in: childThreadsIds },
      author: { $ne: userId },
    }).populate({
      path: "author",
      model: User,
      select: "name image _id",
    });

    return replies;
  } catch (error: any) {
    throw new Error(`Failed To Fetch Activity ${error.message}`);
  }
};
