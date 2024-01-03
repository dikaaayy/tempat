import React, { createContext, useEffect, useState } from "react";
import CategoryCard from "../CategoryPage/CategoryCard";
import FilterPage from "./Filter/FilterPage";
import { useRouter } from "next/router";
import { captureEvent } from "../../lib/posthog";

export const FilterContext = createContext(null as any);

const FILTER = [
  {
    name: "<25K/org",
    id: 0,
  },
  {
    id: 1,
    name: "25K-75K/org",
  },
  {
    id: 2,
    name: "75K-150K/org",
  },
  {
    id: 3,
    name: "150K - 250K/org",
  },
  {
    id: 4,
    name: "250K - 400K/org",
  },
  {
    id: 5,
    name: ">400K/org",
  },
];

export default function SearchResult({ query }: any) {
  const [data, setData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [highestPrice, setHighestPrice] = useState<Number>(0);
  const router = useRouter();
  const routePath = router.asPath.split("/")[1];

  const fetchData = async () => {
    const res = await (await fetch(`/api/getSearch?q=${query}`)).json();
    setOriginalData(res);
    captureEvent("search", { origin: "search page", "search query": query });
    setIsLoading(false);
  };
  // useEffect(() => {
  //   if (Object.keys(filter).length === 0) return;

  //   const filtered = data.filter((item: any) => Number(item.priceRange) <= filter.price);
  //   setData(filtered);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [filter]);

  useEffect(() => {
    if (filter === null) return;
    const filtered = originalData.filter((item: any) => Number(item.price_level) === filter);
    setData(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (!query) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // useEffect(() => {
  //   if (data.length === 0) return;
  //   setHighestPrice(
  //     Math.max(
  //       ...data.map((item) => {
  //         return Number(item.priceRange.match(/\d/g).join(""));
  //       })
  //     )
  //   );
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [data]);

  if (!isLoading) {
    if (originalData.length === 0 || (filter !== null && data.length === 0)) {
      return (
        <>
          <div className="flex items-center gap-x-2 overflow-x-scroll mb-4">
            {FILTER.map((item) => {
              return (
                <p
                  key={item.id}
                  onClick={() => {
                    if (filter === item.id) {
                      setFilter(null);
                    } else {
                      setFilter(item.id);
                      captureEvent("set search filter", { origin: "search page", "filter query": item.name });
                    }
                  }}
                  className={`rounded-md border-[1px] py-1 px-2 font-medium w-max shrink-0 cursor-pointer text-sm ${filter === item.id ? "text-[#B42318] border-[#FECDCA] bg-[#FEF3F2]" : "text-[#344054] border-[#EAECF0] bg-[#F9FAFB]"}}`}
                >
                  {item.name}
                </p>
              );
            })}
          </div>

          <div className="flex flex-col gap-y-1 items-center justify-center h-[400px]">
            <img src="https://tempatapp.sgp1.cdn.digitaloceanspaces.com/asset/empty-state-svg.svg" alt="empty-state" className="rounded-lg h-[64px]" />
            <div className="h-[24px]"></div>
            <p className="text-center text-sm font-semibold"> Restoran tidak ditemukan</p>
            <p className="text-center text-xs text-slate-500"> Silahkan cari dengan kata kunci lainnya</p>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="flex items-center gap-x-2 overflow-x-scroll mb-4">
            {FILTER.map((item) => {
              return (
                <p
                  key={item.id}
                  onClick={() => {
                    if (filter === item.id) {
                      setFilter(null);
                    } else {
                      setFilter(item.id);
                      captureEvent("set search filter", { origin: "search page", "filter query": item.name });
                    }
                  }}
                  className={`rounded-md border-[1px] py-1 px-2 font-medium w-max shrink-0 cursor-pointer text-sm ${filter === item.id ? "text-[#B42318] border-[#FECDCA] bg-[#FEF3F2]" : "text-[#344054] border-[#EAECF0] bg-[#F9FAFB]"}}`}
                >
                  {item.name}
                </p>
              );
            })}
          </div>
          <div className="flex flex-col gap-y-4 pb-20">
            {filter !== null
              ? data.map((restaurant: any, i: any, row: any) => {
                  if (i + 1 === row.length) {
                    return <CategoryCard routePath={routePath} i={i} key={i} restaurant={restaurant} isLast={true} />;
                  } else {
                    return <CategoryCard routePath={routePath} i={i} key={i} restaurant={restaurant} isLast={false} />;
                  }
                })
              : originalData.map((restaurant: any, i: any, row: any) => {
                  if (i + 1 === row.length) {
                    return <CategoryCard routePath={routePath} i={i} key={i} restaurant={restaurant} isLast={true} />;
                  } else {
                    return <CategoryCard routePath={routePath} i={i} key={i} restaurant={restaurant} isLast={false} />;
                  }
                })}
          </div>
          {isFilterOpen && (
            <FilterContext.Provider value={{ filter, setFilter, highestPrice, setIsFilterOpen }}>
              <FilterPage />
            </FilterContext.Provider>
          )}
        </>
      );
    }
  } else {
    return (
      <>
        <p className="text-center">sedang mencari...</p>
      </>
    );
  }
}
