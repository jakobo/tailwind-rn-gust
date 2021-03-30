import * as React from "react";

export default function wrap(
  tailwindRnCreateResult: object
): {
  tailwind: (
    classNames: string,
    flags: { [key: string]: boolean }
  ) => { [key: string]: string };
  getColor: (color: string, flags: { [key: string]: boolean }) => string;
  gust: (
    Component: function | React.Component,
    defaultClasses?: string,
    useConditions?: function
  ) => function;
};

export const useEvent = (selectors: [string, string], props: object) => [string, object];