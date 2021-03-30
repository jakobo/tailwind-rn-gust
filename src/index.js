import React, { useState, useMemo, forwardRef } from "react";
import { Platform } from "react-native";

/**
 * @typedef {Array} useEventResult
 * @property {boolean} useEventResult[0] The active state of the event hook
 * @property {Object} useEventResult[1] A prop bag of listeners to be spread into your target component
 */

/**
 * React hook that listens to events and triggers state. Supports wrapping
 * existing props and relaying events.
 * @param {array} select An array denoting the [inEvent, outEvent] to listen to
 * @param {string} select[0] the inbound event that will enable this state
 * @param {string} select[1] the outbound event that will disable this state
 * @param {Object} rest a property bag. Any conflicts between `select` and `rest` will be passed through to `rest`
 * @returns {useEventResult} The hook result containing [enabled, listeners]
 */
export const useEvent = (select, rest) => {
  const [active, setActive] = useState(false);
  const events = Array.isArray(select) ? select : Platform.select(select);
  const [inName, outName] = events || [];
  const existingIn = rest?.[inName];
  const existingOut = rest?.[outName];
  const listeners = useMemo(
    () => ({
      [inName]: (...args) => {
        setActive(true);
        if (existingIn && typeof existingIn === "function") {
          existingIn(...args);
        }
      },
      [outName]: (...args) => {
        setActive(false);
        if (existingOut && typeof existingOut === "function") {
          existingOut(...args);
        }
      },
    }),
    [existingIn, existingOut, inName, outName]
  );

  const result = useMemo(() => [active, listeners], [active, listeners]);
  return result;
};

// based on code developed by Matt Apperson
// https://github.com/vadimdemedes/tailwind-rn/issues/19
// resolves tailwind's variant prefixes based on provided flags
const mapPseudoToStyle = (styles, selectors) => {
  if (!selectors) return styles;

  // convert to individual statements
  // drop anything where all pseudos != true
  // clean and return finalized class names
  return `${styles}`
    .split(" ")
    .map((c) => {
      if (!c.includes(":")) return c;
      const parts = c.split(":");
      const pfx = parts.slice(0, -1);
      const cName = parts.slice(-1, 1);
      if (pfx.filter((p) => selectors[p]).length === pfx.length) {
        return cName;
      } else {
        return null;
      }
    })
    .filter((t) => t)
    .join(" ");
};

/**
 * Wrap a tailwind-rn result and enable flag support
 * @param {Object} tailwindResult the result of using tailwind-rn
 * @param {function} tailwindResult.tailwind the tailwind function
 * @param {function} tailwindResult.getColor the getColor function
 * @returns {Object} The tailwind functions wrapped with flag support plus the new gust function
 */
export default function wrap({ tailwind: t, getColor: gc, ...rest }) {
  const tCache = {};
  const gCache = {};

  // clean the styles, making splits and loops faster
  const clean = (s) => `${s || ""}`.replace(/\s\s+/g, " ").trim();

  // cache key based on classes + flags to avoid recomputes
  const getKey = (className, flags) => {
    const flagKey = flags
      ? Object.getOwnPropertyNames(flags)
          .sort()
          .reduce((curr, name) => {
            const next = `${name}\x00${flags[name] ? 1 : 0}`;
            return [...curr, next];
          }, [])
      : "-";
    return `${className}\x00\x00${flagKey}`;
  };

  // return the cache key and any cached value
  const cached = (cache, className, flags) => {
    const key = getKey(className, flags);
    return [key, cache[key] || null];
  };

  const useNoConditions = () => {
    return useMemo(() => [{}, {}], []);
  };

  /**
   * tailwind - Use tailwind classes with flags to enable additional variants
   * @param {string} className a list of tailwind classes
   * @param {Object} flags an object defining any pseudo flags to enable such as "active:"
   * @returns {Object} tailwind style object
   */
  const tailwind = (className, flags) => {
    const cleaned = clean(className);
    const [key, value] = cached(tCache, cleaned, flags);
    if (value) return value;

    const result = t(flags ? mapPseudoToStyle(cleaned, flags) : cleaned);
    tCache[key] = result;
    return result;
  };

  /**
   * getColor - Use tailwind classes with flags to retrieve a color value
   * @param {string} className a list of tailwind classes
   * @param {Object} flags an object defining any pseudo flags to enable such as "active:"
   * @returns {string} tailwind color value
   */
  const getColor = (className, flags) => {
    const cleaned = clean(className);
    const [key, value] = cached(gCache, cleaned, flags);
    if (value) return value;

    const result = gc(flags ? mapPseudoToStyle(cleaned, flags) : cleaned);
    gCache[key] = result;
    return result;
  };

  /**
   * gust - Wrap a component to translate the className prop into a tailwind-rn style object
   * @param {React.Component} Component a react component
   * @param {string} defaultClasses any default classes to attach on all instances of the component
   * @returns {React.Component} a Gust-Wrapped component
   */
  const gust = (Component, defaultClasses, useConditions = useNoConditions) => {
    const Gusted = forwardRef((props, ref) => {
      const { className, style, ...rest } = props;
      const [conditions, listeners] = useConditions(props);
      const allClassNames = `${defaultClasses || ""} ${className || ""}`.trim();
      const gusted = allClassNames ? tailwind(allClassNames, conditions) : null;
      return (
        <Component ref={ref} style={[gusted, style]} {...rest} {...listeners} />
      );
    });
    Gusted.displayName = `${Component.displayName || "Component"} (gust)`;
    return Gusted;
  };
  
  return { tailwind, getColor, gust, ...rest };
}
