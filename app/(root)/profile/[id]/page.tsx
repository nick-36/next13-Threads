import React from "react";
import { currentUser } from "@clerk/nextjs";
import { fetchUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { profileTabs } from "@/constants";
import ThreadsTabContent from "@/components/shared/ThreadTabContent";

const Page = async ({ params: { id } }: { params: { id: string } }) => {
  if (!id) return null;
  const user = await currentUser();

  if (!user) return null;

  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <section>
      <ProfileHeader
        accountId={userInfo.id}
        authUserId={user.id}
        name={userInfo.name}
        imgUrl={userInfo.image}
        bio={userInfo.bio}
        username={userInfo.username}
        type="User"
      />
      <div className="mt-9">
        <Tabs defaultValue="threads" className="w-full">
          <TabsList className="tab">
            {profileTabs.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.value} className="tab">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="threads">
            <ThreadsTabContent
              accountType="User"
              currentUserId={user.id}
              accountId={userInfo.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default Page;
