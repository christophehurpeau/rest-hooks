import { useContext, useMemo } from 'react';

import { ReadShape } from '../../resource';
import { StateContext } from '../context';
import { makeResults } from '../../state/selectors';

type Resolved<P extends Promise<any>> = P extends Promise<infer R> ? R : any;

// TODO: actually track fetch return type - it's always 'any' now
/** Access result body if available.
 *
 * Useful for retrieving response meta-data like pagination info
 */
export default function useResultSelect<
Params extends Readonly<object>,
D extends object
>(
  { getUrl, fetch }: ReadShape<Params, any, any>,
  params: Params | null,
  defaults?: D
): D extends undefined ? Resolved<ReturnType<typeof fetch>> | null : Readonly<D> {
  const state = useContext(StateContext);
  const resultSelector = useMemo(() => makeResults((p: Params) => getUrl(p)), [
    getUrl,
  ]);
  const results = useMemo(() => params && resultSelector(state, params), [
    state,
    params && getUrl(params),
  ]);
  if (defaults && !results) {
    return defaults as any;
  }
  return results as any;
}
