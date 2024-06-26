import { useSearchParams } from "next/navigation";

/**
 * An alternative to Object.fromEntries that allows duplicate keys.
 */
function fromEntriesWithDuplicateKeys(entries: ReturnType<ReturnType<typeof useSearchParams>["entries"]>) {
  const result: Record<string, string | string[]> = {};
  // Consider setting atleast ES2015 as target
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const [key, value] of entries) {
    if (result.hasOwnProperty(key)) {
      let currentValue = result[key];
      if (!Array.isArray(currentValue)) {
        currentValue = [currentValue];
      }
      currentValue.push(value);
      result[key] = currentValue;
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * This hook returns the query object from the router. It is an attempt to
 * keep the original query object from the old useRouter hook.
 * At least until everything is properly migrated to the new router.
 * @returns {Object} routerQuery
 */
export const useRouterQuery = () => {
  const searchParams = useSearchParams();
  const routerQuery = fromEntriesWithDuplicateKeys(searchParams.entries());
  return routerQuery;
};
