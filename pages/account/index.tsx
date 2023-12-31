import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import Header from "../../components/Head/Header";
import AccountSection from "../../components/Account/AccountSection";
import Navbar from "../../components/Navbar/Navbar";
import { getToken } from "next-auth/jwt";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);
  // const { routeName } = context.params;
  if (!session) {
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
    };
  }
  const token = await getToken({ req, secret: process.env.NEXT_PUBLIC_SECRET! });
  const user = await prisma.user.findUnique({
    where: {
      email: session.user?.email!,
    },
    select: {
      username: true,
      name: true,
      email: true,
      image: true,
    },
  });
  return { props: { user } };
};
export default function account({ user }: any) {
  return (
    <>
      <Header title="Account" />
      <AccountSection user={user} />
      <Navbar user={user} />
    </>
  );
}
