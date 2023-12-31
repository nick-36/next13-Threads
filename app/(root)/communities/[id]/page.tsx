import React from "react";
import { currentUser } from "@clerk/nextjs";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { communityTabs, profileTabs } from "@/constants";
import ThreadsTabContent from "@/components/shared/ThreadTabContent";
import { fetchCommunityDetails } from "@/lib/actions/community.actions";
import UserCard from "@/components/cards/UserCard";

const Page = async ({ params: { id } }: { params: { id: string } }) => {
  const user = await currentUser();

  if (!user) return null;

  const communityInfo = await fetchCommunityDetails(id);

  return (
    <section>
      <ProfileHeader
        accountId={communityInfo.id}
        authUserId={user.id}
        name={communityInfo.name}
        imgUrl={communityInfo.image}
        bio={communityInfo.bio}
        username={communityInfo.username}
        type="Community"
      />
      <div className="mt-9">
        <Tabs defaultValue="threads" className="w-full">
          <TabsList className="tab">
            {communityTabs.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.value} className="tab">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="threads" className="w-full text-light-1">
            <ThreadsTabContent
              currentUserId={user.id}
              accountId={communityInfo._id}
              accountType="Community"
            />
          </TabsContent>
          <TabsContent value="members" className="mt-9 w-full text-light-1">
            <section className="mt-9 flex flex-col gap-10">
              {communityInfo.members.map((member: any) => (
                <UserCard
                  key={member.id}
                  id={member.id}
                  name={member.name}
                  username={member.username}
                  imgUrl={member.image}
                  personType="User"
                />
              ))}
            </section>
          </TabsContent>
          <TabsContent value="requests" className="w-full text-light-1">
            <ThreadsTabContent
              currentUserId={user.id}
              accountId={communityInfo._id}
              accountType="Community"
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default Page;
