import { FormEvent, useEffect, useState } from "react";
import Header from "../components/Head/Header";
import Navbar from "../components/Navbar/Navbar";
import RestaurantRow from "../components/MainPage/RestaurantRow";
import SearchBar from "../components/SearchBar";
import Topbar from "../components/Topbar";
import { prisma } from "../lib/prisma";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";
import Image from "next/image";
import MainPageSearch from "../components/Search/MainPageSearch";
import { getMultipleRandom } from "../lib/logic";
// import { Restaurant } from "@prisma/client";
import { firestore } from "../lib/firebase";
import Jumbotron from "../components/MainPage/Jumbotron";
import CategoryList from "../components/MainPage/CategoryList";
import { RestaurantV2 } from "@prisma/client";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { captureEvent } from "../lib/posthog";
import useDebounce from "../lib/useDebounce";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);
  // console.log(session);

  const countResto = await prisma.restaurantV2.count();
  const skipResto = Math.floor(Math.random() * countResto);
  const skipCategory = Math.floor(Math.random() * 11) + 1;
  const restoran = await prisma.restaurantV2.findMany({
    select: {
      gofood_name: true,
      address_components: true,
      rating: true,
      user_ratings_total: true,
      categories: true,
      price_level: true,
      thumbnail: true,
      opening_hours: true,
      place_id: true,
    },
    take: 10,
    skip: skipResto,
  });

  const category = await prisma.category.findMany({
    take: 8,
    skip: skipCategory,
  });

  const shuffledCategory = category.sort(() => 0.5 - Math.random());

  return { props: { restaurant: JSON.parse(JSON.stringify(restoran)), categories: shuffledCategory, user: session || null, restoran } };
};

export default function Home({ restaurant, categories, user, restoran }: any) {
  const [search, setSearch] = useState<string>("");
  const [searchData, setSearchData] = useState<RestaurantV2[] | any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const session = useSession();
  const debouncedSearch = useDebounce(search, 500);

  if (session) {
    posthog.identify(session.data?.user?.email!);
  }

  function getValueForToday(json: any) {
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    const today = new Date().toLocaleString("en-US", { weekday: "long" }).toLowerCase();

    if (daysOfWeek.includes(today)) {
      return json[today];
    } else {
      return null; // Return null if today is not a valid day of the week in the JSON object
    }
  }

  useEffect(() => {
    setIsLoading(true);
    if (debouncedSearch === "") {
      setSearchData([]);
      return;
    }
    const getData = async () => {
      const data = await (await fetch(`/api/getSearch?q=${debouncedSearch}`)).json();
      setSearchData(getMultipleRandom(data, 10));
      setIsLoading(false);
      captureEvent("search", { origin: "home", "search query": debouncedSearch });
    };
    getData();
  }, [debouncedSearch]);

  return (
    <>
      <Header title="Home" />
      <div className="pb-20 overflow-hidden mx-auto bg-white max-w-[420px]">
        <Jumbotron search={search} setSearch={setSearch} />
        <CategoryList categories={categories} />

        {search.length !== 0 && <MainPageSearch data={searchData} isLoading={isLoading} />}
        <RestaurantRow restaurants={restaurant} title={"Lagi hits di Jakarta"} searchCategory={null} />
        <RestaurantRow restaurants={restaurant} title={"Yang manis-manis"} searchCategory={"Dessert"} />
        <RestaurantRow restaurants={restaurant} title={"Buat yang butuh cepet"} searchCategory={"Fast food"} />
        <RestaurantRow restaurants={restaurant} title={"Lagi hits di Jakarta"} searchCategory={null} />

        {/* <RestaurantRow search="Japanese" title={"Oriental taste"} />
        <RestaurantRow search="Noodles" title={"For noodle fan"} /> */}
        {/* <RestaurantRow user={user} search="Japanese" title={"Japanese"} />
        <RestaurantRow user={user} search="Italian" title={"Italian"} /> */}
      </div>
      {/* <p>{JSON.stringify(restoran[0])}</p> */}
      <Navbar user={user} />
    </>
  );
}
