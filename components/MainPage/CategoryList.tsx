/* eslint-disable react-hooks/exhaustive-deps */
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { getRandomElementsFromArray } from "../../lib/logic";
import { Category } from "@prisma/client";

export default function CategoryList({ categories }: { categories: Category[] }) {
  function replaceSpacesWithHyphens(inputString: string) {
    return inputString.replace(/ /g, "-");
  }
  return (
    <div className="pt-[36px] px-[16px] grid gap-x-2 gap-y-4 grid-cols-4">
      {categories.map((category: Category, i: number) => {
        const svgSource = `/category/${decodeURI(replaceSpacesWithHyphens(category.name))}.svg`;
        return (
          <Link href={`/category/${category.name}`} key={i}>
            <a className="flex space-y-2 flex-col items-center justify-around">
              <Image src={category.icon! || "https://tempatapp.sgp1.cdn.digitaloceanspaces.com/category/Rice.svg"} width={36} height={36} alt={category.name} loading="eager" />
              <p className="font-medium flex-grow text-center text-xs text-[#364152]">{category.name}</p>
            </a>
          </Link>
        );
      })}
    </div>
  );
}
