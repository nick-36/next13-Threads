import { fetchAllThreads } from "@/lib/actions/thread.actions";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs";
import ThreadCard from "@/components/cards/ThreadCard";
export default async function Home() {
  const user = await currentUser();

  if (!user) return console.log("No User Found!");

  const result = await fetchAllThreads(1, 20);
  return (
    <>
      <h1 className="head-text text-left">Home</h1>
      <section className="mt-9 flex flex-col gap-10">
        {result.threads.length === 0 ? (
          <p className="no-result">No threads found</p>
        ) : (
          <>
            {result.threads.map((post) => (
              <ThreadCard
                key={post._id}
                id={post._id}
                currentUserId={user.id}
                parentId={post.parentId}
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children}
              />
            ))}
          </>
        )}
      </section>

      {/* <Pagination
      path='/'
      pageNumber={searchParams?.page ? +searchParams.page : 1}
      isNext={result.isNext}
    /> */}
    </>
  );
}
