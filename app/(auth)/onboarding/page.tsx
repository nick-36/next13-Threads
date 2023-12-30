import AccountProfile from "@/components/forms/AccountProfile";
import { currentUser } from "@clerk/nextjs";
async function Page() {
  const user = await currentUser();

  const userInfo = {} as any;

  const userData = {
    id: user?.id,
    objectId: userInfo?._id,
    name: userInfo?.name || user?.firstName,
    username: userInfo?.username || user?.username || "",
    bio: userInfo?.bio,
    image: userInfo?.image || user?.imageUrl,
  };
  return (
    <main className="mx-auto flex flex-col justify-start max-w-3xl px-10 py-20 ">
      <h1 className="head-text">Onboarding</h1>
      <p className="mt-3 text-base-regular text-light-2">
        Complete Your Profile Now
      </p>
      <section className="mt-9 bg-dark-2 p-10">
        <AccountProfile user={userData} btnTitle={"Continue"} />
      </section>
    </main>
  );
}

export default Page;
