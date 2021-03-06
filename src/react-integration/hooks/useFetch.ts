import { useMemo } from 'react';

import { ReadShape, Schema } from '../../resource';
import useDispatcher from './useDispatcher';
import useMeta from './useMeta';

/** Returns whether the data at this url is fresh or stale */
function useIsStale<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
>(selectShape: ReadShape<Params, Body, S>, params: Params | null): boolean {
  const meta = useMeta(selectShape, params);
  if (!meta) {
    return true;
  }
  return Date.now() > meta.expiresAt;
}

/** Request a resource if it is not in cache. */
export default function useFetch<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
>(selectShape: ReadShape<Params, Body, S>, params: Params | null, body?: Body) {
  const fetch = useDispatcher(selectShape, true);
  const dataStale = useIsStale(selectShape, params);

  // TODO: figure out how to express that body is optional in RequestShape as we don't need to cast here
  return useMemo(() => {
    if (!dataStale) return;
    // null params mean don't do anything
    if (!params) return;
    return fetch(body as Body, params);
  }, [dataStale, params && selectShape.getUrl(params)]);
}
