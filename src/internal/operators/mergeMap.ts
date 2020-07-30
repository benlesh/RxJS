import { Observable } from '../Observable';
import { Operator } from '../Operator';
import { Subscriber } from '../Subscriber';
import { Subscription } from '../Subscription';
import { ObservableInput, OperatorFunction, ObservedValueOf } from '../types';
import { map } from './map';
import { from } from '../observable/from';
import { lift } from '../util/lift';
import { subscribeToResult2, SimpleOuterSubscriber, SimpleInnerSubscriber } from '../innies-and-outies';

/* tslint:disable:max-line-length */
export function mergeMap<T, O extends ObservableInput<any>>(project: (value: T, index: number) => O, concurrent?: number): OperatorFunction<T, ObservedValueOf<O>>;
/** @deprecated resultSelector no longer supported, use inner map instead */
export function mergeMap<T, O extends ObservableInput<any>>(project: (value: T, index: number) => O, resultSelector: undefined, concurrent?: number): OperatorFunction<T, ObservedValueOf<O>>;
/** @deprecated resultSelector no longer supported, use inner map instead */
export function mergeMap<T, R, O extends ObservableInput<any>>(project: (value: T, index: number) => O, resultSelector: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R, concurrent?: number): OperatorFunction<T, R>;
/* tslint:enable:max-line-length */

/**
 * Projects each source value to an Observable which is merged in the output
 * Observable.
 *
 * <span class="informal">Maps each value to an Observable, then flattens all of
 * these inner Observables using {@link mergeAll}.</span>
 *
 * ![](mergeMap.png)
 *
 * Returns an Observable that emits items based on applying a function that you
 * supply to each item emitted by the source Observable, where that function
 * returns an Observable, and then merging those resulting Observables and
 * emitting the results of this merger.
 *
 * ## Example
 * Map and flatten each letter to an Observable ticking every 1 second
 * ```ts
 * import { of, interval } from 'rxjs';
 * import { mergeMap, map } from 'rxjs/operators';
 *
 * const letters = of('a', 'b', 'c');
 * const result = letters.pipe(
 *   mergeMap(x => interval(1000).pipe(map(i => x+i))),
 * );
 * result.subscribe(x => console.log(x));
 *
 * // Results in the following:
 * // a0
 * // b0
 * // c0
 * // a1
 * // b1
 * // c1
 * // continues to list a,b,c with respective ascending integers
 * ```
 *
 * @see {@link concatMap}
 * @see {@link exhaustMap}
 * @see {@link merge}
 * @see {@link mergeAll}
 * @see {@link mergeMapTo}
 * @see {@link mergeScan}
 * @see {@link switchMap}
 *
 * @param {function(value: T, ?index: number): ObservableInput} project A function
 * that, when applied to an item emitted by the source Observable, returns an
 * Observable.
 * @param {number} [concurrent=Infinity] Maximum number of input
 * Observables being subscribed to concurrently.
 * @return {Observable} An Observable that emits the result of applying the
 * projection function (and the optional deprecated `resultSelector`) to each item
 * emitted by the source Observable and merging the results of the Observables
 * obtained from this transformation.
 */
export function mergeMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: ((outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R) | number,
  concurrent: number = Infinity
): OperatorFunction<T, ObservedValueOf<O>|R> {
  if (typeof resultSelector === 'function') {
    // DEPRECATED PATH
    return (source: Observable<T>) => source.pipe(
      mergeMap((a, i) => from(project(a, i)).pipe(
        map((b: any, ii: number) => resultSelector(a, b, i, ii)),
      ), concurrent)
    );
  } else if (typeof resultSelector === 'number') {
    concurrent = resultSelector;
  }
  return (source: Observable<T>) => lift(source, new MergeMapOperator(project, concurrent));
}

export class MergeMapOperator<T, R> implements Operator<T, R> {
  constructor(private project: (value: T, index: number) => ObservableInput<R>,
              private concurrent: number = Infinity) {
  }

  call(observer: Subscriber<R>, source: any): any {
    return source.subscribe(new MergeMapSubscriber(
      observer, this.project, this.concurrent
    ));
  }
}

/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
export class MergeMapSubscriber<T, R> extends SimpleOuterSubscriber<T, R> {
  private hasCompleted: boolean = false;
  private buffer: T[] = [];
  private active: number = 0;
  protected index: number = 0;

  constructor(protected destination: Subscriber<R>,
              private project: (value: T, index: number) => ObservableInput<R>,
              private concurrent: number = Infinity) {
    super(destination);
  }

  protected _next(value: T): void {
    if (this.active < this.concurrent) {
      let result: ObservableInput<R>;
      const index = this.index++;
      try {
        result = this.project(value, index);
      } catch (err) {
        this.destination.error(err);
        return;
      }
      this.active++;
      const innerSubscriber = new SimpleInnerSubscriber(this);
      const destination = this.destination as Subscription;
      destination.add(innerSubscriber);
      subscribeToResult2(result, innerSubscriber);
    } else {
      this.buffer.push(value);
    }
  }

  protected _complete(): void {
    this.hasCompleted = true;
    if (this.active === 0 && this.buffer.length === 0) {
      this.destination.complete();
    }
    this.unsubscribe();
  }

  notifyNext(innerValue: R): void {
    this.destination.next(innerValue);
  }

  notifyComplete(): void {
    const buffer = this.buffer;
    this.active--;
    if (buffer.length > 0) {
      this._next(buffer.shift()!);
    } else if (this.active === 0 && this.hasCompleted) {
      this.destination.complete();
    }
  }
}

/**
 * @deprecated renamed. Use {@link mergeMap}.
 */
export const flatMap = mergeMap;