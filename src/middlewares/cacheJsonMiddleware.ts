import { NextFunction, Request, Response } from 'express';
import cache from '../utils/cache';

export interface IResponseCached extends Response {
  jsonCached: (body: any) => void;
}

const locks = new Map<string, Promise<void>>();

/**
 * @description Cache the response for the given duration and only cache GET requests
 * @param duration - The duration to cache the response
 * @returns The middleware function
 */
export const cacheJsonMiddleware =
  (duration: number) => async (req: Request, res: IResponseCached, next: NextFunction) => {
    // only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = req.originalUrl;

    // if there was a previous request waiting to get cached data, await it
    const lock = locks.get(key);
    if (lock) await lock;

    // check if the data is cached
    const cachedData = cache.get<string>(key);
    if (cachedData) {
      // cache.set(tempKey, cachedData, duration);
      res.json(JSON.parse(cachedData));
      return;
    }

    // there was no cached data, so we create a new lock and wait for it to be resolved
    const newLock = new Promise<void>(resolve => {
      // in the event that the data is not cached, we resolve the promise after 3 seconds
      const timeoutId = setTimeout(resolve, 3000);

      res.jsonCached = (body: any) => {
        const stringifiedBody = JSON.stringify(body);
        cache.set(key, stringifiedBody, duration);
        res.json(body);

        // resolve the promises and clear the lock; no need to wait for it anymore for future requests
        resolve();
        locks.delete(key);

        // clear the timeout
        clearTimeout(timeoutId);
      };
    });

    // set the new lock
    locks.set(key, newLock);

    // continue to the next middleware
    next();
  };
