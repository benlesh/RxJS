import { ObservableInputTuple, OperatorFunction, SchedulerLike } from '../types';
import { operate } from '../util/lift';
import { concatAll } from './concatAll';
import { internalFromArray } from '../observable/fromArray';
import { popScheduler } from '../util/args';

/** @deprecated remove in v8. Use {@link concatWith} */
export function concat<T, A extends readonly unknown[]>(...sources: [...ObservableInputTuple<A>]): OperatorFunction<T, T | A[number]>;
/** @deprecated remove in v8. Use {@link concatWith} */
export function concat<T, A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...ObservableInputTuple<A>, SchedulerLike]
): OperatorFunction<T, T | A[number]>;

/**
 * @deprecated remove in v8. Use {@link concatWith}
 */
export function concat<T, R>(...args: any[]): OperatorFunction<T, R> {
  const scheduler = popScheduler(args);
  return operate((source, subscriber) => {
    concatAll()(internalFromArray([source, ...args], scheduler)).subscribe(subscriber as any);
  });
}
