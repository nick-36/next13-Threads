"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import Community from "../models/community.model";
import { SortOrder, FilterQuery } from "mongoose";

interface Params {
  id: string | number | Record<string, string>[];
  createdById: string | number | Record<string, string>[];
  name: string | number | Record<string, string>[];
  image: string | number | Record<string, string>[];
  bio: string;
}

export async function createCommunity({
  id,
  name,
  image,
  bio,
  createdById,
}: Params) {
  try {
    connectToDB();

    // Find the user with the provided unique id
    const user = await User.findOne({ id: createdById });

    if (!user) {
      throw new Error("User not found"); // Handle the case if the user with the id is not found
    }

    const newCommunity = new Community({
      id,
      name,
      username,
      image,
      bio,
      createdBy: user._id, // Use the mongoose ID of the user
    });

    const createdCommunity = await newCommunity.save();

    // Update User model
    user.communities.push(createdCommunity._id);
    await user.save();

    return createdCommunity;
  } catch (error) {
    // Handle any errors
    console.error("Error creating community:", error);
    throw error;
  }
}

export async function fetchCommunityDetails(id: string) {
  try {
    connectToDB();

    const communityDetails = await Community.findById(id).populate([
      "createdBy",
      {
        path: "members",
        model: User,
        select: "name username image _id id",
      },
    ]);
    return communityDetails;
  } catch (error) {
    // Handle any errors
    console.error("Error fetching community details:", error);
    throw error;
  }
}

export async function fetchCommunityPosts(id: string) {
  try {
    connectToDB();

    const communityPosts = await Community.findById(id).populate({
      path: "threads",
      model: Thread,
      populate: [
        {
          path: "author",
          model: User,
          select: "name image id",
        },
        {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "image _id",
          },
        },
      ],
    });

    return communityPosts;
  } catch (error) {
    // Handle any errors
    console.error("Error fetching community posts:", error);
    throw error;
  }
}

export const fetchCommunities = async ({
  searchString = "",
  pageNumber = 1,
  pageSize = 10,
  sortBy = -1,
}: {
  searchString?: string;
  pageSize: number;
  pageNumber: number;
  sortBy?: SortOrder;
}) => {
  connectToDB();

  try {
    const skipAmount = (pageNumber - 1) * pageSize;

    const regex = new RegExp(searchString, "i");

    const query: FilterQuery<typeof Community> = {};

    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    const sortOptions = { createdAt: sortBy };

    const communitiesQuery = Community.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)
      .populate("members");

    // Count the total number of communities that match the search criteria (without pagination).
    const totalCommunitiesCount = await Community.countDocuments(query);

    const communities = await communitiesQuery.exec();

    // Check if there are more communities beyond the current page.
    const isNext = totalCommunitiesCount > skipAmount + communities.length;

    return { communities, isNext };
  } catch (error: any) {
    throw new Error(`Failed to fetch communities ${error.message}`);
  }
};

export const addMemberToCommunity = async ({
  memberId,
  communityId,
}: {
  memberId: string;
  communityId: string;
}) => {
  try {
    const community = await Community.findOne({ id: communityId });

    if (!community) {
      throw new Error("community not found");
    }
    const user = await User.findOne({ id: memberId });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if the user is already a member of the community
    if (community.members.includes(user._id)) {
      throw new Error("User is already a member of the community");
    }

    await community.save();

    user.communities.push(community._id);

    await user.save();

    return community;
  } catch (error: any) {
    throw new Error(`Failed to add member to community ${error.message}`);
  }
};

export const removeUserFromCommunity = async ({
  memberId,
  communityId,
}: {
  memberId: string;
  communityId: string;
}) => {
  try {
    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );
    if (!communityIdObject) {
      throw new Error("community not found");
    }
    const userIdObject = await User.findOne({ id: memberId }, { _id: 1 });

    if (!userIdObject) {
      throw new Error("User doesn't exist!");
    }

    // Remove the user's _id from the members array in the community
    await Community.updateOne(
      { _id: communityIdObject._id },
      { $pull: { members: userIdObject._id } }
    );

    // Remove the community's _id from the communities array in the user
    await User.updateOne(
      { _id: userIdObject._id },
      { $pull: { communities: communityIdObject._id } }
    );

    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to remove user from community ${error.message}`);
  }
};

export async function updateCommunityInfo(
  communityId: string,
  name: string,
  username: string,
  image: string
) {
  try {
    connectToDB();

    // Find the community by its _id and update the information
    const updatedCommunity = await Community.findOneAndUpdate(
      { id: communityId },
      { name, username, image }
    );

    if (!updatedCommunity) {
      throw new Error("Community not found");
    }

    return updatedCommunity;
  } catch (error) {
    // Handle any errors
    console.error("Error updating community information:", error);
    throw error;
  }
}

export async function deleteCommunity(communityId: string) {
  try {
    connectToDB();

    const deletedCommunity = await Community.findByIdAndDelete(communityId);

    if (!deletedCommunity) {
      throw new Error("Community not found");
    }

    // Delete all threads associated with the community
    await Thread.deleteMany({ community: communityId });

    // Find all users who are part of the community
    const communityUsers = await User.find({ communities: communityId });

    // Remove the community from the 'communities' array for each user
    const updateUserPromises = communityUsers.map((user) => {
      user.communities.pull(communityId);
      return user.save();
    });

    await Promise.all(updateUserPromises);

    return deletedCommunity;
  } catch (error) {
    // Handle any errors
    console.error("Error deleting community:", error);
    throw error;
  }
}
